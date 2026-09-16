import pytest

from pytest_bdd import when, then, scenarios, parsers


# Run this module after the other test modules.
pytestmark = pytest.mark.order(99)

scenarios("../features/cleanup.feature")


@when(
    parsers.parse(
        '"{sender}" deletes the friendship with "{receiver}"'
    )
)
def delete_friendship(
    context,
    friendships_api,
    sender,
    receiver,
):
    sender_user = context.users[sender]
    receiver_user = context.users[receiver]

    assert sender_user.token is not None, (
        f'User "{sender}" does not have a session token'
    )

    friends_response = friendships_api.get_friends(
        token=sender_user.token,
    )

    assert friends_response.status_code == 200, (
        f"Failed to get friends for {sender}: "
        f"{friends_response.status_code}: "
        f"{friends_response.text}"
    )

    friends = friends_response.json()

    friend = next(
        (
            item
            for item in friends
            if item.get("username") == receiver_user.username
        ),
        None,
    )

    assert friend is not None, (
        f"{receiver} is not currently a friend of {sender}"
    )

    friend_id = friend.get("id")

    assert friend_id is not None, (
        f"Friend {receiver} has no ID in the API response"
    )

    response = friendships_api.delete_friend(
        token=sender_user.token,
        friend_id=friend_id,
    )

    context.responses[
        f"cleanup_delete_friendship_{sender}_{receiver}"
    ] = response


@then(
    parsers.parse(
        'the friendship between "{sender}" and "{receiver}" '
        'should be deleted successfully'
    )
)
def friendship_deleted_successfully(
    context,
    friendships_api,
    sender,
    receiver,
):
    response = context.responses[
        f"cleanup_delete_friendship_{sender}_{receiver}"
    ]

    assert response.status_code == 204, (
        f"Expected 204 when deleting friendship between "
        f"{sender} and {receiver}, got "
        f"{response.status_code}: {response.text}"
    )

    sender_user = context.users[sender]
    receiver_user = context.users[receiver]

    friends_response = friendships_api.get_friends(
        token=sender_user.token,
    )

    assert friends_response.status_code == 200, (
        f"Failed to reload friends for {sender}: "
        f"{friends_response.status_code}: "
        f"{friends_response.text}"
    )

    remaining_friends = friends_response.json()

    assert not any(
        friend.get("username") == receiver_user.username
        for friend in remaining_friends
    ), (
        f"{receiver} is still present in {sender}'s friends list"
    )