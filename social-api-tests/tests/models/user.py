from dataclasses import dataclass


@dataclass
class TestUser:
    username: str
    email: str
    password: str
    fullname: str
    id: str | None = None
    token: str | None = None