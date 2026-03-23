import urllib.request, json, urllib.error

url = 'http://127.0.0.1:5000/api/v1/auth/login'
data = json.dumps({'email': 'admin@escola.com', 'senha': 'admin123'}).encode()
headers = {'Content-Type': 'application/json'}
req = urllib.request.Request(url, data=data, headers=headers)

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS:", response.code)
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR:", e.code)
    print(e.read().decode())
except Exception as e:
    print("OTHER ERROR:", e)
