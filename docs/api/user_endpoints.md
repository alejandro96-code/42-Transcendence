# User & Auth API (`/api/auth`, `/api/users`)

These endpoints cover account registration/login/logout, profile retrieval/update, OAuth login, token issuance, and public user listing.

---

## Public User Listing

### Get users
- **Method:** `GET`
- **Path:** `/api/users`

Returns public-safe user fields for all users.

#### cURL
```bash
curl -k https://192.168.1.144:8443/api/users
```

---

## Auth: Local Account

### Register
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Content-Type:** `application/json`

```json
{
  "username": "abc",
  "password": "123456",
  "fullName": "Alice Bob",
  "email": "alice@example.com"
}
```

On success, account is created and session is started.

---

### Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Content-Type:** `application/json`

```json
{
  "username": "abc",
  "password": "123456"
}
```

On success, session is started.

---

### Logout
- **Method:** `POST`
- **Path:** `/api/auth/logout`

Logs out and clears current session.

---

## Auth: Current User

### Get current user
- **Method:** `GET`
- **Path:** `/api/auth/me`

Returns current user profile if logged in by session, otherwise `null`.

---

### Update current user profile
- **Method:** `PATCH`
- **Path:** `/api/auth/me`
- **Content-Type:** `application/json`
- **Auth:** **Session required**

```json
{
  "profession": "Software Engineer",
  "description": "Building cool stuff",
  "avatarUrl": "/img/avatar1.png"
}
```

---

## Auth: 42 OAuth

### Start OAuth
- **Method:** `GET`
- **Path:** `/api/auth/42`

Redirects to 42 login.

### OAuth callback
- **Method:** `GET`
- **Path:** `/api/auth/42/callback`

Completes OAuth login and redirects to frontend profile page.

---

## Auth: JWT Token

### Issue token
- **Method:** `POST`
- **Path:** `/api/token`
- **Content-Type:** `application/json`

```json
{
  "username": "abc",
  "password": "123456"
}
```

Success:
```json
{
  "token": "<jwt-token>"
}
```

Use on protected routes:
```http
Authorization: Bearer <jwt-token>
```

---

## Typical Responses

### 200 OK
Read/login/token success.

### 201 Created
Registration success.

### 204 No Content
Logout success.

### 400 Bad Request
Invalid input.

### 401 Unauthorized
Invalid credentials/token (depending on endpoint).

### 403 Forbidden
Input blocked by policy (for example profanity validation).

### 404 Not Found
Resource/user not found.

### 409 Conflict
Username/email already in use.