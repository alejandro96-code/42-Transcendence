from tests.api.client import ApiClient


class FriendshipsApi:
    def __init__(self, client: ApiClient):
        self.client = client

    def send_request(self, token: str, username: str):
        return self.client.post(
            "/api/friends/requests",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "username": username,
            },
        )

    def get_pending_requests(self, token: str):
        return self.client.get(
            "/api/friends/requests",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )

    def update_request(
        self,
        token: str,
        request_id: int,
        status: str,
    ):
        return self.client.patch(
            f"/api/friends/requests/{request_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "status": status,
            },
        )