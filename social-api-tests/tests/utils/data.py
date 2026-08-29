import uuid


def unique_user():
    identifier = uuid.uuid4().hex[:8]

    return {
        "username": f"test_{identifier}",
        "email": f"test_{identifier}@example.com",
        "fullName": f"test_{identifier}_fullName",
        "password": "Password123!",
    }