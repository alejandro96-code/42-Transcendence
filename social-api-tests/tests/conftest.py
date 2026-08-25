# tests/conftest.py

import os

import pytest
from dotenv import load_dotenv

from tests.api.client import ApiClient
from tests.api.auth import AuthApi
from tests.api.friendships import FriendshipsApi

load_dotenv()


@pytest.fixture
def api_client():
    client = ApiClient(os.environ["API_BASE_URL"])

    yield client

    client.close()


@pytest.fixture
def auth_api(api_client):
    return AuthApi(api_client)


@pytest.fixture
def friendships_api(api_client):
    return FriendshipsApi(api_client)