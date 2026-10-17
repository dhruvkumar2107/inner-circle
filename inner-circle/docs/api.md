# API notes

The client prototype does **not** call this API. It is documented so the intended production flow
is clear and so the optional adapters (`docs/integration.md`) can be pointed at it.

Base URL: `/api`. The Vite dev server proxies `/api` to `http://localhost:4000`. On Vercel,
`vercel.json` routes `/api/*` to `api/index.ts`, which mounts the same Express app.

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | Runtime and persistence mode |
| POST | `/auth/register` | No | Create a student account, assign alias, issue access and refresh tokens |
| POST | `/auth/login` | No | Sign in; generic errors and lockout after five failed attempts |
| POST | `/auth/refresh` | Refresh cookie | Rotate access and refresh tokens |
| POST | `/auth/logout` | No | Clear refresh cookie |
| GET | `/auth/me` | Access token | Return current account profile |
| POST | `/chat` | Access token | Supportive chat reply; returns `reply` plus `sentiment`, `emotion`, `topics`, `crisis`, `riskScore`, `tier` |
| POST | `/risk/infer` | Access token | Validate five fuzzy inputs; optional `item9Flag` and `crisisDetected` force the safety override |
| GET | `/forum/posts` | Public | Forum posts through an anonymous public projection |

Registration accepts `firstName`, `lastName`, `email`, `password`, and optional `studentId`,
`college`, `department`, `year`. Passwords must be at least eight characters and include a letter
and a number. The API assigns the role `student`; callers cannot select a privileged role. Chat is
rate-limited (30 requests/minute) and persists sessions.

## Server–client shape differences (important)

The client's optional remote adapter sends `{ message, history, lang }`. The server's `/chat`
expects `{ message, language?, sessionId? }` and requires a Bearer access token, so the client
adapter does **not** work against the server as-is — either adjust the adapter or add a thin
server route. This is spelled out, with the exact contracts, in `docs/integration.md`.

## Not implemented

Appointments, persisted chat history endpoints, journal sync, professional review workflows and
admin analytics are planned work. The client keeps its own demo versions of some of these locally.
