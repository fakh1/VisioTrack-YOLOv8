import requests

data = {
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123"
}

response = requests.post("http://127.0.0.1:5000/api/signup", json=data)

print(response.status_code)  # Voir le code HTTP
print(response.text)         # Voir la réponse brute

try:
    print(response.json())   # Essaie de décoder le JSON
except Exception as e:
    print("Erreur JSONDecode:", e)
