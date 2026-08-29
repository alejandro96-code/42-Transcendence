from pydantic import BaseModel


class User(BaseModel):
    username: str
    email: str
    fullName: str
    password: str

    id: int | None = None
    token: str | None = None