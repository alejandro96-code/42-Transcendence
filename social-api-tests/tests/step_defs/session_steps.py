import base64
import json

import pytest

from pytest_bdd import given, when, then, scenarios, parsers


scenarios("../features/session.feature")

pytestmark = pytest.mark.order(2)


def get_user_id_from_token(token: str) -> int:
    """
    Decode the JWT payload and extract userId.

    This does NOT verify the JWT signature.
    The API is responsible for validating the token.
    """

    parts = token.split(".")

    assert len(parts) == 3, "Invalid JWT format"

    payload = parts[1]

    # JWT uses base64url without guaranteed padding.
    payload += "=" * (-len(payload) % 4)

    decoded = base64.urlsafe_b64decode(payload)

    data = json.loads(decoded)

    assert "userId" in data, (
        f"JWT does not contain userId: {data}"
    )

    return data["userId"]


@given(
    parsers.parse(
        'the user "{name}" is registered'
    )
)
def user_is_registered(context, name):
    assert name in context.users, (
        f'User "{name}" is not registered.'
    )


@when(
    parsers.parse(
        'I get a session token for "{name}"'
    )
)
def get_session_token(context, auth_api, name):
    user = context.users[name]

    response = auth_api.get_token(
        username=user.username,
        password=user.password,
    )

    assert response.status_code == 200, (
        f"Failed to get token for {name}: "
        f"{response.status_code}: {response.text}"
    )

    data = response.json()

    assert "token" in data, (
        f"Token missing from response: {data}"
    )

    user.token = data["token"]

    # The JWT contains the API user ID.
    user.id = get_user_id_from_token(user.token)


@then(
    parsers.parse(
        '"{name}" should have a valid session token'
    )
)
def user_has_valid_session_token(context, name):
    user = context.users[name]

    assert user.token is not None
    assert user.id is not None