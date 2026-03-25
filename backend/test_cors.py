from app import create_app
app = create_app()
client = app.test_client()

resp_opt = client.options('/api/v1/professores/1/atas', headers={'Access-Control-Request-Method': 'GET', 'Origin': 'http://localhost:5173'})
print("OPTIONS HEADERS:")
for k, v in resp_opt.headers.items():
    print(f"{k}: {v}")

resp_get = client.get('/api/v1/professores/1/atas', headers={'Origin': 'http://localhost:5173', 'Authorization': 'Bearer foo'})
print("\nGET STATUS:", resp_get.status_code)
print("GET JSON:", resp_get.get_json(silent=True))
print("GET HEADERS:")
for k, v in resp_get.headers.items():
    print(f"{k}: {v}")
