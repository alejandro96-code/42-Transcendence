# Users and authentication API

Set `BASE_URL=https://<SERVER_IP>:8443`. Protected endpoints accept either the
session cookie or `Authorization: Bearer <JWT>`.

## Users

`GET /api/users` is protected and returns public-safe profiles.

```bash
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users"
```

## Local authentication

```bash
curl -k -X POST -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123","fullName":"Alice Bob","email":"alice@example.com"}' \
  "$BASE_URL/api/auth/register"
curl -k -c cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}' "$BASE_URL/api/auth/login"
curl -k -b cookies.txt -X POST "$BASE_URL/api/auth/logout"
```

Registration returns `201`; login returns `200`; logout returns `204`.
Usernames are 3–30 characters, passwords at least 6, and email must be valid.

## Current session and profile

```bash
curl -k -b cookies.txt "$BASE_URL/api/auth/me"
curl -k -b cookies.txt -X PATCH -H "Content-Type: application/json" \
  -d '{"profession":"Software Engineer","description":"Building cool stuff"}' \
  "$BASE_URL/api/auth/me"
curl -k -b cookies.txt -X POST -F "avatar=@./avatar.png" \
  "$BASE_URL/api/auth/avatar"
```

`GET /api/auth/me` is optional (`null` when logged out). Profile and avatar
updates require a session and return `200`; profession is limited to 80
characters and description to 200.

## 42 OAuth

```bash
curl -k -i "$BASE_URL/api/auth/42"
curl -k -i "$BASE_URL/api/auth/42/callback?code=<oauth-code>"
```

These routes redirect to 42 and back to the frontend; they are normally
tested through a browser.

## JWT token

```bash
curl -k -X POST -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}' "$BASE_URL/api/token"
```

The response is `{"token":"..."}`. Invalid credentials return `401`.

## Status codes and limits

`400` invalid input, `401` authentication failure, `404` missing user,
`409` duplicate username/email, and `429` rate limit exceeded. API requests
default to 300 per 15 minutes per client IP; register/login/token requests
default to 20 per 15 minutes. Configure with
`API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`,
`AUTH_RATE_LIMIT_WINDOW_MS`, and `AUTH_RATE_LIMIT_MAX`.
