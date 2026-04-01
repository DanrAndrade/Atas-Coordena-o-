import json
import pandas as pd
import io
import html
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from ..models import db, Professor, Ata, Compromisso, Tag, get_local_now
from .auth_routes import token_required

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from html.parser import HTMLParser
import html as python_html

class ReportLabHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output = []
        self.list_type = []
        self.list_counters = []
        
    def handle_starttag(self, tag, attrs):
        if tag in ['b', 'strong']: self.output.append('<b>')
        elif tag in ['i', 'em']: self.output.append('<i>')
        elif tag in ['u']: self.output.append('<u>')
        elif tag in ['s', 'strike']: self.output.append('<strike>')
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']: self.output.append('<b>')
        elif tag == 'br': self.output.append('<br/>')
        elif tag == 'ul':
            self.list_type.append('ul')
            self.list_counters.append(0)
        elif tag == 'ol':
            self.list_type.append('ol')
            self.list_counters.append(0)
        elif tag == 'li':
            if self.list_type:
                if self.list_type[-1] == 'ul':
                    self.output.append('&bull; ')
                else:
                    self.list_counters[-1] += 1
                    self.output.append(f"{self.list_counters[-1]}. ")
            else:
                self.output.append('&bull; ')

    def handle_endtag(self, tag):
        if tag in ['b', 'strong']: self.output.append('</b>')
        elif tag in ['i', 'em']: self.output.append('</i>')
        elif tag in ['u']: self.output.append('</u>')
        elif tag in ['s', 'strike']: self.output.append('</strike>')
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']: self.output.append('</b><br/>')
        elif tag == 'p': self.output.append('<br/>')
        elif tag in ['ul', 'ol']:
            if self.list_type:
                self.list_type.pop()
                self.list_counters.pop()
        elif tag == 'li':
            self.output.append('<br/>')

    def handle_data(self, data):
        data = data.replace('\n', '').replace('\r', '')
        if data:
            self.output.append(python_html.escape(data))

    def handle_entityref(self, name):
        decoded = python_html.unescape(f'&{name};')
        if decoded in ('<', '>', '&'): self.output.append(python_html.escape(decoded))
        else: self.output.append(decoded)
        
    def handle_charref(self, name):
        decoded = python_html.unescape(f'&#{name};')
        if decoded in ('<', '>', '&'): self.output.append(python_html.escape(decoded))
        else: self.output.append(decoded)

def clean_html_for_reportlab(html_text):
    if not html_text:
        return "Nenhum relato adicional."
    parser = ReportLabHTMLParser()
    parser.feed(html_text)
    result = "".join(parser.output)
    # Replaces multiple contiguous <br/> with fewer to avoid huge spacing
    while result.endswith('<br/>'):
        result = result[:-5]
    return result.strip() or "Nenhum relato adicional."

api_bp = Blueprint('api', __name__)

@api_bp.route('/professores', methods=['GET'])
@token_required
def get_professores(current_user):
    professores = Professor.query.all()
    return jsonify([{'id': p.id, 'nome': p.nome, 'disciplina': p.disciplina, 'turmas': p.turmas} for p in professores]), 200

@api_bp.route('/professores', methods=['POST'])
@token_required
def create_professor(current_user):
    dados = request.get_json()
    if not dados or not dados.get('nome'):
        return jsonify({'erro': 'O nome é obrigatório'}), 400
    novo_prof = Professor(nome=dados['nome'], disciplina=dados.get('disciplina'), turmas=dados.get('turmas'))
    db.session.add(novo_prof)
    db.session.commit()
    return jsonify({'mensagem': 'Professor criado!', 'id': novo_prof.id}), 201

@api_bp.route('/professores/importar', methods=['POST'])
@token_required
def importar_professores(current_user):
    if 'arquivo' not in request.files: return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
    arquivo = request.files['arquivo']
    if arquivo.filename == '': return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400
    try:
        df = pd.read_csv(arquivo) if arquivo.filename.endswith('.csv') else pd.read_excel(arquivo)
        
        relatorio = {
            'novos': 0,
            'atualizados': 0,
            'detalhes_atualizacoes': []
        }
        
        for _, row in df.iterrows():
            nome = row.get('nome')
            if pd.notna(nome):
                nome_str = str(nome).strip()
                if not nome_str: continue
                
                disciplina_val = row.get('disciplina')
                turmas_val = row.get('turmas')
                
                existente = Professor.query.filter(Professor.nome.ilike(nome_str)).first()
                
                if existente:
                    campos_alterados = []
                    # Atualiza os dados se a planilha contiver informações não vazias
                    if pd.notna(disciplina_val) and str(disciplina_val).strip():
                        novo_disc = str(disciplina_val).strip()
                        if existente.disciplina != novo_disc:
                            existente.disciplina = novo_disc
                            campos_alterados.append('disciplina')
                            
                    if pd.notna(turmas_val) and str(turmas_val).strip():
                        nova_turma = str(turmas_val).strip()
                        if existente.turmas != nova_turma:
                            existente.turmas = nova_turma
                            campos_alterados.append('turmas')
                            
                    if campos_alterados:
                        relatorio['atualizados'] += 1
                        relatorio['detalhes_atualizacoes'].append({
                            'nome': existente.nome,
                            'alteracoes': campos_alterados
                        })
                else:
                    # Insere novo professor
                    disciplina_str = str(disciplina_val).strip() if pd.notna(disciplina_val) else ''
                    turmas_str = str(turmas_val).strip() if pd.notna(turmas_val) else ''
                    prof = Professor(nome=nome_str, disciplina=disciplina_str, turmas=turmas_str)
                    db.session.add(prof)
                    relatorio['novos'] += 1
                    
        db.session.commit()
        return jsonify({
            'mensagem': 'Importação concluída!',
            'relatorio': relatorio
        }), 200
    except Exception as e:
        return jsonify({'erro': f'Erro ao processar arquivo: {str(e)}'}), 500

@api_bp.route('/atas', methods=['POST'])
@token_required
def create_ata(current_user):
    dados = request.get_json()
    nova_ata = Ata(
        professor_id=dados.get('professor_id'),
        coordenador_id=current_user.id,
        registros_portal=dados.get('registros_portal', ''),
        observacoes_professor_texto=dados.get('observacoes_professor_texto', ''),
        observacoes_coordenacao_texto=dados.get('observacoes_coordenacao_texto', ''),
        temas_ids=json.dumps(dados.get('temas_ids', [])),
        tags_obs_ids=json.dumps(dados.get('tags_obs_ids', [])),
        status='fechada'
    )
    db.session.add(nova_ata)
    db.session.flush() 
    
    novos_compromissos = dados.get('novos_compromissos', [])
    for comp in novos_compromissos:
        if comp.get('descricao'):
            prazo = None
            if comp.get('data_prazo_limite'):
                try: prazo = datetime.strptime(comp['data_prazo_limite'], '%Y-%m-%d')
                except: pass
            novo_comp = Compromisso(ata_id=nova_ata.id, descricao=comp['descricao'], data_prazo_limite=prazo, status='pendente', ata_origem_id=nova_ata.id)
            db.session.add(novo_comp)
            
    concluidos_ids = dados.get('compromissos_concluidos', [])
    if concluidos_ids:
        Compromisso.query.filter(Compromisso.id.in_(concluidos_ids)).update({"status": "concluido", "data_cumprimento": get_local_now()}, synchronize_session=False)
            
    db.session.commit()
    return jsonify({'mensagem': 'Ata criada com sucesso!', 'id': nova_ata.id}), 201

@api_bp.route('/professores/<int:id>/atas', methods=['GET'])
@token_required
def get_atas_professor(current_user, id):
    professor = Professor.query.get(id)
    if not professor: return jsonify([]), 200
    atas = Ata.query.filter_by(professor_id=id).order_by(Ata.id.desc()).all()
    resultado = []
    for ata in atas:
        compromissos_db = Compromisso.query.filter_by(ata_id=ata.id).all()
        compromissos_lista = [{'id': c.id, 'descricao': c.descricao, 'status': c.status, 'data_prazo': c.data_prazo_limite.strftime('%d/%m/%Y') if getattr(c, 'data_prazo_limite', None) else None} for c in compromissos_db]
        tags_coordenacao = []
        if getattr(ata, 'tags_obs_ids', None):
            try: tags_coordenacao = [t.nome for t in Tag.query.filter(Tag.id.in_(json.loads(ata.tags_obs_ids))).all()]
            except: pass
        resultado.append({'id': ata.id, 'data_criacao': ata.data_criacao.strftime('%d/%m/%Y %H:%M') if getattr(ata, 'data_criacao', None) else 'Sem data', 'status': getattr(ata, 'status', 'fechada'), 'compromissos': compromissos_lista, 'tags_coordenacao': tags_coordenacao})
    return jsonify(resultado), 200

@api_bp.route('/professores/<int:id>/pendencias', methods=['GET'])
@token_required
def get_pendencias_professor(current_user, id):
    atas_ids = [a.id for a in Ata.query.filter_by(professor_id=id).all()]
    if not atas_ids: return jsonify([]), 200
    pendencias = Compromisso.query.filter(Compromisso.ata_id.in_(atas_ids), Compromisso.status == 'pendente').all()
    resultado = []
    for c in pendencias:
        data_origem = c.ata.data_criacao if c.ata and c.ata.data_criacao else get_local_now()
        data_prazo = None
        if c.data_prazo_limite:
            try: data_prazo = c.data_prazo_limite.strftime('%d/%m/%Y')
            except AttributeError: data_prazo = str(c.data_prazo_limite)
        resultado.append({'id': c.id, 'descricao': c.descricao, 'data_origem': data_origem.strftime('%d/%m/%Y'), 'data_prazo': data_prazo})
    return jsonify(resultado), 200

@api_bp.route('/compromissos/<int:id>/concluir', methods=['PUT'])
@token_required
def concluir_compromisso(current_user, id):
    comp = Compromisso.query.get_or_404(id)
    comp.status = 'concluido'
    comp.data_cumprimento = get_local_now()
    db.session.commit()
    return jsonify({'mensagem': 'Compromisso concluído com sucesso!'}), 200

@api_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    atas = list(Ata.query.all())
    todas_tags_ids = []
    for a in atas:
        if a.tags_obs_ids:
            try: todas_tags_ids.extend(json.loads(a.tags_obs_ids))
            except: pass
        if a.temas_ids:
            try: todas_tags_ids.extend(json.loads(a.temas_ids))
            except: pass

    from collections import Counter
    tag_counts = Counter(todas_tags_ids)
    all_tag_ids = list(tag_counts.keys())
    tags_db = {t.id: t for t in Tag.query.filter(Tag.id.in_(all_tag_ids)).all()} if all_tag_ids else {}
    
    temas_list = []
    observacoes_list = []
    
    total_temas = sum(count for tid, count in tag_counts.items() if tid in tags_db and tags_db[tid].tipo == 'tema')
    total_obs = sum(count for tid, count in tag_counts.items() if tid in tags_db and tags_db[tid].tipo == 'observacao')
    
    for tid, count in tag_counts.most_common():
        if tid in tags_db:
            tag_obj = tags_db[tid]
            if tag_obj.tipo == 'tema':
                temas_list.append({'nome': tag_obj.nome, 'quantidade': count})
            else:
                observacoes_list.append({'nome': tag_obj.nome, 'quantidade': count})
                
    # ALGORITMO DO MAIOR RESTO: Garante soma EXATA de 100.0%
    def calculate_exact_percentages(items_list, total_count):
        if not items_list or total_count == 0:
            return
        
        # Multiplicamos por 1000 para preservar 1 casa decimal (ex: 33.333 -> 333.33)
        for item in items_list:
            exact_pct = (item['quantidade'] / total_count) * 1000
            item['floor_pct'] = int(exact_pct)
            item['remainder'] = exact_pct - item['floor_pct']
            
        current_sum = sum(item['floor_pct'] for item in items_list)
        diff = int(1000 - current_sum)
        
        # Distribui os décimos que faltam para os itens com maior fração restante
        items_list.sort(key=lambda x: x['remainder'], reverse=True)
        for i in range(diff):
            items_list[i % len(items_list)]['floor_pct'] += 1
            
        # Formata o output e remove variáveis temporárias
        for item in items_list:
            item['porcentagem'] = item['floor_pct'] / 10.0
            del item['floor_pct']
            del item['remainder']
            
        # Reordena por quantidade para exibição
        items_list.sort(key=lambda x: x['quantidade'], reverse=True)

    calculate_exact_percentages(temas_list, total_temas)
    calculate_exact_percentages(observacoes_list, total_obs)
    
    pendencias_abertas_qs = Compromisso.query.filter_by(status='pendente').all()
    dict_pendencias = {}
    for c in pendencias_abertas_qs:
        if c.ata and c.ata.professor: dict_pendencias[c.ata.professor.id] = c.ata.professor.nome
    profs_pendencias = sorted([{'id': k, 'nome': v} for k, v in dict_pendencias.items()], key=lambda x: x['nome'])

    atas_ordenadas = sorted(atas, key=lambda x: x.data_criacao, reverse=True)
    professores_verificados = set()
    portal_sim = 0
    portal_nao = 0
    dict_portal = {}

    for a in atas_ordenadas:
        if a.professor_id not in professores_verificados:
            professores_verificados.add(a.professor_id)
            if a.registros_portal.lower() in ['sim', 'em dia', 'completo']:
                portal_sim += 1
            else:
                portal_nao += 1
                if a.professor: dict_portal[a.professor.id] = a.professor.nome

    profs_portal_pendente = sorted([{'id': k, 'nome': v} for k, v in dict_portal.items()], key=lambda x: x['nome'])

    return jsonify({
        'total_professores': Professor.query.count(),
        'total_atas': len(atas),
        'pendencias_abertas': len(pendencias_abertas_qs),
        'pendencias_concluidas': Compromisso.query.filter_by(status='concluido').count(),
        'portal_em_dia': portal_sim,
        'portal_pendente': portal_nao,
        'professores_metas_abertas': profs_pendencias,
        'professores_portal_pendente': profs_portal_pendente,
        'top_temas': temas_list, 
        'top_observacoes': observacoes_list 
    }), 200

@api_bp.route('/tags', methods=['GET'])
@token_required
def get_tags(current_user):
    tipo = request.args.get('tipo')
    tags = Tag.query.filter_by(tipo=tipo).all() if tipo else Tag.query.all()
    return jsonify([{'id': t.id, 'nome': t.nome, 'tipo': t.tipo} for t in tags]), 200

@api_bp.route('/tags', methods=['POST'])
@token_required
def create_tag(current_user):
    dados = request.get_json()
    if not dados or not dados.get('nome') or not dados.get('tipo'): return jsonify({'erro': 'Campos obrigatórios.'}), 400
    nova_tag = Tag(nome=dados.get('nome'), tipo=dados.get('tipo'))
    db.session.add(nova_tag)
    db.session.commit()
    return jsonify({'mensagem': 'Tag criada!', 'id': nova_tag.id}), 201

@api_bp.route('/tags/<int:id>', methods=['PUT', 'DELETE'])
@token_required
def manage_tag(current_user, id):
    tag = Tag.query.get_or_404(id)
    if request.method == 'PUT':
        dados = request.get_json()
        if 'nome' in dados: tag.nome = dados['nome']
        if 'tipo' in dados: tag.tipo = dados['tipo']
        msg = 'Tag atualizada!'
    else:
        db.session.delete(tag)
        msg = 'Tag excluída!'
    db.session.commit()
    return jsonify({'mensagem': msg}), 200

@api_bp.route('/atas/<int:id>/pdf', methods=['GET'])
@token_required
def gerar_pdf_ata(current_user, id):
    ata = Ata.query.get_or_404(id)
    prof = Professor.query.get(ata.professor_id)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=15, bottomMargin=20)
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(name='OficialHeader', fontName='Helvetica-Bold', fontSize=12, alignment=1, spaceAfter=2, textColor=colors.black))
    styles.add(ParagraphStyle(name='OficialSub', fontName='Helvetica', fontSize=10, alignment=1, spaceAfter=20, textColor=colors.black))
    styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=10, spaceBefore=15, spaceAfter=8, textColor=colors.black))
    styles.add(ParagraphStyle(name='TextNormal', fontName='Helvetica', fontSize=10, leading=14, textColor=colors.black))

    elements = []
    logo_path = os.path.abspath(os.path.join(current_app.root_path, '..', 'frontend', 'public', 'images', 'logo.png'))
    if os.path.exists(logo_path):
        from reportlab.lib.utils import ImageReader
        img_reader = ImageReader(logo_path)
        img_w, img_h = img_reader.getSize()
        target_width = 1.5 * 72 
        target_height = target_width * (img_h / img_w)
        img = Image(logo_path, width=target_width, height=target_height)
        img.hAlign = 'CENTER'
        elements.append(img)
        elements.append(Spacer(1, 20))

    elements.append(Paragraph("INSTITUTO ASSOCIADOS SABER E CULTURA", styles['OficialHeader']))
    elements.append(Paragraph("DEPARTAMENTO DE COORDENAÇÃO PEDAGÓGICA", styles['OficialSub']))
    elements.append(Paragraph(f"ATA DE REUNIÃO DE ALINHAMENTO Nº {ata.id}", styles['OficialHeader']))
    elements.append(Spacer(1, 15))

    dados_pessoais = [
        [Paragraph("<b>PROFESSOR(A):</b>", styles['TextNormal']), Paragraph(prof.nome.upper() if prof else "-", styles['TextNormal'])],
        [Paragraph("<b>DISCIPLINA:</b>", styles['TextNormal']), Paragraph(prof.disciplina.upper() if prof and prof.disciplina else "-", styles['TextNormal'])],
        [Paragraph("<b>TURMAS:</b>", styles['TextNormal']), Paragraph(prof.turmas.upper() if prof and prof.turmas else "-", styles['TextNormal'])],
        [Paragraph("<b>COORDENAÇÃO:</b>", styles['TextNormal']), Paragraph(current_user.nome.upper(), styles['TextNormal'])],
        [Paragraph("<b>DATA DA REUNIÃO:</b>", styles['TextNormal']), Paragraph(ata.data_criacao.strftime('%d/%m/%Y às %H:%M'), styles['TextNormal'])],
        [Paragraph("<b>SITUAÇÃO DO PORTAL:</b>", styles['TextNormal']), Paragraph("EM DIA" if ata.registros_portal.lower() == 'sim' else "PENDENTE", styles['TextNormal'])]
    ]
    t1 = Table(dados_pessoais, colWidths=[160, 310])
    t1.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 0.5, colors.black), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('PADDING', (0,0), (-1,-1), 6)]))
    elements.append(t1)
    elements.append(Spacer(1, 10))

    for titulo, ids_json in [("TEMAS ABORDADOS NA REUNIÃO:", ata.temas_ids), ("OBSERVAÇÕES DA COORDENAÇÃO:", ata.tags_obs_ids)]:
        if ids_json:
            try:
                ids = json.loads(ids_json)
                nomes = [t.nome for t in Tag.query.filter(Tag.id.in_(ids)).all()]
                if nomes:
                    elements.append(Paragraph(titulo, styles['SectionTitle']))
                    elements.append(Paragraph(", ".join(nomes).upper(), styles['TextNormal']))
            except: pass

    elements.append(Paragraph("RELATO DA COORDENAÇÃO:", styles['SectionTitle']))
    elements.append(Paragraph(clean_html_for_reportlab(ata.observacoes_coordenacao_texto), styles['TextNormal']))

    elements.append(Paragraph("RELATO DO(A) PROFESSOR(A):", styles['SectionTitle']))
    elements.append(Paragraph(clean_html_for_reportlab(ata.observacoes_professor_texto), styles['TextNormal']))

    elements.append(Paragraph("COMBINADOS E PRAZOS DEFINIDOS:", styles['SectionTitle']))
    comps = Compromisso.query.filter_by(ata_id=ata.id).all()
    if comps:
        c_table_data = [["DESCRIÇÃO DO COMPROMISSO", "PRAZO", "STATUS"]]
        for c in comps:
            prazo = c.data_prazo_limite.strftime('%d/%m/%Y') if c.data_prazo_limite else "-"
            c_table_data.append([Paragraph(c.descricao.upper(), styles['TextNormal']), prazo, c.status.upper()])
        
        t2 = Table(c_table_data, colWidths=[310, 80, 80])
        t2.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 0.5, colors.black), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e5e5e5")), ('ALIGN', (1,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('PADDING', (0,0), (-1,-1), 5)]))
        elements.append(t2)
    else: elements.append(Paragraph("NENHUM COMPROMISSO NOVO REGISTRADO.", styles['TextNormal']))

    elements.append(Spacer(1, 30))
    t3 = Table([["_______________________________________", "_______________________________________"], ["Assinatura da Coordenação Pedagógica", "Assinatura do(a) Professor(a)"]], colWidths=[235, 235])
    t3.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('FONTSIZE', (0,1), (-1,1), 9), ('FONTNAME', (0,1), (-1,1), 'Helvetica')]))
    elements.append(t3)

    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"Ata_{ata.id}_{prof.nome.replace(' ', '_') if prof else 'IASC'}.pdf", mimetype='application/pdf')