from pytest_bdd import given, when, then, scenarios, parsers


scenarios("../features/mentions.feature")


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
        '"{author}" creates a post mentioning "{mentioned}"'
    )
)
def create_mention_post(
    context,
    posts_api,
    author,
    mentioned,
):
    author_user = context.users[author]
    mentioned_user = context.users[mentioned]

    assert author_user.token is not None

    content = f"Hi @{mentioned_user.username}!"

    response = posts_api.create_post(
        token=author_user.token,
        content=content,
    )

    context.responses[
        f"mention_{author}_{mentioned}"
    ] = response

    context.mention_posts[
        f"{author}->{mentioned}"
    ] = {
        "content": content,
        "response": response,
    }


@then(
    parsers.parse(
        'the mention post from "{author}" to "{mentioned}" '
        'should be created successfully'
    )
)
def mention_post_created_successfully(
    context,
    author,
    mentioned,
):
    response = context.responses[
        f"mention_{author}_{mentioned}"
    ]

    assert response.status_code == 201, (
        f"Expected 201 when {author} mentions {mentioned}, "
        f"got {response.status_code}: {response.text}"
    )

    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0

    post = data[0]

    expected_content = f"Hi @{mentioned}!"

    assert post["content"] == expected_content

    context.mention_posts[
        f"{author}->{mentioned}"
    ]["post"] = post


@when(
    parsers.parse(
        '"{name}" gets their mentions'
    )
)
def get_mentions(context, posts_api, name):
    user = context.users[name]

    assert user.token is not None

    response = posts_api.get_posts(
        token=user.token,
        filter="mentions",
    )

    context.responses[
        f"mentions_{name}"
    ] = response


@then(
    parsers.parse(
        '"{mentioned}" should see a post from "{author}" mentioning them'
    )
)
def verify_mention_in_feed(
    context,
    author,
    mentioned,
):
    response = context.responses[
        f"mentions_{mentioned}"
    ]

    assert response.status_code == 200, (
        f"Expected 200 when getting mentions for {mentioned}, "
        f"got {response.status_code}: {response.text}"
    )

    posts = response.json()

    assert isinstance(posts, list), (
        f"Expected mentions response to be a list, "
        f"got {type(posts).__name__}: {posts}"
    )

    expected_content = f"Hi @{mentioned}!"

    matching_posts = [
        post
        for post in posts
        if post.get("content") == expected_content
        and post.get("author_username") == author
    ]

    assert matching_posts, (
        f'Could not find post from "{author}" mentioning '
        f'"{mentioned}" in the mentions feed. '
        f"Received: {posts}"
    )