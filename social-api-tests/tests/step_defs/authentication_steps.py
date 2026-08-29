import pytest

from pytest_bdd import given, when, then, scenarios, parsers

from tests.models.user import User


scenarios("../features/authentication.feature")

pytestmark = pytest.mark.order(1)


@given(
    parsers.parse(
        'I have a new user named "{name}"'
    )
)
def new_user(context, name):
    user = User(
        username=name,
        email=f"{name.lower()}@example.com",
        fullName=f"{name}_FullName",
        password="Password123!",
    )

    context.users[name] = user


@when(
    parsers.parse(
        'I register the user "{name}"'
    )
)
def register_user(context, auth_api, name):
    user = context.users[name]

    response = auth_api.register(
        username=user.username,
        email=user.email,
        fullName=user.fullName,
        password=user.password,
    )

    context.responses[f"register_{name}"] = response

    assert response.status_code in (201, 409), (
        f"Failed to register {name}: "
        f"{response.status_code}: {response.text}"
    )

    # If newly created, save the ID immediately.
    if response.status_code == 201:
        data = response.json()

        assert "id" in data, (
            f"Registration response has no id: {data}"
        )

        user.id = data["id"]


@then(
    parsers.parse(
        'the registration of "{name}" should be successful'
    )
)
def registration_successful(context, name):
    response = context.responses[f"register_{name}"]

    assert response.status_code in (201, 409)