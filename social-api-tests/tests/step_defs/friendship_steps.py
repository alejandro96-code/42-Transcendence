import pytest

from pytest_bdd import given, when, then, scenarios, parsers

from tests.models.user import User


pytestmark = pytest.mark.order(3)

scenarios("../features/friendships.feature")


@given(
    parsers.parse(
        'the user "{name}" is registered'
    )
)
def registered_user(
    context,
    auth_api,
    name,
):
    # If the user already exists in our test state,
    # don't register it again.
    if name in context.users:
        return

    user = User(
        username=name,
        email=f"{name.lower()}@example.com",
        fullName=f"{name}_FullName",
        password="Password123!",
    )

    response = auth_api.register(
        username=user.username,
        email=user.email,
        fullName=user.fullName,
        password=user.password,
    )

    assert response.status_code in (201, 409), (
        f"Failed to register {name}: "
        f"{response.status_code}: {response.text}"
    )

    # If registration succeeded, save the API-generated ID.
    if response.status_code == 201:
        data = response.json()
        user.id = data.get("id")

    context.users[name] = user


@given(
    parsers.parse(
        '"{name}" has a session token'
    )
)
def user_has_session_token(
    context,
    auth_api,
    name,
):
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

    assert "token" in data

    user.token = data["token"]


@given(
    parsers.parse(
        'the user "{sender}" has sent a friend request to "{receiver}"'
    )
)
def friend_request_exists(
    context,
    friendships_api,
    sender,
    receiver,
):
    sender_user = context.users[sender]
    receiver_user = context.users[receiver]

    assert receiver_user.token is not None, (
        f"{receiver} does not have a session token"
    )

    response = friendships_api.get_pending_requests(
        token=receiver_user.token,
    )

    assert response.status_code == 200, (
        f"Failed to get pending requests for {receiver}: "
        f"{response.status_code}: {response.text}"
    )

    requests = response.json()

    request = next(
        (
            item
            for item in requests
            if item.get("username") == sender_user.username
        ),
        None,
    )

    assert request is not None, (
        f"No pending friend request from "
        f"{sender} to {receiver}"
    )

    request_id = request.get("id")

    assert request_id is not None, (
        f"Friend request from {sender} to {receiver} "
        f"does not contain an ID"
    )

    context.friend_requests[
        f"{sender}->{receiver}"
    ] = request_id


@when(
    parsers.parse(
        '"{sender}" sends a friend request to "{receiver}"'
    )
)
def send_friend_request(
    context,
    friendships_api,
    sender,
    receiver,
):
    sender_user = context.users[sender]
    receiver_user = context.users[receiver]

    assert sender_user.token is not None

    response = friendships_api.send_request(
        token=sender_user.token,
        username=receiver_user.username,
    )

    context.responses[
        f"friend_request_{sender}_{receiver}"
    ] = response


@when(
    parsers.parse(
        '"{receiver}" accepts the friend request from "{sender}"'
    )
)
def accept_friend_request(
    context,
    friendships_api,
    sender,
    receiver,
):
    receiver_user = context.users[receiver]

    assert receiver_user.token is not None

    request_id = context.friend_requests[
        f"{sender}->{receiver}"
    ]

    response = friendships_api.update_request(
        token=receiver_user.token,
        request_id=request_id,
        status="accepted",
    )

    context.responses[
        f"accept_friend_request_{sender}_{receiver}"
    ] = response


@then(
    parsers.parse(
        'the friend request from "{sender}" to "{receiver}" '
        'should be created successfully'
    )
)
def friend_request_created_successfully(
    context,
    sender,
    receiver,
):
    response = context.responses[
        f"friend_request_{sender}_{receiver}"
    ]

    assert response.status_code == 201, (
        f"Expected 201 when sending friend request "
        f"from {sender} to {receiver}, "
        f"got {response.status_code}: {response.text}"
    )


@then(
    parsers.parse(
        'the friend request from "{sender}" to "{receiver}" '
        'should be accepted successfully'
    )
)
def friend_request_accepted_successfully(
    context,
    sender,
    receiver,
):
    response = context.responses[
        f"accept_friend_request_{sender}_{receiver}"
    ]

    assert response.status_code in (200, 204), (
        f"Expected successful acceptance from "
        f"{sender} to {receiver}, "
        f"got {response.status_code}: {response.text}"
    )

@given(
    parsers.parse(
        'the user "{sender}" has already sent a friend request to "{receiver}"'
    )
)
def existing_friend_request(
    context,
    sender,
    receiver,
):
    key = f"friend_request_{sender}_{receiver}"

    assert key in context.responses, (
        f"No previous friend request found from "
        f"{sender} to {receiver}"
    )

    response = context.responses[key]

    assert response.status_code == 201, (
        f"The original friend request from "
        f"{sender} to {receiver} was not created successfully: "
        f"{response.status_code}: {response.text}"
    )


@when(
    parsers.parse(
        '"{sender}" sends a friend request to "{receiver}" again'
    )
)
def send_duplicate_friend_request(
    context,
    friendships_api,
    sender,
    receiver,
):
    sender_user = context.users[sender]
    receiver_user = context.users[receiver]

    assert sender_user.token is not None

    response = friendships_api.send_request(
        token=sender_user.token,
        username=receiver_user.username,
    )

    context.responses[
        f"duplicate_friend_request_{sender}_{receiver}"
    ] = response


@then("the duplicate friend request should be rejected")
def duplicate_friend_request_rejected(
    context,
):
    response = context.responses[
        "duplicate_friend_request_Alice_Bob"
    ]

    assert response.status_code == 409, (
        f"Expected 409 for duplicate friend request, "
        f"got {response.status_code}: {response.text}"
    )

    data = response.json()

    assert data.get("error") == (
        "There is already a pending friend request between these users"
    )