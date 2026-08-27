# Friends API (`/api/friends`)

This section is a user-facing template for the Friends module.

## Authentication

Most friends endpoints are typically protected and require:
- an active session, **or**
- a valid Bearer token.

---

## Typical Friends Actions (example structure)

### Send friend request
- **Method:** `POST`
- **Path:** `/api/friends/requests`
- **Body:**
```json
{
  "recipientId": 42
}
```

### Accept friend request
- **Method:** `PATCH`
- **Path:** `/api/friends/requests/:requestId/accept`

### Decline friend request
- **Method:** `PATCH`
- **Path:** `/api/friends/requests/:requestId/decline`

### Remove friend
- **Method:** `DELETE`
- **Path:** `/api/friends/:friendId`

### List friends
- **Method:** `GET`
- **Path:** `/api/friends`

### List pending requests
- **Method:** `GET`
- **Path:** `/api/friends/requests/pending`

---

## cURL Example (template)

```bash
curl -k -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"recipientId":42}' \
  https://192.168.1.144:8443/api/friends/requests
```

---

## Typical Responses

### 200 OK
Action/read success.

### 201 Created
Friend request sent.

### 204 No Content
Delete/remove success.

### 400 Bad Request
Invalid input.

### 401 Unauthorized
Invalid/expired token.

### 404 Not Found
User/request/friend relation not found.

### 409 Conflict
Duplicate request or already friends.