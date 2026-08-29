from tests.api.client import ApiClient


class ChatApi:
    def __init__(self, client: ApiClient):
        self.client = client

    def send_message(
        self,
        token: str,
        recipient_id: int,
        content: str,
    ):
        return self.client.post(
            f"/api/messages/{recipient_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "content": content,
            },
        )