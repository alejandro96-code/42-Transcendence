# tests/api/friendships.py

class FriendshipsApi:
    def __init__(self, client):
        self.client = client

    def send_request(self, token, user_id):
        return self.client.post(
            "/friend-requests",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "user_id": user_id,
            },
        )

    def accept_request(self, token, request_id):
        return self.client.post(
            f"/friend-requests/{request_id}/accept",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )