from tests.models.user import User
from tests.models.post import Post


class TestContext:
    def __init__(self):
        self.users: dict[str, User] = {}

        self.posts: list[Post] = []

        self.responses: dict[str, object] = {}

        self.friend_requests: dict[str, int] = {}

        self.mention_posts = {}