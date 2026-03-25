import jwt
import datetime
from flask import Blueprint, request, jsonify, current_app
from app.models import db, Coordenador
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Permite sempre as requisições preparatórias do navegador
        if request.method == 'OPTIONS':
            return jsonify({}), 200
            
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'message': 'Acesso Negado. Token ausente.'}), 401
        
        try:
            secret = current_app.config.get('SECRET_KEY') or 'super-secret-key-atas'
            data = jwt.decode(token, secret, algorithms=["HS256"])
            
            # Se for um token velho sem ID, recusa o acesso de imediato sem quebrar o servidor
            coordenador_id = data.get('coordenador_id')
            if not coordenador_id:
                return jsonify({'message': 'Sessão desatualizada. Faça login novamente.'}), 401
                
            current_user = Coordenador.query.get(coordenador_id)
            if not current_user:
                return jsonify({'message': 'Usuário não encontrado!'}), 401
                
        except Exception as e:
            return jsonify({'message': 'Sessão inválida ou expirada!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    if not dados or not dados.get('email') or not dados.get('senha'):
        return jsonify({'message': 'Email e senha são obrigatórios'}), 400
        
    usuario = Coordenador.query.filter_by(email=dados['email']).first()
    
    if not usuario or not usuario.check_senha(dados['senha']):
        return jsonify({'message': 'Credenciais inválidas'}), 401
        
    secret = current_app.config.get('SECRET_KEY') or 'super-secret-key-atas'
    token = jwt.encode({
        'coordenador_id': usuario.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, secret, algorithm="HS256")
    
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    return jsonify({
        'token': token,
        'usuario': {
            'id': usuario.id,
            'nome': usuario.nome,
            'email': usuario.email
        }
    }), 200