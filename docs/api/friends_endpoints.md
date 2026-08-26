# Friends API (`/api/friends`)

Base path: `/api/friends`  
Authentication: **Required** (`Bearer token`)

## Error format

Endpoints in this group return either simple error objects (`{"error":"..."}`) or, in some cases, structured errors.  
When structured errors are used, the format is:

```json
{
    "code": 400,
    "phrase": "Bad Request",
    "error": "Description of what went wrong"
}
```

---

## 1) Get my friends list

**GET** `/api/friends`

Returns accepted friends of the authenticated user.

### Success response (200)

```json
[
    {
        "id": 31,
        "username": "bob",
        "full_name": "Bob Smith",
        "avatar_url": "https://cdn.example.com/avatar.jpg",
        "profession": "Developer",
        "description": "Loves APIs",
        "last_seen": "2026-08-26T09:20:00.000Z",
        "is_online": true
    }
]
```

---

## 2) Get friends list of a specific user

**GET** `/api/friends/user/:userId`

If `userId` is not your own user id, access is allowed only when you are friends with that user.

### Path parameters

- `userId` (required, integer)

### Success response (200)

```json
[
    {
        "id": 42,
        "username": "charlie",
        "full_name": "Charlie Doe",
        "avatar_url": null,
        "profession": null,
        "description": null,
        "last_seen": "2026-08-26T08:00:00.000Z"
    }
]
```

### Common errors

- `400` `{ "error": "Invalid user." }`
- `403` `{ "error": "You can not see the friends of this user." }`

---

## 3) Search friends

**GET** `/api/friends/search?q=<text>`

Searches accepted friends by `username` or `full_name` (case-insensitive).

### Query parameters

- `q` (optional, string). If empty, returns `[]`.

### Success response (200)

```json
[
    {
        "id": 31,
        "username": "bob",
        "full_name": "Bob Smith",
        "avatar_url": "https://cdn.example.com/avatar.jpg",
        "profession": "Developer",
        "description": "Loves APIs",
        "last_seen": "2026-08-26T09:20:00.000Z"
    }
]
```

---

## 4) Get friend profile

**GET** `/api/friends/:friendId/profile`

Returns a user profile when it is your own profile or the user is your accepted friend.

### Path parameters

- `friendId` (required, integer)

### Success response (200)

```json
{
    "id": 31,
    "username": "bob",
    "email": "bob@example.com",
    "full_name": "Bob Smith",
    "avatar_url": "https://cdn.example.com/avatar.jpg",
    "profession": "Developer",
    "description": "Loves APIs",
    "last_seen": "2026-08-26T09:20:00.000Z"
}
```

### Common errors

- `400` `{ "error": "Invalid friend." }`
- `404` `{ "error": "Profile not found." }`

---

## 5) Get incoming friend requests

**GET** `/api/friends/requests`

Returns pending requests where you are the recipient.

### Success response (200)

```json
[
    {
        "id": 77,
        "username": "diana",
        "email": "diana@example.com",
        "created_at": "2026-08-26T09:00:00.000Z"
    }
]
```

---

## 6) Send friend request

**POST** `/api/friends/requests`

Creates a friend request by target username.

### Body (JSON)

```json
{
    "username": "diana"
}
```

### Success response (201)

```json
{
    "message": "Friend request sent."
}
```

### Common errors

- `400` `{ "error": "A nick is mandatory." }`
- `400` `{ "error": "You can not send a friend request to yourself." }`
- `404` `{ "error": "That user does not exist." }`
- `409` `{ "error": "You are already friends." }`
- `409` `{ "error": "There is already a pending friend request between these users." }`

---

## 7) Accept or reject friend request

**PATCH** `/api/friends/requests/:requestId`

Updates request status.

### Path parameters

- `requestId` (required, integer)

### Body (JSON)

```json
{
    "status": "accepted"
}
```

Allowed values for `status`:
- `accepted`
- `rejected`

### Success response (200)

```json
{
    "message": "Friend request accepted successfully."
}
```

### Common errors

- `400` `{ "error": "Invalid friend request." }`
- `400` `{ "error": "Invalid action. Must be accepted o rejected." }`
- `404` `{ "error": "Friend request not found or already processed." }`

---

## 8) Delete friend

**DELETE** `/api/friends/:friendId`

Removes an accepted friendship and associated direct messages between both users.

### Path parameters

- `friendId` (required, integer)

### Success response

- `204 No Content`

### Common errors

- `400` `{ "error": "Invalid friend." }`
- `404` `{ "error": "Friend not found." }`

---

## 9) Presence heartbeat

**POST** `/api/friends/heartbeat`

Updates your `last_seen` timestamp.

### Success response (200)

```json
{
    "success": true
}
```

### Error response

- `500` `{ "error": "Error updating presence." }`