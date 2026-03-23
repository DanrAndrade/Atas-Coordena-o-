import sys, json
from app import create_app
from app.models import Coordenador, Professor
app = create_app()
app.app_context().push()

user = Coordenador.query.first()
prof = Professor.query.first() or Professor(nome='Teste', disciplina='Matematica', turmas='6A')
from app.models import db
if not prof.id:
    db.session.add(prof)
    db.session.commit()

payload = {
    'professor_id': prof.id,
    'registros_portal': 'Sim',
    'observacoes_professor_texto': 'Teste',
    'observacoes_coordenacao_texto': 'Teste Coord',
    'temas_ids': [1,2],
    'tags_obs_ids': [3],
    'novos_compromissos': [{'descricao': 'Compromisso 1', 'data_prazo_limite': ''}],
    'compromissos_concluidos': []
}

import urllib.request, urllib.error
import jwt
secret = app.config.get('SECRET_KEY') or 'super-secret-key-atas'
token = jwt.encode({'coordenador_id': user.id}, secret, algorithm="HS256")
if isinstance(token, bytes): token = token.decode('utf-8')

url = 'http://127.0.0.1:5000/api/v1/atas'
req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})

with open('trace_atas.txt', 'w', encoding='utf-8') as f:
    try:
        response = urllib.request.urlopen(req)
        f.write(f"SUCCESS: {response.code}\n")
        f.write(response.read().decode())
    except urllib.error.HTTPError as e:
        f.write(f"ERROR: {e.code}\n")
        f.write(e.read().decode())
    except Exception as e:
        import traceback
        f.write(traceback.format_exc())
