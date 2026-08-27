# Posts API (`/api/posts`)

Base path: `/api/posts`  
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

## 1) List posts

**GET** `/api/posts`

Returns posts for a target user or filtered posts.

### Query parameters

- `user` (optional, number): user id to fetch posts from.  
  If omitted, your own user id is used.
- `amount` (optional, number): max number of posts to return. Default: `50`.
- `filter` (optional, string):
  - `mentions`: returns posts where you are mentioned (from accepted friends).

### Success response (200)

```json
[
    {
        "id": 101,
        "author_id": 12,
        "author_username": "alice",
        "content": "Hello world",
        "media": [],
        "parent": 0,
        "created_at": "2026-08-26T10:00:00.000Z"
    }
]
```

---

## 2) List comments for a parent post

**GET** `/api/posts/comments`

Returns posts that are comments of a given parent post.

### Body (JSON)

```json
{
    "parent": 101,
    "amount": 50
}
```

- `parent` (required, number): parent post id
- `amount` (optional, number): max number of comments. Default: `50`

### Success response (200)

```json
[
    {
        "id": 203,
        "author_id": 19,
        "author_username": "bob",
        "content": "Nice post!",
        "media": [],
        "parent": 101,
        "created_at": "2026-08-26T10:05:00.000Z"
    }
]
```

### Not found (404)

```json
{
    "code": 404,
    "phrase": "Not Found",
    "error": "No posts were found in database"
}
```

---

## 3) Create post

**POST** `/api/posts`

Creates a new post.

### Body (JSON)

```json
{
    "content": "My first post",
    "image": "https://cdn.example.com/pic.jpg",
    "parent": 0
}
```

- `content` (required, string): post content
- `image` (optional, string): image URL
- `parent` (optional, number): parent post id for comments/replies (default `0`)

### Success response (200)

```json
[
    {
        "id": 301,
        "author_id": 12,
        "author_username": "alice",
        "content": "My first post",
        "media": [
            "https://cdn.example.com/pic.jpg"
        ],
        "parent": 0,
        "created_at": "2026-08-26T10:15:00.000Z"
    }
]
```

### Common errors

**400 Bad Request**

```json
{
    "code": 400,
    "phrase": "Bad Request",
    "error": "The media contains vulgar words"
}
```

**404 Not Found**

```json
{
    "code": 404,
    "phrase": "Not found",
    "error": "Post author not found in Database"
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

## 4) Create comment

**POST** `/api/posts/comments`

Creates a comment for an existing post.

### Body (JSON)

```json
{
    "content": "Nice post!",
    "parent": 101
}
```

### Common errors

**500 Internal Server Error**

```json
{
    "code": 500,
    "phrase": "Internal Server Error",
    "error": "Something went bad on post creation"
}
```

## 5) Delete post

**DELETE** `/api/posts`

Deletes a post by id.

### Body (JSON)

```json
{
    "id": 101
}
```

### Success response

- `204 No Content`

### Error response (500)

```json
{
    "code": 500,
    "phrase": "Internal Server Error",
    "error": "Something went bad on post creation"
}
```