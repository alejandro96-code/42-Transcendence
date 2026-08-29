import pytest

from pytest_bdd import when, then, scenarios, parsers

from tests.models.post import Post


scenarios("../features/posts.feature")

pytestmark = pytest.mark.order(4)


@when(
    parsers.parse(
        '"{name}" creates a post with content "{content}"'
    )
)
def create_post(context, posts_api, name, content):
    user = context.users[name]

    assert user.token is not None, (
        f'User "{name}" does not have a session token'
    )

    response = posts_api.create_post(
        token=user.token,
        content=content,
    )

    context.responses[f"post_{name}"] = response


@then("the post should be created successfully")
def post_created_successfully(context):
    response = next(
        response
        for key, response in reversed(context.responses.items())
        if key.startswith("post_")
    )

    assert response.status_code == 201, (
        f"Failed to create post. "
        f"Expected 201, got {response.status_code}: "
        f"{response.text}"
    )

    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0

    post = Post(**data[0])

    context.posts.append(post)


@then(parsers.parse('the post content should be "{expected_content}"'))
def post_content_should_be(context, expected_content):
    post = context.posts[-1]

    assert post.content == expected_content