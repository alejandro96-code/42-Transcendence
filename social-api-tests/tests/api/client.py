# tests/api/client.py

import httpx


class ApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(
            base_url=self.base_url,
            verify=False,
        )

    def get(self, endpoint: str, **kwargs):
        return self.client.get(endpoint, **kwargs)

    def post(self, endpoint: str, **kwargs):
        return self.client.post(endpoint, **kwargs)

    def put(self, endpoint: str, **kwargs):
        return self.client.put(endpoint, **kwargs)

    def patch(self, endpoint: str, **kwargs):
        return self.client.patch(endpoint, **kwargs)

    def delete(self, endpoint: str, **kwargs):
        return self.client.delete(endpoint, **kwargs)

    def close(self):
        self.client.close()