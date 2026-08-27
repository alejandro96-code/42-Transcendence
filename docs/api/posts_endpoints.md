# Posts API (`/api/posts`)

These endpoints let you create posts, read posts, read comments, add comments, and delete your own posts.

## Authentication

Protected routes under `/api/posts` require **either**:
- an active login session, **or**
- a valid Bearer token.

---

## 1) Read posts

- **Method:** `GET`
- **Path:** `/api/posts`
- **Content-Type:** `application/json`

Returns posts for:
- the current user (default), or
- another user via query parameter, or
- mention feed if `filter=mentions`.

### Query Parameters
- `user` (optional): user ID to fetch posts for.
- `amount` (optional): max number of posts (default: `50`).
- `filter` (optional): currently supports `mentions`.

### Example
`/api/posts?user=7&amount=20`  
`/api/posts?filter=mentions`

---

## 2) Create post

- **Method:** `POST`
- **Path:** `/api/posts`
- **Content-Type:** `application/json`

Creates a new post by the authenticated user.

### Request Body
```json
{
  "content": "My first post",
  "image": "data-or-url-optional",
  "parent": 0
}
```

### Notes
- `content` is required.
- `image` is optional.
- `parent` can be used for threaded behavior.

---

## 3) Delete post

- **Method:** `DELETE`
- **Path:** `/api/posts`
- **Content-Type:** `application/json`

Deletes one of your posts.

### Request Body
```json
{
  "id": 123
}
```

---

## 4) Read comments

- **Method:** `GET`
- **Path:** `/api/posts/comments`
- **Content-Type:** `application/json`

Returns comments for a parent post/thread.

### Input
- Parent identifier and optional amount are supported by the API.

---

## 5) Create comment

- **Method:** `POST`
- **Path:** `/api/posts/comments`
- **Content-Type:** `application/json`

Creates a comment under a parent post/thread.

### Request Body (typical)
```json
{
  "parent": 123,
  "content": "Nice post!"
}
```

---

## cURL Example (Create post)

```bash
curl -k -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"content":"Hello world"}' \
  https://192.168.1.144:8443/api/posts
```

---

## Typical Responses

### 200 OK
Successful reads.

### 201 Created
Post/comment created successfully.

### 204 No Content
Post deleted successfully.

### 400 Bad Request
Invalid payload.

### 401 Unauthorized
Invalid/expired token.

### 404 Not Found
Requested resource not found.