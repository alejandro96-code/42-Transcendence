import os

import pytest
from dotenv import load_dotenv
from pytest_bdd import given, parsers

from tests.api.client import ApiClient
from tests.api.auth import AuthApi
from tests.api.posts import PostsApi
from tests.api.chat import ChatApi
from tests.api.friendships import FriendshipsApi
from tests.models.context import TestContext

load_dotenv()


@pytest.fixture(scope="session")
def api_client():
    client = ApiClient(
        os.environ["API_BASE_URL"]
    )

    yield client

    client.close()


@pytest.fixture(scope="session")
def auth_api(api_client):
    return AuthApi(api_client)


@pytest.fixture(scope="session")
def posts_api(api_client):
    return PostsApi(api_client)


@pytest.fixture(scope="session")
def friendships_api(api_client):
    return FriendshipsApi(api_client)


@pytest.fixture
def chat_api(api_client):
    return ChatApi(api_client)

@pytest.fixture(scope="session")
def context():
    return TestContext()


@given(parsers.parse('the user "{name}" is registered'))
def user_is_registered(context, name):
    assert name in context.users, (
        f'User "{name}" is not registered.'
    )


@given(parsers.parse('"{name}" has a session token'))
def user_has_session_token(context, name):
    user = context.users[name]

    assert user.token is not None, (
        f'User "{name}" does not have a session token.'
    )