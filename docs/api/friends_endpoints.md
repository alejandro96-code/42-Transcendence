# Friends API (`/api/friends`)

All endpoints require a session or `Authorization: Bearer <JWT>`.
Examples use `BASE_URL` and `$TOKEN` as described in
[chat_endpoints.md](/home/aleja/42-Transcendence/docs/api/chat_endpoints.md).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/friends` | List your accepted friends |
| GET | `/api/friends/user/:userId` | List a user's friends (only yourself or an accepted friend) |
| GET | `/api/friends/search?q=ali` | Search your friends |
| GET | `/api/friends/:friendId/profile` | Read your own or a friend's profile |
| GET | `/api/friends/requests` | List pending requests received |
| POST | `/api/friends/heartbeat` | Update your online presence |
| POST | `/api/friends/requests` | Send a request by username |
| PATCH | `/api/friends/requests/:requestId` | Accept/reject a request |
| DELETE | `/api/friends/:friendId` | Remove a friend |

```bash
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends/user/42"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends/search?q=ali"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends/42/profile"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends/requests"
curl -k -X POST -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends/heartbeat"
curl -k -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"username":"alice"}' "$BASE_URL/api/friends/requests"
curl -k -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"accepted"}' "$BASE_URL/api/friends/requests/10"
curl -k -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends/42"
```

Successful request creation returns `201`; reads and updates return `200`;
deletion returns `204`. Invalid input is `400`, unauthenticated requests
return `401`, missing resources `404`, conflicts `409`, and rate-limited
requests `429`.
