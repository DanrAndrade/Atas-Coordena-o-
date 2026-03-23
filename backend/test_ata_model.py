from app import create_app
from app.models import Ata

app = create_app()
with app.app_context():
    try:
        a = Ata(temas_ids="[1, 2]")
        print("SUCESSO. O modelo Ata reconhece 'temas_ids':", a.temas_ids)
    except Exception as e:
        import traceback
        traceback.print_exc()
