import requests

# 1. Obter Token (admin@escola.com / admin123)
res_login = requests.post("http://127.0.0.1:5000/api/v1/auth/login", json={
    "email": "admin@escola.com",
    "senha": "admin123"
})

if res_login.status_code == 200:
    token = res_login.json().get('token')
    print("Logado com sucesso.")
    
    # 2. Pegar todas as atas
    res_atas = requests.get("http://127.0.0.1:5000/api/v1/atas", headers={"Authorization": f"Bearer {token}"})
    if res_atas.status_code == 200:
        atas = res_atas.json()
        if len(atas) > 0:
            ata_id = atas[0]['id']
            # 3. Tentar baixar o PDF
            res_pdf = requests.get(f"http://127.0.0.1:5000/api/v1/atas/{ata_id}/pdf", headers={"Authorization": f"Bearer {token}"})
            print("Status do PDF:", res_pdf.status_code)
            print("Headers:", res_pdf.headers)
            print("Conteudo (primeiros 100 bytes):", res_pdf.content[:100])
        else:
            print("Nenhuma ata na listagem.")
else:
    print("Falha no login.")
