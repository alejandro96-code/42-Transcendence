# Messages API (`/api/messages`)

Base path: `/api/messages`  
Authentication: **Required** (`Bearer token`)

## Error format

All error responses follow this format:

```json
{
    "code": 400,
    "phrase": "Bad Request",
    "error": "Description of what went wrong"
}
```

---

## 1) Read conversation with a recipient

**GET** `/api/messages/:recipientId`

Returns the message list between you and `recipientId`, oldest first.

### Path parameters

- `recipientId` (required, number): recipient user id

### Body (JSON)

```json
{
    "amount": 20
}
```

- `amount` (optional, number): maximum number of rows returned (default `20`)

### Success response (200)

```json
[
    {
        "id": 1,
        "sender_id": 12,
        "recipient_id": 31,
        "content": "Hey!",
        "created_at": "2026-08-26T09:00:00.000Z"
    },
    {
        "id": 2,
        "sender_id": 31,
        "recipient_id": 12,
        "content": "Hi!",
        "created_at": "2026-08-26T09:01:00.000Z"
    }
]
```

### Common errors

**400 Bad Request**

```json
{
    "code": 400,
    "phrase": "Bad Request",
    "error": "Wrong recipientId"
}
```

**404 Not Found**

```json
{
    "code": 404,
    "phrase": "Not Found",
    "error": "Recipient not found"
}
```

```json
{
    "code": 404,
    "phrase": "Not Found",
    "error": "No messages were found in database"
}
```

---

## 2) Send message to recipient

**POST** `/api/messages/:recipientId`

Creates a message from the authenticated user to `recipientId`.

### Path parameters

- `recipientId` (required, number)

### Body (JSON)

```json
{
    "content": "Hello there"
}
```

- `content` (required, string, 1 to 1000 chars)

### Success response (201)

```json
{
    "id": 55,
    "sender_id": 12,
    "recipient_id": 31,
    "content": "Hello there",
    "created_at": "2026-08-26T09:10:00.000Z"
}
```

### Common errors

**400 Bad Request**

```json
{
    "code": 400,
    "phrase": "Bad Request",
    "error": "Wrong recipientId"
}
```

```json
{
    "code": 400,
    "phrase": "Bad Request",
    "error": "The message contains non allowed or vulgar words."
}
```

**413 Content Too Large**

```json
{
    "code": 413,
    "phrase": "Content Too Large",
    "error": "Content must be between 1 and 1000 characters long"
}
```

**404 Not Found**

```json
{
    "code": 404,
    "phrase": "Not found",
    "error": "Message sender or receiver not found in Database"
}
```

**500 Internal Server Error**

```json
{
    "code": 500,
    "phrase": "Internal Server Error",
    "error": "Something went bad on post creation"
}
```