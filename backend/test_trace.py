import sys
from app import create_app
from app.models import Coordenador
import jwt
app = create_app()

with app.app_context():
    with open('trace.txt', 'w', encoding='utf-8') as f:
        try:
            user = Coordenador.query.filter_by(email='admin@escola.com').first()
            f.write(f"User: {user}\n")
            if not user:
                f.write("Usuario nao encontrado!\n")
            else:
                match = user.check_senha('admin123')
                f.write(f"Password check: {match}\n")
                
                secret = app.config.get('SECRET_KEY', 'super-secret-key-atas')
                f.write(f"Secret type: {type(secret)}\n")
                
                token = jwt.encode({'coordenador_id': user.id}, secret, algorithm="HS256")
                f.write(f"Token encoded type: {type(token)}\n")
        except Exception as e:
            f.write("ERROR DETECTED:\n")
            import traceback
            f.write(traceback.format_exc())
