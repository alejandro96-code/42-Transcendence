# tests/api/client.py

import httpx


class ApiClient:
    def __init__(self, base_url: str):
        self.client = httpx.Client(
            base_url=base_url,
            timeout=10.0,
        )

    def get(self, path: str, **kwargs):
        return self.client.get(path, **kwargs)

    def post(self, path: str, **kwargs):
        return self.client.post(path, **kwargs)

    def put(self, path: str, **kwargs):
        return self.client.put(path, **kwargs)

    def delete(self, path: str, **kwargs):
        return self.client.delete(path, **kwargs)

    def close(self):
        self.client.close()