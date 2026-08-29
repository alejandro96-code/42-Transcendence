from pytest_bdd import given, when, then, scenarios, parsers


scenarios("../features/chat.feature")


@given(
    parsers.parse(
        'the user "{name}" is registered'
    )
)
def registered_user(context, name):
    assert name in context.users, (
        f'User "{name}" is not registered in the test context'
    )


@given(
    parsers.parse(
        '"{name}" has a session token'
    )
)
def user_has_session_token(context, name):
    user = context.users[name]

    assert user.token is not None, (
        f'User "{name}" does not have a session token'
    )


@when(
    parsers.parse(
        '"{sender}" sends a message to "{receiver}" '
        'saying "{content}"'
    )
)
def send_message(
    context,
    chat_api,
    sender,
    receiver,
    content,
):
    sender_user = context.users[sender]
    receiver_user = context.users[receiver]

    assert sender_user.token is not None, (
        f'User "{sender}" does not have a session token'
    )

    assert receiver_user.id is not None, (
        f'User "{receiver}" does not have an ID'
    )

    response = chat_api.send_message(
        token=sender_user.token,
        recipient_id=receiver_user.id,
        content=content,
    )

    context.responses[
        f"message_{sender}_{receiver}"
    ] = response


@then(
    parsers.parse(
        'the message from "{sender}" to "{receiver}" '
        'should be sent successfully'
    )
)
def message_sent_successfully(
    context,
    sender,
    receiver,
):
    response = context.responses[
        f"message_{sender}_{receiver}"
    ]

    assert response.status_code == 201, (
        f"Expected 201 when sending a message from "
        f"{sender} to {receiver}, "
        f"got {response.status_code}: {response.text}"
    )