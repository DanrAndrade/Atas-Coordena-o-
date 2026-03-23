from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # CORS totalmente liberado
    CORS(app)
    
    db.init_app(app)

    with app.app_context():
        # Cria as tabelas do banco
        from . import models
        db.create_all()
        
        from .routes.atas_routes import api_bp
        from .routes.auth_routes import auth_bp
        app.register_blueprint(api_bp, url_prefix='/api/v1')
        app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # ==== VERIFICADOR DE ROTAS ====
    # Isso vai imprimir as rotas no terminal do Flask ao iniciar
    print("\n" + "="*40)
    print(" ROTAS CARREGADAS PELO FLASK:")
    print("="*40)
    for rule in app.url_map.iter_rules():
        if "api" in rule.endpoint:
            print(f"✔️  {rule.rule}")
    print("="*40 + "\n")

    return app