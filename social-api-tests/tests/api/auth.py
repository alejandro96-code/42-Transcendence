# tests/api/auth.py

class AuthApi:
    def __init__(self, client):
        self.client = client

    def register(self, username, email, password):
        return self.client.post(
            "/register",
            json={
                "username": username,
                "email": email,
                "password": password,
            },
        )

    def login(self, email, password):
        return self.client.post(
            "/login",
            json={
                "email": email,
                "password": password,
            },
        )