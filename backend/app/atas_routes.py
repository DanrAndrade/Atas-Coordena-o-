import json
import pandas as pd
from flask import Blueprint, request, jsonify
from ..models import db, Professor, Ata, Compromisso, Tag

# Criação do Blueprint (Esta era a linha que estava faltando e quebrando o servidor)
api_bp = Blueprint('api', __name__)

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
            
        for _, row in df.iterrows():
            nome = row.get('nome')
            if pd.notna(nome):
                prof = Professor(
                    nome=str(nome),
                    disciplina=str(row.get('disciplina', '')),
                    turmas=str(row.get('turmas', ''))
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
def create_ata():
    dados = request.get_json()
    nova_ata = Ata(
        professor_id=dados.get('professor_id'),
        coordenador_id=dados.get('coordenador_id', 1),
        registros_portal=dados.get('registros_portal', ''),
        observacoes_professor_texto=dados.get('observacoes_professor_texto', ''),
        observacoes_coordenacao_texto=dados.get('observacoes_coordenacao_texto', ''),
        temas_ids=json.dumps(dados.get('temas_ids', [])),
        tags_obs_ids=json.dumps(dados.get('tags_obs_ids', [])),
        status='fechada'
    )
    db.session.add(nova_ata)
    db.session.flush() # Para pegar o ID da ata gerada
    
    novos_compromissos = dados.get('novos_compromissos', [])
    for comp in novos_compromissos:
        if comp.get('descricao'):
            novo_comp = Compromisso(
                ata_id=nova_ata.id,
                descricao=comp['descricao'],
                data_prazo_limite=comp.get('data_prazo_limite') or None,
                status='pendente'
            )
            db.session.add(novo_comp)
            
    db.session.commit()
    return jsonify({'mensagem': 'Ata criada com sucesso!', 'id': nova_ata.id}), 201

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
def create_tag():
    dados = request.get_json()
    if not dados or not dados.get('nome') or not dados.get('tipo'):
        return jsonify({'erro': 'Os campos nome e tipo são obrigatórios.'}), 400
        
    nova_tag = Tag(nome=dados.get('nome'), tipo=dados.get('tipo'))
    db.session.add(nova_tag)
    db.session.commit()
    return jsonify({'mensagem': 'Tag criada com sucesso!', 'id': nova_tag.id}), 201

@api_bp.route('/tags/<int:id>', methods=['PUT'])
def update_tag(id):
    tag = Tag.query.get_or_404(id)
    dados = request.get_json()
    if 'nome' in dados:
        tag.nome = dados['nome']
    if 'tipo' in dados:
        tag.tipo = dados['tipo']
    db.session.commit()
    return jsonify({'mensagem': 'Tag atualizada com sucesso!'}), 200

@api_bp.route('/tags/<int:id>', methods=['DELETE'])
def delete_tag(id):
    tag = Tag.query.get_or_404(id)
    db.session.delete(tag)
    db.session.commit()
    return jsonify({'mensagem': 'Tag excluída com sucesso!'}), 200