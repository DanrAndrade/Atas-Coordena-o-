import json
from app import create_app
from app.models import Coordenador, Professor
import jwt, datetime

app = create_app()
with app.app_context():
    client = app.test_client()
    user = Coordenador.query.first()
    secret = app.config.get('SECRET_KEY') or 'super-secret-key-atas'
    token = jwt.encode({'coordenador_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, secret, algorithm="HS256")
    if isinstance(token, bytes): token = token.decode('utf-8')
    headers = {'Authorization': f'Bearer {token}'}
    prof = Professor.query.first()
    ata_payload = {
        'professor_id': prof.id,
        'registros_portal': 'Sim',
        'novos_compromissos': []
    }
    ata_resp = client.post('/api/v1/atas', json=ata_payload, headers=headers)
    with open('error_trace.json', 'w') as f:
        json.dump(ata_resp.get_json(), f, indent=4)
