from flask import Flask, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 1. Configuração Padrão do CORS para a App Inteira
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    db.init_app(app)

    with app.app_context():
        from app import models
        db.create_all()
        
        from .routes.atas_routes import api_bp
        from .routes.auth_routes import auth_bp
        
        app.register_blueprint(api_bp, url_prefix='/api/v1')
        app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    from flask import jsonify
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        response = e.get_response()
        response.data = jsonify({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }).data
        response.content_type = "application/json"
        return response

    @app.errorhandler(Exception)
    def handle_exception(e):
        return jsonify({
            "code": 500,
            "name": "Internal Server Error",
            "description": str(e),
        }), 500

    print("\n" + "="*50)
    print(" SERVIDOR IASC - SISTEMA DE ATAS")
    print("="*50)
    for rule in app.url_map.iter_rules():
        if "api" in rule.rule:
            print(f" ROTA ATIVA: {rule.rule}")
    print("="*50 + "\n")

    return app