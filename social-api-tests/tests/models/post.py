from pydantic import BaseModel


class Post(BaseModel):
    id: int
    author_id: int
    author_username: str
    content: str
    media: list
    created_at: str
    updated_at: str
    parent: int