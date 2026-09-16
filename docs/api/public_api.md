# Public API (`/api/public`)

A machine-to-machine API for external integrations to read and write data in
the database. It is completely independent from the browser app: it does not
use cookies or JWT user tokens, only a static API key.

## Authentication

Every request must include the API key configured in `PUBLIC_API_KEY`
(`backend/.env`) as a header:

```
X-API-Key: <your-public-api-key>
```

Requests without a valid key receive `401 Unauthorized`
(`errorCode: "PUBLIC_API_KEY_INVALID"`).

## Rate limiting

`/api/public/*` is covered by the same limiter as the rest of `/api`
(`API_RATE_LIMIT_MAX` requests per `API_RATE_LIMIT_WINDOW_MS`, 300 requests
per 2 minutes by default). Exceeding it returns `429 Too Many Requests` with
a `Retry-After` header.

## Base URL

`https://<SERVER_IP>:8443/api/public`

---

## GET /users

List users' public profile fields.

**Query params:** `amount` (optional, default `50`).

```bash
curl -k -H "X-API-Key: $PUBLIC_API_KEY" \
  "https://<SERVER_IP>:8443/api/public/users?amount=20"
```

**200 OK**
```json
[
  { "id": 1, "username": "alice", "full_name": "Alice", "avatar_url": "...", "profession": null, "description": null }
]
```

---

## GET /posts

List posts, newest first.

**Query params:** `amount` (optional, default `50`).

```bash
curl -k -H "X-API-Key: $PUBLIC_API_KEY" \
  "https://<SERVER_IP>:8443/api/public/posts?amount=20"
```

**200 OK**
```json
[
  { "id": 10, "author_id": 2, "author_username": "prueba", "content": "Hello", "media": null, "created_at": "...", "updated_at": "..." }
]
```

---

## POST /posts

Create a post on behalf of an existing user.

**Body**
```json
{ "author_id": 2, "content": "Hello from the public API" }
```

- `author_id` must be an existing user id.
- `content` is required, 1-200 characters.

```bash
curl -k -X POST -H "X-API-Key: $PUBLIC_API_KEY" -H "Content-Type: application/json" \
  -d '{"author_id":2,"content":"Hello from the public API"}' \
  "https://<SERVER_IP>:8443/api/public/posts"
```

**201 Created** — the created post. `400` if `author_id`/`content` are
invalid, `404` (`PUBLIC_POST_AUTHOR_NOT_FOUND`) if the author doesn't exist.

---

## PUT /posts/:postId

Replace a post's content.

**Body**
```json
{ "content": "Edited via PUT" }
```

```bash
curl -k -X PUT -H "X-API-Key: $PUBLIC_API_KEY" -H "Content-Type: application/json" \
  -d '{"content":"Edited via PUT"}' \
  "https://<SERVER_IP>:8443/api/public/posts/10"
```

**200 OK** — the updated post. `404` (`PUBLIC_POST_NOT_FOUND`) if it doesn't exist.

---

## DELETE /posts/:postId

```bash
curl -k -X DELETE -H "X-API-Key: $PUBLIC_API_KEY" \
  "https://<SERVER_IP>:8443/api/public/posts/10"
```

**204 No Content**. `404` (`PUBLIC_POST_NOT_FOUND`) if it doesn't exist.
