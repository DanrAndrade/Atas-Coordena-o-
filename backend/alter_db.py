import os
from app import create_app
from app.models import db, Ata
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE ata ADD COLUMN temas_ids TEXT;"))
    except Exception as e:
        print("temas_ids já existe ou erro:", e)

    try:
        db.session.execute(text("ALTER TABLE ata ADD COLUMN tags_obs_ids TEXT;"))
    except Exception as e:
        print("tags_obs_ids já existe ou erro:", e)

    try:
        db.session.execute(text("ALTER TABLE ata ADD COLUMN status VARCHAR(20) DEFAULT 'fechada';"))
    except Exception as e:
        print("status já existe ou erro:", e)



    db.session.commit()
    print("Banco de dados alterado com sucesso.")
