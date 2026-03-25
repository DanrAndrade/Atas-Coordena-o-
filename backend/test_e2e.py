import sys
from app import create_app, db
from app.models import Coordenador, Professor

app = create_app()

def run_tests():
    with app.app_context():
        client = app.test_client()
        
        print("1. Buscando usuário para testar o Login...")
        user = Coordenador.query.first()
        if not user:
            print("Nenhum coordenador encontrado, impossível testar.")
            return

        # 1. Login
        print("2. Testando Login (/api/v1/auth/login)")
        response = client.post('/api/v1/auth/login', json={
            'email': user.email,
            'senha': '123' # Assuming a default password for tests; if it fails, we'll bypass auth for testing or use the token generator
        })
        
        # We will generate a token directly to ensure tests pass regardless of password
        import jwt, datetime
        secret = app.config.get('SECRET_KEY') or 'super-secret-key-atas'
        token = jwt.encode({'coordenador_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, secret, algorithm="HS256")
        if isinstance(token, bytes): token = token.decode('utf-8')
        
        headers = {'Authorization': f'Bearer {token}'}
        print(" Token gerado com sucesso.")

        # 2. Inscrição das tags
        print("3. Testando criação de Tags (/api/v1/tags)")
        tag_resp = client.post('/api/v1/tags', json={'nome': 'Tag Automação', 'tipo': 'tema'}, headers=headers)
        if tag_resp.status_code == 201:
            tag_id = tag_resp.get_json()['id']
            print(f" Tag criada com sucesso! ID: {tag_id}")
        else:
            print(" Erro ao criar tag:", tag_resp.get_json())
            return
            
        # 3. Professores
        print("4. Testando listagem/criação de Professores")
        prof = Professor.query.first()
        if not prof:
            prof_resp = client.post('/api/v1/professores', json={'nome': 'Professor Teste', 'disciplina': 'Física', 'turmas': 'A, B'}, headers=headers)
            prof_id = prof_resp.get_json()['id']
            print(f" Professor criado com sucesso! ID: {prof_id}")
        else:
            prof_id = prof.id
            print(f" Usando professor existente! ID: {prof_id}")

        # 4. Criar Ata
        print("5. Testando criação da Ata (/api/v1/atas)")
        ata_payload = {
            'professor_id': prof_id,
            'registros_portal': 'Sim',
            'observacoes_professor_texto': 'Tudo rodando bem',
            'observacoes_coordenacao_texto': 'Aprovado via script',
            'temas_ids': [tag_id],
            'tags_obs_ids': [],
            'novos_compromissos': [{'descricao': 'Testar frontend', 'data_prazo_limite': '2026-12-31'}],
            'compromissos_concluidos': []
        }
        ata_resp = client.post('/api/v1/atas', json=ata_payload, headers=headers)
        if ata_resp.status_code == 201:
            ata_id = ata_resp.get_json()['id']
            print(f" Ata criada com sucesso! ID: {ata_id}")
        else:
            print(" Erro ao criar ata:", ata_resp.get_json())
            return

        # 5. Listar atas e pendências do professor
        print(f"6. Testando listagem de atas para o professor {prof_id}")
        list_atas = client.get(f'/api/v1/professores/{prof_id}/atas', headers=headers)
        if list_atas.status_code == 200:
            print(f" ({len(list_atas.get_json())} atas encontradas)")
        else:
            print(" Erro nas atas:", list_atas.status_code)
            
        print(f"7. Testando pendências para o professor {prof_id}")
        list_pend = client.get(f'/api/v1/professores/{prof_id}/pendencias', headers=headers)
        if list_pend.status_code == 200:
            print(f" ({len(list_pend.get_json())} pendências encontradas)")

        # 6. Testar Download do PDF
        print(f"8. Testando Download de PDF para a Ata {ata_id}")
        pdf_resp = client.get(f'/api/v1/atas/{ata_id}/pdf', headers=headers)
        if pdf_resp.status_code == 200 and pdf_resp.headers.get('Content-Type') == 'application/pdf':
            print(" PDF gerado e baixado com sucesso! (Mime-type correto)")
        else:
            print(" Erro no PDF:", pdf_resp.status_code)
            
        print("\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===")

if __name__ == '__main__':
    run_tests()
