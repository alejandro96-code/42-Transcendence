import httpx


class ApiClient:
    def __init__(self, base_url: str):
        self.client = httpx.Client(
            base_url=base_url,
            verify=False,
        )

    def get(self, path, **kwargs):
        return self.client.get(path, **kwargs)

    def post(self, path, **kwargs):
        return self.client.post(path, **kwargs)

    def patch(self, path, **kwargs):
        return self.client.patch(path, **kwargs)

    def delete(self, path, **kwargs):
        return self.client.delete(path, **kwargs)

    def close(self):
        self.client.close()