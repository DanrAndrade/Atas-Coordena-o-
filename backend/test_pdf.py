import urllib.request
import jwt, os
from app import create_app
from app.models import Coordenador, Ata
app = create_app()

with app.app_context():
    user = Coordenador.query.first()
    ata = Ata.query.first()
    
    if not ata:
        print("Nenhuma ata criada no banco.")
    else:
        # Gera o token
        secret = app.config.get('SECRET_KEY') or 'super-secret-key-atas'
        token = jwt.encode({'coordenador_id': user.id}, secret, algorithm="HS256")
        if isinstance(token, bytes): token = token.decode('utf-8')
        
        # Faz a request
        req = urllib.request.Request(f'http://127.0.0.1:5000/api/v1/atas/{ata.id}/pdf', headers={'Authorization': f'Bearer {token}'})
        
        try:
            res = urllib.request.urlopen(req)
            if res.code == 200 and res.headers.get_content_type() == 'application/pdf':
                print(f"SUCESSO: PDF retornado corretamente com {len(res.read())} bytes.")
            else:
                print(f"FALHA: {res.code} - {res.headers.get_content_type()}")
        except Exception as e:
            print("ERRO:", e)
