#!/usr/bin/env python3

import json
import sys
from datetime import datetime

import requests
import urllib3

# Disable warnings caused by verify=False
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = "https://10.14.8.6:8443/api/auth/register"


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <users.json>")
        sys.exit(1)

    json_file = sys.argv[1]

    try:
        with open(json_file, "r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"Error: file not found: {json_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON: {e}")
        sys.exit(1)

    users = data.get("users")

    if not isinstance(users, list):
        print("Error: JSON must contain a 'users' array")
        sys.exit(1)

    for i, user in enumerate(users, start=1):
        if "name" not in user or "password" not in user:
            print(f"Skipping user #{i}: missing 'name' or 'password'")
            continue

        name = user["name"]
        password = user["password"]

        fullName = f"{name} surname"

        payload = {
            "username": name,
            "password": password,
            "fullName": fullName,
            "email": f"{name}@example.com",
        }

        try:
            response = requests.post(
                API_URL,
                json=payload,
                verify=False,
                timeout=30,
            )

            if response.ok:
                print(f"Created user: {username}")
            else:
                print(
                    f"Failed to create user: {username} "
                    f"(HTTP {response.status_code})"
                )

        except requests.RequestException as e:
            print(f"Failed to create user: {username} ({e})")

    print(f"Done! Processed {len(users)} users.")


if __name__ == "__main__":
    main()