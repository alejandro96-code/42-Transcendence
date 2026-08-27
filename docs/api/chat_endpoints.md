# Chat API (`/api/messages`)

These endpoints let you read, send, edit, and delete direct messages between you and another user.

## Authentication

Protected routes under `/api/messages` require **either**:
- an active login session, **or**
- a valid Bearer token.

---

## 1) Read conversation

- **Method:** `GET`
- **Path:** `/api/messages/:recipientId`
- **Content-Type:** `application/json`

Returns the message history between you and `recipientId` (oldest → newest).

### Path Parameter
- `recipientId` (number): the other user’s ID.

### Optional limit
The API supports an optional `amount` limit (default: `20`).

---

## 2) Send message

- **Method:** `POST`
- **Path:** `/api/messages/:recipientId`
- **Content-Type:** `application/json`

Creates a new message to `recipientId`.

### Request Body
```json
{
  "content": "Hello!"
}
```

### Notes
- Message content must be between 1 and 1000 characters.
- You cannot message yourself.

---

## 3) Edit message

- **Method:** `PATCH`
- **Path:** `/api/messages/`
- **Content-Type:** `application/json`

Updates an existing message.

### Request Body (expected)
```json
{
  "id": 123,
  "new_body": "Updated text"
}
```

---

## 4) Delete message

- **Method:** `DELETE`
- **Path:** `/api/messages/`
- **Content-Type:** `application/json`

Deletes a message by id.

### Request Body
```json
{
  "id": 123
}
```

---

## cURL Example (Read conversation)

```bash
curl -k \
  -H "Authorization: Bearer <jwt-token>" \
  https://192.168.1.144:8443/api/messages/42
```

---

## Typical Responses

### 200 OK
Returned for successful reads.

### 201 Created
Returned when a message is successfully created.

### 204 No Content
Returned when update/delete succeeds without response body.

### 400 Bad Request
Invalid recipient, invalid input, or malformed auth header.

### 401 Unauthorized
Invalid/expired token.

### 404 Not Found
Conversation/user/message not found.