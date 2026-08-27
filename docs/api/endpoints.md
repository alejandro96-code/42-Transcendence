# API Endpoints Audit

## Legend
- **Session auth**: you must be logged in via the website/app (cookie session).
- **Token auth**: you must send a Bearer token in `Authorization` header.
- For endpoints marked **Session or Token**, either method works.

| Method | Path | What it does (for the user) | Main input | Access needed | Can use without session? | Can use without token? |
|---|---|---|---|---|---|---|
| GET | `/` | Confirms API is running | None | Public | Yes | Yes |
| GET | `/api/health` | Confirms backend can reach database | None | Public | Yes | Yes |
| GET | `/api/users` | Lists user profiles (public-safe fields) | None | Public | Yes | Yes |
| GET | `/api/auth/42` | Starts 42 OAuth sign-in | None | Public | Yes | Yes |
| GET | `/api/auth/42/callback` | Completes 42 OAuth sign-in and redirects | OAuth callback params | Public (OAuth flow) | Yes | Yes |
| GET | `/api/auth/me` | Returns your current logged-in account (or `null`) | None | Optional | Yes | Yes |
| POST | `/api/auth/register` | Creates a new account and logs you in | `username`, `password`, `fullName`, `email` | Public | Yes | Yes |
| POST | `/api/auth/login` | Logs in with username/password | `username`, `password` | Public | Yes | Yes |
| POST | `/api/auth/logout` | Logs out current session | None | Public/Logged-in context | Yes | Yes |
| PATCH | `/api/auth/me` | Updates your profile (profession, description, avatar rules apply) | `profession`, `description`, `avatarUrl` | **Session required** | No | Yes |
| POST | `/api/token` | Generates API token for user credentials | `username`, `password` | Public | Yes | Yes |
| GET | `/api/messages/:recipientId` | Gets conversation with a specific user | `recipientId`, optional limit | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| POST | `/api/messages/:recipientId` | Sends a message to a specific user | `recipientId`, `content` | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| PATCH | `/api/messages/` | Updates one of your messages | Message update fields | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| DELETE | `/api/messages/` | Deletes a message | `id` | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| GET | `/api/posts/comments` | Lists comments for a post/thread | Parent post id, optional limit | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| POST | `/api/posts/comments` | Creates a comment on a post/thread | Comment payload | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| GET | `/api/posts` | Lists posts (yours/selected user/mentions) | Query: `user`, `amount`, `filter` | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| POST | `/api/posts` | Creates a new post | `content`, optional `image`, optional `parent` | **Session or Token** | Yes (if token provided) | Yes (if session exists) |
| DELETE | `/api/posts` | Deletes one of your posts | `id` | **Session or Token** | Yes (if token provided) | Yes (if session exists) |

## Summary
- **Public endpoints** (no login/token needed): homepage, health, users list, register/login/logout, OAuth start/callback, token creation.
- **Protected content endpoints** (posts/messages): require **either** logged-in session **or** Bearer token.
- **Profile edit endpoint** (`PATCH /api/auth/me`): requires an active **session login**.