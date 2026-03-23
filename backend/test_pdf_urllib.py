import urllib.request
import urllib.parse
import json

data = json.dumps({"email": "admin@escola.com", "senha": "admin123"}).encode('utf-8')
req = urllib.request.Request("http://127.0.0.1:5000/api/v1/auth/login", data=data, headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req) as f:
    token = json.loads(f.read().decode('utf-8')).get('token')

for ata_id in range(1, 10):
    try:
        req_pdf = urllib.request.Request(f"http://127.0.0.1:5000/api/v1/atas/{ata_id}/pdf", headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req_pdf) as fp:
            pdf_bytes = fp.read()
            print(f"SUCESSO NA ATA {ata_id}")
            print(f"Mimetype: {fp.headers.get('Content-Type')}")
            print(f"Content-Disposition: {fp.headers.get('Content-Disposition')}")
            print("Bytes:", len(pdf_bytes))
            print("Magic:", pdf_bytes[:5])
            with open("teste_local.pdf", "wb") as pdf_file:
                pdf_file.write(pdf_bytes)
            break
    except Exception as e:
        if "404" not in str(e):
            print(f"Erro Ata {ata_id}: {e}")
