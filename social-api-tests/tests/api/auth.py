from tests.api.client import ApiClient


class AuthApi:
    def __init__(self, client: ApiClient):
        self.client = client

    def register(
        self,
        username: str,
        email: str,
        fullName: str,
        password: str,
    ):
        return self.client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": email,
                "fullName": fullName,
                "password": password,
            },
        )

    def get_token(self, username: str, password: str):
        return self.client.post(
            "/api/token",
            json={
                "username": username,
                "password": password,
            },
        )