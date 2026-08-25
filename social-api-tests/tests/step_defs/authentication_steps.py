# tests/step_defs/authentication_steps.py

from pytest_bdd import given, when, then


@given("I have a unique user")
def unique_user():
    pass


@when("I register the user")
def register_user():
    pass


@then("the registration should succeed")
def registration_succeeds():
    pass