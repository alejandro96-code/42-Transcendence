from tests.api.client import ApiClient


class PostsApi:
    def __init__(self, client: ApiClient):
        self.client = client

    def create_post(self, token: str, content: str):
        return self.client.post(
            "/api/posts",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "content": content,
            },
        )

    def get_posts(self, token: str, filter: str = None):
        params = {}

        if filter is not None:
            params["filter"] = filter

        return self.client.get(
            "/api/posts",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            params=params,
        )