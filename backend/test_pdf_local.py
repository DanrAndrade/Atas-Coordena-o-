from app import create_app, db
from app.models import Coordenador, Professor, Ata, Compromisso

app = create_app()

with app.app_context():
    admin = Coordenador.query.first()
    ata = Ata.query.order_by(Ata.id.desc()).first()
    
    if not ata:
        print("SEM ATA PARA TESTAR")
    else:
        try:
            from app.routes.atas_routes import gerar_pdf_ata
            # Simulate request
            with app.test_request_context():
                res = gerar_pdf_ata(admin, ata.id)
                print("PDF GERADO COM SUCESSO! TAMANHO:", len(res.data))
        except Exception as e:
            import traceback
            traceback.print_exc()
