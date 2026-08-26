#!/usr/bin/env python3

import json
import os
import random
import sys

import requests
import urllib3


urllib3.disable_warnings(
    urllib3.exceptions.InsecureRequestWarning
)


PROFESSIONS = [
    "Software Developer",
    "Game Developer",
    "Web Designer",
    "Cybersecurity Student",
    "Data Analyst",
    "Backend Developer",
    "Frontend Developer",
    "Game Designer",
    "DevOps Engineer",
    "Computer Science Student",
]

DESCRIPTIONS = [
    "Me gusta programar y descubrir nuevas tecnologías.",
    "Fan de los videojuegos y de todo lo relacionado con la informática.",
    "Siempre aprendiendo algo nuevo.",
    "Me encanta trabajar en proyectos y aprender con ellos.",
    "Apasionado por la tecnología, los videojuegos y la música.",
    "Estudiante de informática intentando mejorar cada día.",
    "Me gusta crear cosas y compartirlas con mis amigos.",
    "Programando de día y jugando por la noche.",
]

POSTS = [
    "Hoy toca seguir programando. ¡Un día más!",
    "Acabo de terminar una parte del proyecto. ¡Por fin!",
    "¿Qué juego estáis jugando últimamente?",
    "Un café y unas horas de código. El plan perfecto.",
    "Hoy he aprendido algo nuevo y quería compartirlo.",
    "Por fin viernes. ¡Buen fin de semana a todos!",
    "Trabajando en nuevos proyectos. Poco a poco.",
    "La programación puede ser frustrante, pero cuando funciona merece la pena.",
    "¿Alguien más está trabajando en un proyecto interesante?",
    "Después de varias horas, finalmente he solucionado el problema.",
    "Día tranquilo, código limpio y todo funcionando.",
    "Probando cosas nuevas en el proyecto.",
    "Hoy toca descansar un poco del código.",
    "Cada día se aprende algo diferente.",
    "¡Proyecto terminado! Bueno... casi terminado.",
]


def get_server_ip():
    server_ip = os.getenv("SERVER_IP")

    if server_ip:
        return server_ip.strip()

    env_file = "backend/.env"

    try:
        with open(env_file, "r", encoding="utf-8") as file:
            line = file.readline()

            while line:
                line = line.strip()

                if line.startswith("SERVER_IP="):
                    value = line.split("=", 1)[1].strip()

                    if value:
                        return value

                line = file.readline()

    except Exception:
        return None

    return None


def load_users(json_file):
    try:
        with open(json_file, "r", encoding="utf-8") as file:
            data = json.load(file)

    except Exception:
        return []

    users = data.get("users")

    if not isinstance(users, list):
        return []

    return users


def register_user(session, api_url, user):
    if not isinstance(user, dict):
        return None

    if "name" not in user or "password" not in user:
        return None

    username = str(user["name"]).strip()
    password = str(user["password"])

    payload = {
        "username": username,
        "password": password,
        "fullName": f"{username} surname",
        "email": f"{username}@example.com",
    }

    try:
        response = session.post(
            f"{api_url}/api/auth/register",
            json=payload,
            verify=False,
            timeout=30,
        )
    except Exception:
        return None

    if response.status_code == 201:
        try:
            result = response.json()
        except Exception:
            result = {}

        return {
            "username": username,
            "password": password,
            "id": result.get("id"),
            "session": session,
            "api_url": api_url,
        }

    if response.status_code == 409:
        return login_existing_user(
            session,
            api_url,
            username,
            password,
        )

    return None


def login_existing_user(
    session,
    api_url,
    username,
    password,
):
    payload = {
        "username": username,
        "password": password,
    }

    try:
        response = session.post(
            f"{api_url}/api/auth/login",
            json=payload,
            verify=False,
            timeout=30,
        )
    except Exception:
        return None

    if not response.ok:
        return None

    try:
        result = response.json()
    except Exception:
        result = {}

    return {
        "username": username,
        "password": password,
        "id": result.get("id"),
        "session": session,
        "api_url": api_url,
    }


def update_profile(user):
    session = user["session"]

    payload = {
        "profession": random.choice(PROFESSIONS),
        "description": random.choice(DESCRIPTIONS),
        "avatarUrl": random.choice([
            "/img/avatar1.png",
            "/img/avatar2.png",
        ]),
    }

    try:
        response = session.patch(
            f"{user['api_url']}/api/auth/me",
            json=payload,
            verify=False,
            timeout=30,
        )
    except Exception:
        return False

    return response.ok


def create_post(user, content):
    session = user["session"]

    payload = {
        "content": content,
        "media": [],
    }

    try:
        response = session.post(
            f"{user['api_url']}/api/posts",
            json=payload,
            verify=False,
            timeout=30,
        )
    except Exception:
        return False

    return response.ok


def send_friend_request(sender, recipient):
    session = sender["session"]

    payload = {
        "username": recipient["username"],
    }

    try:
        response = session.post(
            f"{sender['api_url']}/api/friends/requests",
            json=payload,
            verify=False,
            timeout=30,
        )
    except Exception:
        return False

    return response.status_code == 201


def accept_friend_request(recipient, sender_username):
    session = recipient["session"]

    try:
        response = session.get(
            f"{recipient['api_url']}/api/friends/requests",
            verify=False,
            timeout=30,
        )
    except Exception:
        return False

    if not response.ok:
        return False

    try:
        requests_list = response.json()
    except Exception:
        return False

    if not isinstance(requests_list, list):
        return False

    request_id = None
    index = 0

    while index < len(requests_list):
        request = requests_list[index]

        if (
            isinstance(request, dict)
            and request.get("username") == sender_username
        ):
            request_id = request.get("id")
            break

        index += 1

    if request_id is None:
        return False

    payload = {
        "status": "accepted",
    }

    try:
        response = session.patch(
            f"{recipient['api_url']}/api/friends/requests/{request_id}",
            json=payload,
            verify=False,
            timeout=30,
        )
    except Exception:
        return False

    return response.ok


def create_friendships(users):
    if len(users) < 2:
        return

    friendship_pairs = []

    if len(users) >= 2:
        friendship_pairs.append((0, 1))

    if len(users) >= 3:
        friendship_pairs.append((1, 2))

    if len(users) >= 4:
        friendship_pairs.append((0, 3))

    if len(users) >= 5:
        friendship_pairs.append((2, 4))

    if len(users) >= 6:
        friendship_pairs.append((3, 5))

    if len(users) >= 7:
        friendship_pairs.append((0, 6))

    if len(users) >= 8:
        friendship_pairs.append((4, 7))

    index = 0

    while index < len(friendship_pairs):
        sender_index, recipient_index = friendship_pairs[index]

        sender = users[sender_index]
        recipient = users[recipient_index]

        created = send_friend_request(
            sender,
            recipient,
        )

        if created:
            accept_friend_request(
                recipient,
                sender["username"],
            )

        index += 1


def create_posts(users):
    index = 0

    while index < len(users):
        user = users[index]

        if index % 4 == 0:
            post_count = 4
        elif index % 3 == 0:
            post_count = 3
        elif index % 2 == 0:
            post_count = 2
        else:
            post_count = 0

        post_index = 0

        while post_index < post_count:
            content = POSTS[
                (index + post_index) % len(POSTS)
            ]

            create_post(
                user,
                content,
            )

            post_index += 1

        index += 1


def update_profiles(users):
    index = 0

    while index < len(users):
        update_profile(users[index])
        index += 1


def prepare_users(users, api_url):
    prepared_users = []

    index = 0

    while index < len(users):
        session = requests.Session()

        user = register_user(
            session,
            api_url,
            users[index],
        )

        if user is not None:
            prepared_users.append(user)

        index += 1

    return prepared_users


def main():
    if len(sys.argv) != 2:
        return

    json_file = sys.argv[1]

    server_ip = get_server_ip()

    if not server_ip:
        return

    api_url = f"https://{server_ip}:8443"

    users = load_users(json_file)

    if not users:
        return

    prepared_users = prepare_users(
        users,
        api_url,
    )

    if not prepared_users:
        return

    update_profiles(prepared_users)
    create_friendships(prepared_users)
    create_posts(prepared_users)

    print("populate generated")


if __name__ == "__main__":
    main()