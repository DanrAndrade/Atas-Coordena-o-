import json
import pandas as pd
import io
import html
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from ..models import db, Professor, Ata, Compromisso, Tag
from .auth_routes import token_required

# Bibliotecas para o PDF Oficial
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Criação do Blueprint (Mantendo a sua versão que corrige o erro do servidor)
api_bp = Blueprint('api', __name__)

# ==========================================
# ROTAS DE PROFESSORES
# ==========================================
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
    if 'arquivo' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
    arquivo = request.files['arquivo']
    if arquivo.filename == '':
        return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400
    
    try:
        if arquivo.filename.endswith('.csv'):
            df = pd.read_csv(arquivo)
        else:
            df = pd.read_excel(arquivo)
            
        for _, row in df.iterrows():
            nome = row.get('nome')
            if pd.notna(nome):
                prof = Professor(
                    nome=str(nome).strip(),
                    disciplina=str(row.get('disciplina', '')).strip(),
                    turmas=str(row.get('turmas', '')).strip()
                )
                db.session.add(prof)
        db.session.commit()
        return jsonify({'mensagem': 'Importação concluída com sucesso!'}), 200
    except Exception as e:
        return jsonify({'erro': f'Erro ao processar arquivo: {str(e)}'}), 500

# ==========================================
# ROTAS DE ATAS E COMPROMISSOS
# ==========================================
@api_bp.route('/atas', methods=['POST'])
@token_required
def create_ata(current_user):
    dados = request.get_json()
    nova_ata = Ata(
        professor_id=dados.get('professor_id'),
        coordenador_id=current_user.id, # Agora usa o coordenador logado
        registros_portal=dados.get('registros_portal', ''),
        observacoes_professor_texto=dados.get('observacoes_professor_texto', ''),
        observacoes_coordenacao_texto=dados.get('observacoes_coordenacao_texto', ''),
        temas_ids=json.dumps(dados.get('temas_ids', [])),
        tags_obs_ids=json.dumps(dados.get('tags_obs_ids', [])),
        status='fechada'
    )
    db.session.add(nova_ata)
    db.session.flush() # Para pegar o ID da ata gerada
    
    # 1. Processar Novos Compromissos
    novos_compromissos = dados.get('novos_compromissos', [])
    for comp in novos_compromissos:
        if comp.get('descricao'):
            prazo = None
            if comp.get('data_prazo_limite'):
                try:
                    prazo = datetime.strptime(comp['data_prazo_limite'], '%Y-%m-%d')
                except: pass
            
            novo_comp = Compromisso(
                ata_id=nova_ata.id,
                descricao=comp['descricao'],
                data_prazo_limite=prazo,
                status='pendente',
                ata_origem_id=nova_ata.id
            )
            db.session.add(novo_comp)
            
    # 2. Processar Compromissos Antigos Concluídos
    concluidos_ids = dados.get('compromissos_concluidos', [])
    if concluidos_ids:
        Compromisso.query.filter(Compromisso.id.in_(concluidos_ids)).update(
            {"status": "concluido", "data_cumprimento": datetime.utcnow()}, synchronize_session=False
        )
            
    db.session.commit()
    return jsonify({'mensagem': 'Ata criada com sucesso!', 'id': nova_ata.id}), 201

@api_bp.route('/professores/<int:id>/atas', methods=['GET'])
@token_required
def get_atas_professor(current_user, id):
    professor = Professor.query.get(id)
    if not professor:
        return jsonify([]), 200
    atas = Ata.query.filter_by(professor_id=id).order_by(Ata.id.desc()).all()
    
    resultado = []
    for ata in atas:
        compromissos_db = Compromisso.query.filter_by(ata_id=ata.id).all()
        compromissos_lista = [{
            'id': c.id,
            'descricao': c.descricao,
            'status': c.status,
            'data_prazo': c.data_prazo_limite.strftime('%d/%m/%Y') if hasattr(c, 'data_prazo_limite') and c.data_prazo_limite else None
        } for c in compromissos_db]
        
        tags_coordenacao = []
        if hasattr(ata, 'tags_obs_ids') and ata.tags_obs_ids:
            try:
                ids_tags = json.loads(ata.tags_obs_ids)
                # Resolução direta dos Nomes reais para o Perfil
                tags_coordenacao = [t.nome for t in Tag.query.filter(Tag.id.in_(ids_tags)).all()]
            except:
                tags_coordenacao = []

        resultado.append({
            'id': ata.id,
            'data_criacao': ata.data_criacao.strftime('%d/%m/%Y %H:%M') if hasattr(ata, 'data_criacao') and ata.data_criacao else 'Sem data',
            'status': getattr(ata, 'status', 'fechada'),
            'compromissos': compromissos_lista,
            'tags_coordenacao': tags_coordenacao
        })
        
    return jsonify(resultado), 200

# ==========================================
# NOVAS ROTAS (PENDÊNCIAS E DASHBOARD)
# ==========================================
@api_bp.route('/professores/<int:id>/pendencias', methods=['GET'])
@token_required
def get_pendencias_professor(current_user, id):
    atas_ids = [a.id for a in Ata.query.filter_by(professor_id=id).all()]
    if not atas_ids:
        return jsonify([]), 200
        
    pendencias = Compromisso.query.filter(Compromisso.ata_id.in_(atas_ids), Compromisso.status == 'pendente').all()
    
    resultado = []
    for c in pendencias:
        data_origem_dt = datetime.utcnow()
        if c.ata and getattr(c.ata, 'data_criacao', None):
            data_origem_dt = c.ata.data_criacao
            
        data_prazo = None
        if getattr(c, 'data_prazo_limite', None):
            try:
                data_prazo = c.data_prazo_limite.strftime('%d/%m/%Y')
            except AttributeError:
                data_prazo = str(c.data_prazo_limite)
                
        resultado.append({
            'id': c.id,
            'descricao': c.descricao,
            'data_origem': data_origem_dt.strftime('%d/%m/%Y'),
            'data_prazo': data_prazo
        })
        
    return jsonify(resultado), 200

@api_bp.route('/compromissos/<int:id>/concluir', methods=['PUT'])
@token_required
def concluir_compromisso(current_user, id):
    comp = Compromisso.query.get_or_404(id)
    comp.status = 'concluido'
    comp.data_cumprimento = datetime.utcnow()
    db.session.commit()
    return jsonify({'mensagem': 'Compromisso concluído com sucesso!'}), 200

@api_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    atas = Ata.query.all()
    portal_sim = sum(1 for a in atas if a.registros_portal.lower() in ['sim', 'em dia', 'completo'])
    portal_nao = len(atas) - portal_sim

    todas_tags_ids = []
    for a in atas:
        if a.tags_obs_ids:
            try: todas_tags_ids.extend(json.loads(a.tags_obs_ids))
            except: pass
        if a.temas_ids:
            try: todas_tags_ids.extend(json.loads(a.temas_ids))
            except: pass

    # Count frequencies
    from collections import Counter
    tag_counts = Counter(todas_tags_ids)
    all_tag_ids = list(tag_counts.keys())
    
    tags_db = {t.id: t for t in Tag.query.filter(Tag.id.in_(all_tag_ids)).all()} if all_tag_ids else {}
    
    total_profs = Professor.query.count()
    if total_profs == 0: total_profs = 1
    
    temas_list = []
    observacoes_list = []
    
    total_temas = sum(count for tid, count in tag_counts.items() if tid in tags_db and tags_db[tid].tipo == 'tema')
    total_obs = sum(count for tid, count in tag_counts.items() if tid in tags_db and tags_db[tid].tipo == 'observacao')
    
    for tid, count in tag_counts.most_common():
        if tid in tags_db:
            tag_obj = tags_db[tid]
            if tag_obj.tipo == 'tema':
                pct = round((count / max(1, total_temas)) * 100, 1)
                item = {'nome': tag_obj.nome, 'quantidade': count, 'porcentagem': pct}
                temas_list.append(item)
            else:
                pct = round((count / max(1, total_obs)) * 100, 1)
                item = {'nome': tag_obj.nome, 'quantidade': count, 'porcentagem': pct}
                observacoes_list.append(item)
                
    def force_100_percent(items):
        if not items: return
        total = round(sum(i['porcentagem'] for i in items), 1)
        if total > 0 and total != 100.0:
            diff = round(100.0 - total, 1)
            # Add difference to the item with the highest percentage
            max_item = max(items, key=lambda x: x['porcentagem'])
            max_item['porcentagem'] = round(max_item['porcentagem'] + diff, 1)
            
    force_100_percent(temas_list)
    force_100_percent(observacoes_list)
    
    # Encontrar professores com pendencias
    pendencias_abertas_qs = Compromisso.query.filter_by(status='pendente').all()
    profs_pendencias = list(set([c.ata.professor.nome for c in pendencias_abertas_qs if c.ata and c.ata.professor]))

    profs_portal_pendente = list(set([a.professor.nome for a in atas if a.registros_portal.lower() not in ['sim', 'em dia', 'completo'] and a.professor]))

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
# ==========================================
# CRUD DE TAGS / CATEGORIAS (MANTIDO DO ORIGINAL)
# ==========================================
@api_bp.route('/tags', methods=['GET'])
@token_required
def get_tags(current_user):
    tipo = request.args.get('tipo')
    if tipo:
        tags = Tag.query.filter_by(tipo=tipo).all()
    else:
        tags = Tag.query.all()
        
    return jsonify([{'id': t.id, 'nome': t.nome, 'tipo': t.tipo} for t in tags]), 200

@api_bp.route('/tags', methods=['POST'])
@token_required
def create_tag(current_user):
    dados = request.get_json()
    if not dados or not dados.get('nome') or not dados.get('tipo'):
        return jsonify({'erro': 'Os campos nome e tipo são obrigatórios.'}), 400
        
    nova_tag = Tag(nome=dados.get('nome'), tipo=dados.get('tipo'))
    db.session.add(nova_tag)
    db.session.commit()
    return jsonify({'mensagem': 'Tag criada com sucesso!', 'id': nova_tag.id}), 201

@api_bp.route('/tags/<int:id>', methods=['PUT'])
@token_required
def update_tag(current_user, id):
    tag = Tag.query.get_or_404(id)
    dados = request.get_json()
    if 'nome' in dados:
        tag.nome = dados['nome']
    if 'tipo' in dados:
        tag.tipo = dados['tipo']
    db.session.commit()
    return jsonify({'mensagem': 'Tag atualizada com sucesso!'}), 200

@api_bp.route('/tags/<int:id>', methods=['DELETE'])
@token_required
def delete_tag(current_user, id):
    tag = Tag.query.get_or_404(id)
    db.session.delete(tag)
    db.session.commit()
    return jsonify({'mensagem': 'Tag excluída com sucesso!'}), 200

# ==========================================
# GERADOR DE PDF SÓBRIO E OFICIAL (DOCUMENTO)
# ==========================================
@api_bp.route('/atas/<int:id>/pdf', methods=['GET'])
@token_required
def gerar_pdf_ata(current_user, id):
    ata = Ata.query.get_or_404(id)
    prof = Professor.query.get(ata.professor_id)
    
    buffer = io.BytesIO()
    # Margens formais de documento
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=15, bottomMargin=20)
    styles = getSampleStyleSheet()
    
    # Estilos Estritos: Preto e Branco, fontes clássicas
    styles.add(ParagraphStyle(name='OficialHeader', fontName='Helvetica-Bold', fontSize=12, alignment=1, spaceAfter=2, textColor=colors.black))
    styles.add(ParagraphStyle(name='OficialSub', fontName='Helvetica', fontSize=10, alignment=1, spaceAfter=20, textColor=colors.black))
    styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=10, spaceBefore=15, spaceAfter=8, textColor=colors.black))
    styles.add(ParagraphStyle(name='TextNormal', fontName='Helvetica', fontSize=10, leading=14, textColor=colors.black))

    elements = []

    # 1. Logótipo Oficial
    logo_path = os.path.abspath(os.path.join(current_app.root_path, '..', 'frontend', 'public', 'images', 'logo.png'))
    if os.path.exists(logo_path):
        from reportlab.lib.utils import ImageReader
        img_reader = ImageReader(logo_path)
        img_w, img_h = img_reader.getSize()
        
        # Define a base width of 1.5 inches (~3.8cm) and maintains aspect ratio
        target_width = 1.5 * 72 
        target_height = target_width * (img_h / img_w)
        
        img = Image(logo_path, width=target_width, height=target_height)
        img.hAlign = 'CENTER'
        elements.append(img)
        elements.append(Spacer(1, 20))

    # 2. Cabeçalho Centralizado
    elements.append(Paragraph("INSTITUTO ASSOCIADOS SABER E CULTURA", styles['OficialHeader']))
    elements.append(Paragraph("DEPARTAMENTO DE COORDENAÇÃO PEDAGÓGICA", styles['OficialSub']))
    elements.append(Paragraph(f"ATA DE REUNIÃO DE ALINHAMENTO Nº {ata.id}", styles['OficialHeader']))
    elements.append(Spacer(1, 15))

    # 3. Tabela de Identificação (Linhas discretas)
    dados_pessoais = [
        [Paragraph("<b>PROFESSOR(A):</b>", styles['TextNormal']), Paragraph(prof.nome.upper() if prof else "-", styles['TextNormal'])],
        [Paragraph("<b>DISCIPLINA:</b>", styles['TextNormal']), Paragraph(prof.disciplina.upper() if prof and prof.disciplina else "-", styles['TextNormal'])],
        [Paragraph("<b>TURMAS:</b>", styles['TextNormal']), Paragraph(prof.turmas.upper() if prof and prof.turmas else "-", styles['TextNormal'])],
        [Paragraph("<b>COORDENAÇÃO:</b>", styles['TextNormal']), Paragraph(current_user.nome.upper(), styles['TextNormal'])],
        [Paragraph("<b>DATA DA REUNIÃO:</b>", styles['TextNormal']), Paragraph(ata.data_criacao.strftime('%d/%m/%Y às %H:%M'), styles['TextNormal'])],
        [Paragraph("<b>SITUAÇÃO DO PORTAL:</b>", styles['TextNormal']), Paragraph("EM DIA" if ata.registros_portal.lower() == 'sim' else "PENDENTE", styles['TextNormal'])]
    ]
    t1 = Table(dados_pessoais, colWidths=[160, 310])
    t1.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    elements.append(t1)
    elements.append(Spacer(1, 10))

    # 4. Blocos de Categorização
    for titulo, ids_json in [("TEMAS ABORDADOS NA REUNIÃO:", ata.temas_ids), ("OBSERVAÇÕES DA COORDENAÇÃO:", ata.tags_obs_ids)]:
        if ids_json:
            try:
                ids = json.loads(ids_json)
                nomes = [t.nome for t in Tag.query.filter(Tag.id.in_(ids)).all()]
                if nomes:
                    elements.append(Paragraph(titulo, styles['SectionTitle']))
                    elements.append(Paragraph(", ".join(nomes).upper(), styles['TextNormal']))
            except:
                pass

    # 5. Relatos Livres
    elements.append(Paragraph("RELATO DA COORDENAÇÃO:", styles['SectionTitle']))
    texto_coord = html.escape(ata.observacoes_coordenacao_texto or "Nenhum relato adicional.").replace('\n', '<br/>')
    elements.append(Paragraph(texto_coord, styles['TextNormal']))

    elements.append(Paragraph("RELATO DO(A) PROFESSOR(A):", styles['SectionTitle']))
    texto_prof = html.escape(ata.observacoes_professor_texto or "Nenhum relato adicional.").replace('\n', '<br/>')
    elements.append(Paragraph(texto_prof, styles['TextNormal']))

    # 6. Compromissos e Combinados
    elements.append(Paragraph("COMBINADOS E PRAZOS DEFINIDOS:", styles['SectionTitle']))
    comps = Compromisso.query.filter_by(ata_id=ata.id).all()
    if comps:
        c_table_data = [["DESCRIÇÃO DO COMPROMISSO", "PRAZO", "STATUS"]]
        for c in comps:
            prazo = c.data_prazo_limite.strftime('%d/%m/%Y') if c.data_prazo_limite else "-"
            c_table_data.append([Paragraph(c.descricao.upper(), styles['TextNormal']), prazo, c.status.upper()])
        
        t2 = Table(c_table_data, colWidths=[310, 80, 80])
        t2.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e5e5e5")), # Cinza muito claro apenas no cabeçalho
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 5)
        ]))
        elements.append(t2)
    else:
        elements.append(Paragraph("NENHUM COMPROMISSO NOVO REGISTRADO.", styles['TextNormal']))

    # 7. Linhas de Assinatura
    elements.append(Spacer(1, 30))
    assinaturas = [
        ["_______________________________________", "_______________________________________"],
        ["Assinatura da Coordenação Pedagógica", f"Assinatura do(a) Professor(a)"]
    ]
    t3 = Table(assinaturas, colWidths=[235, 235])
    t3.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'), 
        ('FONTSIZE', (0,1), (-1,1), 9),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica')
    ]))
    elements.append(t3)

    doc.build(elements)
    buffer.seek(0)
    
    nome_doc = f"Ata_{ata.id}_{prof.nome.replace(' ', '_') if prof else 'IASC'}.pdf"
    return send_file(buffer, as_attachment=True, download_name=nome_doc, mimetype='application/pdf')