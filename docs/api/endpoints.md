# API endpoint reference

Base URL: `https://<SERVER_IP>:8443`. Set `TOKEN` using
`POST /api/token`; protected requests use `Authorization: Bearer $TOKEN`.

| Method | Path | Auth |
|---|---|---|
| GET | `/` | Public |
| GET | `/api/health` | Public |
| GET | `/api/users` | Session or token |
| GET/POST | `/api/auth/42`, `/api/auth/42/callback` | OAuth flow |
| GET | `/api/auth/me` | Optional |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Public/session |
| PATCH | `/api/auth/me` | Session |
| POST | `/api/auth/avatar` | Session |
| POST | `/api/token` | Public |
| GET/POST | `/api/messages/:recipientId` | Session or token |
| PATCH/DELETE | `/api/messages/` | Session or token |
| GET/POST | `/api/posts`, `/api/posts/comments` | Session or token |
| DELETE | `/api/posts` | Session or token |
| GET/POST/PATCH/DELETE | `/api/friends/...` | Session or token |
| GET | `/api/notifications` | Session or token |

## Smoke tests

```bash
curl -k "$BASE_URL/"
curl -k "$BASE_URL/api/health"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/notifications"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/posts?amount=20"
curl -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/friends"
```

Detailed request bodies and one cURL command for every friends and chat route
are documented in [friends_endpoints.md](/home/aleja/42-Transcendence/docs/api/friends_endpoints.md)
and [chat_endpoints.md](/home/aleja/42-Transcendence/docs/api/chat_endpoints.md).

All endpoints can return `429 Too Many Requests`; retry after the seconds
specified in the `Retry-After` response header.
