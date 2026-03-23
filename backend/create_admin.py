import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models import Coordenador
import sqlalchemy

app = create_app()

with app.app_context():
    db.create_all()
    
    # Try altering tables for existing sqlite/mysql just in case it's needed
    try:
        db.session.execute(sqlalchemy.text("ALTER TABLE ata ADD COLUMN coordenador_id INTEGER NOT NULL DEFAULT 1;"))
    except:
        pass # Column might already exist

    try:
        db.session.execute(sqlalchemy.text("ALTER TABLE compromisso ADD COLUMN ata_origem_id INTEGER;"))
    except:
        pass

    db.session.commit()

    admin = Coordenador.query.filter_by(email="admin@escola.com").first()
    if not admin:
        admin = Coordenador(nome="Administrador", email="admin@escola.com")
        admin.set_senha("admin123")
        db.session.add(admin)
        db.session.commit()
        print("Usuário coordenador criado: admin@escola.com / admin123")
    else:
        print("Usuário admin já existe.")
