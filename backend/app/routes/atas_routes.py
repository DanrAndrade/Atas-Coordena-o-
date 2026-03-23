import json
import pandas as pd
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
import io
import html
from ..models import db, Professor, Ata, Compromisso, Tag
from .auth_routes import token_required
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# A MÁGICA DEFINITIVA: Forçando o prefixo diretamente na raiz das rotas!
api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# ==========================================
# ROTAS DE PROFESSORES
# ==========================================
@api_bp.route('/professores', methods=['GET'])
def get_professores():
    professores = Professor.query.all()
    return jsonify([{'id': p.id, 'nome': p.nome, 'disciplina': p.disciplina, 'turmas': p.turmas} for p in professores]), 200

@api_bp.route('/professores', methods=['POST'])
def create_professor():
    dados = request.get_json()
    if not dados or not dados.get('nome'):
        return jsonify({'erro': 'O nome é obrigatório'}), 400
    novo_prof = Professor(nome=dados['nome'], disciplina=dados.get('disciplina'), turmas=dados.get('turmas'))
    db.session.add(novo_prof)
    db.session.commit()
    return jsonify({'mensagem': 'Professor criado!', 'id': novo_prof.id}), 201

@api_bp.route('/professores/importar', methods=['POST'])
def importar_professores():
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
            
        inseridos = 0
        duplicados = 0
        for _, row in df.iterrows():
            nome = row.get('nome')
            if pd.notna(nome):
                nome_str = str(nome).strip()
                existente = Professor.query.filter(Professor.nome.ilike(nome_str)).first()
                if not existente:
                    prof = Professor(
                        nome=nome_str,
                        disciplina=str(row.get('disciplina', '')).strip(),
                        turmas=str(row.get('turmas', '')).strip()
                    )
                    db.session.add(prof)
                    inseridos += 1
                else:
                    duplicados += 1
        db.session.commit()
        return jsonify({'mensagem': f'Concluído! {inseridos} novos professores adicionados. {duplicados} já existiam e foram ignorados.'}), 200
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
        coordenador_id=current_user.id,
        registros_portal=dados.get('registros_portal', ''),
        observacoes_professor_texto=dados.get('observacoes_professor_texto', ''),
        observacoes_coordenacao_texto=dados.get('observacoes_coordenacao_texto', ''),
        temas_ids=json.dumps(dados.get('temas_ids', [])),
        tags_obs_ids=json.dumps(dados.get('tags_obs_ids', []))
    )
    db.session.add(nova_ata)
    db.session.flush() # Para pegar o ID da ata gerada
    
    # Processar novos compromissos
    novos_compromissos = dados.get('novos_compromissos', [])
    for comp in novos_compromissos:
        if comp.get('descricao'):
            novo_comp = Compromisso(
                ata_id=nova_ata.id,
                descricao=comp['descricao'],
                data_prazo_limite=comp.get('data_prazo_limite') or None,
                status='pendente',
                ata_origem_id=nova_ata.id
            )
            db.session.add(novo_comp)

    # Processar compromissos concluídos (da ata anterior ou do perfil)
    compromissos_concluidos_ids = dados.get('compromissos_concluidos', [])
    if compromissos_concluidos_ids:
        # Atualiza os status para concluído
        Compromisso.query.filter(Compromisso.id.in_(compromissos_concluidos_ids)).update(
            {"status": "concluido", "data_cumprimento": datetime.utcnow()}, synchronize_session=False
        )
            
    db.session.commit()
    return jsonify({'mensagem': 'Ata criada com sucesso!', 'id': nova_ata.id}), 201

@api_bp.route('/compromissos/<int:id>/concluir', methods=['PUT'])
@token_required
def concluir_compromisso(current_user, id):
    comp = Compromisso.query.get_or_404(id)
    comp.status = 'concluido'
    comp.data_cumprimento = datetime.utcnow()
    db.session.commit()
    return jsonify({'mensagem': 'Compromisso marcado como concluído!'}), 200

# ==========================================
# GERAL / DASHBOARD
# ==========================================
@api_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    total_professores = Professor.query.count()
    total_atas = Ata.query.count()
    
    pendencias_abertas = Compromisso.query.filter_by(status='pendente').count()
    
    # Pegar todas as atas para calcular top tags
    atas = Ata.query.all()
    todas_tags = []
    for ata in atas:
        if ata.tags_obs_ids:
            try:
                tags = json.loads(ata.tags_obs_ids)
                todas_tags.extend(tags)
            except:
                pass
                
    contagem_tags = {}
    for tag in todas_tags:
        contagem_tags[tag] = contagem_tags.get(tag, 0) + 1
        
    top_tags = sorted(contagem_tags.items(), key=lambda item: item[1], reverse=True)[:3]
    top_tags_nomes = [t[0] for t in top_tags]
    
    return jsonify({
        'total_professores': total_professores,
        'total_atas': total_atas,
        'pendencias_abertas': pendencias_abertas,
        'top_tags_geral': top_tags_nomes
    }), 200

@api_bp.route('/professores/<int:id>/pendencias', methods=['GET'])
@token_required
def get_pendencias_professor(current_user, id):
    # Busca todas as atas do professor
    atas_ids = [a.id for a in Ata.query.filter_by(professor_id=id).all()]
    if not atas_ids:
        return jsonify([]), 200
        
    pendencias = Compromisso.query.filter(
        Compromisso.ata_id.in_(atas_ids), 
        Compromisso.status == 'pendente'
    ).all()
    
    resultado = [{
        'id': c.id,
        'descricao': c.descricao,
        'data_origem': c.data_geracao.strftime('%d/%m/%Y'),
        'data_prazo': c.data_prazo_limite.strftime('%d/%m/%Y') if c.data_prazo_limite else None
    } for c in pendencias]
    
    return jsonify(resultado), 200

@api_bp.route('/professores/<int:id>/atas', methods=['GET'])
def get_atas_professor(id):
    professor = Professor.query.get_or_404(id)
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
                tags_coordenacao = json.loads(ata.tags_obs_ids)
            except:
                tags_coordenacao = []

        resultado.append({
            'id': ata.id,
            'data_criacao': ata.data_criacao.strftime('%d/%m/%Y') if hasattr(ata, 'data_criacao') and ata.data_criacao else 'Sem data',
            'status': getattr(ata, 'status', 'fechada'),
            'compromissos': compromissos_lista,
            'tags_coordenacao': tags_coordenacao
        })
        
    return jsonify(resultado), 200

# ==========================================
# CRUD DE TAGS / CATEGORIAS
# ==========================================
@api_bp.route('/tags', methods=['GET'])
def get_tags():
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
# ROTA DE GERAÇÃO DE PDF
# ==========================================
@api_bp.route('/atas/<int:id>/pdf', methods=['GET'])
@token_required
def gerar_pdf_ata(current_user, id):
    ata = Ata.query.get_or_404(id)
    professor = Professor.query.get(ata.professor_id)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    normal_style = styles['Normal']
    bold_style = ParagraphStyle('Bold', parent=normal_style, fontName='Helvetica-Bold')
    
    elements = []
    
    # Header
    elements.append(Paragraph("REGISTRO DE ATA - REUNIÃO", title_style))
    elements.append(Spacer(1, 20))
    
    # Info
    data_formatada = ata.data_criacao.strftime('%d/%m/%Y %H:%M') if ata.data_criacao else ''
    info_data = [
        [Paragraph("<b>Professor(a):</b>", bold_style), Paragraph(professor.nome if professor else "", normal_style)],
        [Paragraph("<b>Disciplina:</b>", bold_style), Paragraph(professor.disciplina if professor and professor.disciplina else "-", normal_style)],
        [Paragraph("<b>Turmas:</b>", bold_style), Paragraph(professor.turmas if professor and professor.turmas else "-", normal_style)],
        [Paragraph("<b>Coordenador(a):</b>", bold_style), Paragraph(current_user.nome, normal_style)],
        [Paragraph("<b>Data da Reunião:</b>", bold_style), Paragraph(data_formatada, normal_style)],
        [Paragraph("<b>Registros no Portal:</b>", bold_style), Paragraph(ata.registros_portal, normal_style)],
    ]
    t = Table(info_data, colWidths=[120, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # Observações
    elements.append(Paragraph("<b>Observações da Coordenação:</b>", bold_style))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(html.escape(ata.observacoes_coordenacao_texto or "Nada registrado.").replace('\n', '<br/>'), normal_style))
    elements.append(Spacer(1, 15))
    
    elements.append(Paragraph("<b>Observações do Professor:</b>", bold_style))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(html.escape(ata.observacoes_professor_texto or "Nada registrado.").replace('\n', '<br/>'), normal_style))
    elements.append(Spacer(1, 20))
    
    # Compromissos
    elements.append(Paragraph("<b>Compromissos Acordados:</b>", bold_style))
    elements.append(Spacer(1, 5))
    compromissos = Compromisso.query.filter_by(ata_origem_id=ata.id).all()
    if compromissos:
        c_data = [["Descrição", "Prazo", "Status"]]
        for c in compromissos:
            prazo = c.data_prazo_limite.strftime('%d/%m/%Y') if c.data_prazo_limite else "-"
            c_data.append([c.descricao, prazo, c.status.upper()])
        
        c_table = Table(c_data, colWidths=[270, 100, 100])
        c_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('BACKGROUND', (0,1), (-1,-1), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
        ]))
        elements.append(c_table)
    else:
        elements.append(Paragraph("Nenhum compromisso registrado nesta ata.", normal_style))
        
    elements.append(Spacer(1, 60))
    
    # Assinaturas
    assinaturas_data = [
        [Paragraph("_________________________________________________", title_style)],
        [Paragraph(f"<b>{professor.nome if professor else 'Professor'}</b><br/>Professor(a)", title_style)]
    ]
    t_ass = Table(assinaturas_data)
    t_ass.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
    elements.append(t_ass)
    
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"ata_{professor.nome.replace(' ', '_')}_{ata.data_criacao.strftime('%Y%m%d')}.pdf",
        mimetype='application/pdf'
    )