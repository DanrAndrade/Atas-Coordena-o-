from app import create_app
from app.models import db, Professor, Ata, Compromisso, Tag
app = create_app()

with app.app_context():
    ata = Ata.query.first()
    if ata:
        print(f"Found ata id {ata.id}, trying to call inner logic...")
        try:
            from app.routes.atas_routes import gerar_pdf_ata
            class MockUser:
                id = 1
                nome = "Test Admin"
            # Since the route is decorated with @token_required, the function is wrapped, 
            # and the wrapper expects an Authorization header in request!
            # Instead of calling the function, let's extract the actual code.
            import os, io, html, json
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from flask import current_app
            
            prof = Professor.query.get(ata.professor_id)
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=40, bottomMargin=40)
            
            logo_path = os.path.abspath(os.path.join(current_app.root_path, '..', 'frontend', 'public', 'images', 'logo.png'))
            print("Evaluated logo_path:", logo_path)
            if os.path.exists(logo_path):
                img = Image(logo_path, width=0.8*colors.inch, height=0.8*colors.inch)
                print("Image loaded successfully:", img)
            else:
                print("Logo path does not exist!")
            
        except Exception as e:
            import traceback
            traceback.print_exc()
