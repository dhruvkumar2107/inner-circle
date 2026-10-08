# API notes

Base URL: `/api`. The Vite development server proxies `/api` to `http://localhost:4000`.

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | Runtime and persistence mode |
| POST | `/auth/register` | No | Create a student account, assign alias, issue access and refresh tokens |
| POST | `/auth/login` | No | Sign in; generic errors and lockout after five failed attempts |
| POST | `/auth/refresh` | Refresh cookie | Rotate access and refresh tokens |
| POST | `/auth/logout` | No | Clear refresh cookie |
| GET | `/auth/me` | Access token | Return current account profile |
| POST | `/risk/infer` | Access token | Validate five fuzzy inputs; optional `item9Flag` and `crisisDetected` force safety override |
| GET | `/forum/posts` | No | Return forum posts with anonymous public projection |

Registration accepts `firstName`, `lastName`, `email`, `password`, and optional `studentId`, `college`, `department`, and `year`. Passwords must be at least eight characters and include a letter and a number. The API assigns the role as `student`; callers cannot select a privileged role.

All other routes named in the build prompt—appointments, persisted chat, journal, professional review, and admin analytics—are planned work and are not represented as available APIs yet.
