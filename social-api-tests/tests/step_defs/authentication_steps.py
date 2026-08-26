# tests/step_defs/authentication_steps.py

from pytest_bdd import given, when, then, scenarios


scenarios("../features/authentication.feature")


@given("I have a new user")
def new_user(context):
    context["user"] = {
        "username": "test_user",
        "email": "test_user@example.com",
        "fullName": "test_user_fullName",
        "password": "Password123!",
    }


@when("I register the user")
def register_user(context, auth_api):
    user = context["user"]

    context["response"] = auth_api.register(
        username=user["username"],
        email=user["email"],
        fullName=user["fullName"],
        password=user["password"],
    )


@then("the registration should be successful")
def registration_successful(context):
    assert context["response"].status_code == 201