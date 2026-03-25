from app import create_app
app = create_app()

with app.test_client() as client:
    resp = client.post('/api/v1/auth/login', json={'email': 'admin@admin.com', 'senha': '123'})
    print("LOGIN STATUS:", resp.status_code)
    print("LOGIN DATA:", resp.get_data(as_text=True))
