# Token Authentication API (`/api/token`)

This endpoint issues a JWT token for a valid username/password pair.

## Endpoint

- **Method:** `POST`
- **Path:** `/api/token`
- **Content-Type:** `application/json`

---

## Request Body

Send a JSON object:

```json
{
    "username": "abc",
    "password": "123456"
}
```

### Notes
- `username` is trimmed before validation.
- `password` is converted to a string.
- If either value is missing/blank, the API returns `400 Bad Request`.

---

## cURL Example (Correct)

```bash
curl -k -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"abc","password":"123456"}' \
  https://192.168.1.144:8443/api/token
```

> `-H "Content-Type: application/json"` is required when sending JSON with `curl`.

---

## Success Response

**Status:** `200 OK`

```json
{
    "token": "<jwt-token>"
}
```

The token payload includes:
- `userId` (user ID from DB)
- `admin` (`true` if `user_role === "admin"`, else `false`)

Token expiration is controlled by:
- `TOKEN_EXPIRY` environment variable (hours)
- default is `2h` if unset

---

## Error Responses

### 400 Bad Request
Returned when username/password are blank or token header format is bad (in token verification middleware).

Example:
```json
{
    "code": 400,
    "title": "Bad Request",
    "message": "Username and password can't be blank"
}
```

### 404 Not Found
Returned when user does not exist or password check fails.

Example:
```json
{
    "code": 404,
    "title": "Not Found",
    "message": "User not found in database"
}
```

---

## Using the Token on Protected Routes

Pass the token as a Bearer token:

```http
Authorization: Bearer <jwt-token>
```

cURL example:

```bash
curl -k \
  -H "Authorization: Bearer <jwt-token>" \
  https://192.168.1.144:8443/api/protected-resource
```

### 401 Unauthorized
Returned by `verify_token` middleware when JWT is invalid.

Example:
```json
{
    "code": 401,
    "title": "Unauthorized",
    "message": "Bad token"
}
```
