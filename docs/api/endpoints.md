# API Endpoints Audit

## Legend
- **Session auth** = `req.isAuthenticated()` / Passport session cookie
- **Token auth** = Bearer JWT checked by `verify_token`
- For routes using `verify_token`, access is allowed with **either** valid session **or** valid token.

| Method | Path | Handler / Source | What it does | Required input (main) | Auth required | Reachable **without session** | Reachable **without token** | Notes / security observations |
|---|---|---|---|---|---|---|---|---|
| GET | `/` | server | Health-ish welcome message | None | No | Yes | Yes | Public info endpoint |
| GET | `/api/health` | server | DB connectivity check (`SELECT 1`) | None | No | Yes | Yes | Public infra signal |
| GET | `/api/users` | server | Returns all users (sanitized via `toPublicUser`) | None | No | Yes | Yes | Public user listing; may be privacy-sensitive |
| GET | `/api/auth/42` | server (passport) | Starts OAuth login with 42 | None | No | Yes | Yes | Redirect flow endpoint |
| GET | `/api/auth/42/callback` | server (passport) | OAuth callback, logs user in, redirects | OAuth callback params | No (OAuth) | Yes | Yes | External provider trust boundary |
| GET | `/api/auth/me` | server | Returns current user or `null` | None | No (optional identity) | Yes | Yes | Reads session only; does not use JWT here |
| POST | `/api/auth/register` | server | Registers local user + logs in session | `username,password,fullName,email` | No | Yes | Yes | Has validation + profanity checks |
| POST | `/api/auth/login` | server | Local login + sets session | `username,password` | No | Yes | Yes | Session creation endpoint |
| POST | `/api/auth/logout` | server | Logs out and destroys session | None | No (best effort) | Yes | Yes | Clears cookie |
| PATCH | `/api/auth/me` | server | Update profile fields | `profession,description,avatarUrl` | **Session required** (`isAuthenticated`) | **No** | Yes | JWT alone won’t pass this route |
| POST | `/api/token` | token.js | Issues JWT token | `username,password` | No | Yes | Yes | Token minting endpoint; rate-limit recommended |
| GET | `/api/messages/:recipientId` | chat.js | Read chat messages with recipient | `recipientId`, optional `body.amount` | `verify_token` (session or JWT) | Yes (with token) | Yes (with session) | Uses body in GET for limit (unusual) |
| POST | `/api/messages/:recipientId` | chat.js | Create message to recipient | `recipientId`, `content` | `verify_token` | Yes (with token) | Yes (with session) | Contains code bugs (`chat_users`, `result` undefined) |
| PATCH | `/api/messages/` | chat.js | Update message | Intended: message id/new content | `verify_token` | Yes (with token) | Yes (with session) | SQL is broken (`UPDATE *`, bad params); likely nonfunctional |
| DELETE | `/api/messages/` | chat.js | Delete message by id | `body.id` | `verify_token` | Yes (with token) | Yes (with session) | No ownership check visible in handler |
| GET | `/api/posts/comments` | posts.js | Read comments by parent post id | `body.parent`, optional `body.amount` | `verify_token` | Yes (with token) | Yes (with session) | GET uses body (unusual/fragile) |
| POST | `/api/posts/comments` | posts.js | Create comment post | Intended comment fields | `verify_token` | Yes (with token) | Yes (with session) | Likely broken (`author_username`, `media` undefined) |
| GET | `/api/posts` | posts.js | Read posts (own/user) or mentions | query: `user,amount,filter` | `verify_token` | Yes (with token) | Yes (with session) | Mention filtering joins friend_requests |
| POST | `/api/posts` | posts.js | Create post | `content`, optional `image,parent` | `verify_token` | Yes (with token) | Yes (with session) | Returns `new_post.rows` array (not single object) |
| DELETE | `/api/posts` | posts.js | Delete own post | `body.id` | `verify_token` | Yes (with token) | Yes (with session) | Checks author ownership (`author_id = req.user.id`) |
