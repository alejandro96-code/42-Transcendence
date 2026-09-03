# Chat API (`/api/messages`)

All endpoints require a logged-in session or `Authorization: Bearer <JWT>`.
The authenticated user is always taken from the session/token, never from a
client-supplied sender identity.

## Endpoints

### Read a conversation

```bash
curl -k -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/messages/42?amount=20"
```

`GET /api/messages/:recipientId` returns messages oldest first. `recipientId`
must be a positive user ID different from the authenticated user. `amount` is
optional and defaults to 20.

### Send a message

```bash
curl -k -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!"}' "$BASE_URL/api/messages/42"
```

`POST /api/messages/:recipientId` returns `201` and the created message.
Content is trimmed and must contain 1–1000 characters.

### Edit your message

```bash
curl -k -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":123,"new_body":"Updated text"}' "$BASE_URL/api/messages/"
```

`PATCH /api/messages/` returns `200`. Only the original sender can edit it;
`content` is also accepted as an alias for `new_body`.

### Delete your message

```bash
curl -k -X DELETE -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":123,"sender_id":7}' "$BASE_URL/api/messages/"
```

`DELETE /api/messages/` returns `204`. `sender_id` is required and must match
the authenticated user. This prevents deleting another user's message.

## Common responses

`400` invalid input, `401` missing/malformed/invalid authentication, `404` unknown user
or message, `429` rate limit exceeded, `500` database error.

Set `BASE_URL` to the deployment URL, for example
`https://192.168.1.144:8443`, and obtain `$TOKEN` with `POST /api/token`.
