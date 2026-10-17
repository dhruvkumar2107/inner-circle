# Security and privacy

## What this prototype does with data

**The client prototype transmits nothing.** Every piece of demo state is written to this browser's
`localStorage` and is never sent anywhere by the app's own code. The keys are:

`ic.profile` · `ic.consents` · `ic.settings` · `ic.moods` · `ic.entries` · `ic.wins`
· `ic.assessments` · `ic.messages` · `ic.appts` · `ic.lang` · `ic.reminder.lastFired`

Clearing site data, or **Settings & Privacy → delete my data**, removes all of it. The password is
kept only as a non-reversible demo hash, never in plain text. Everything here is demo data and must
not be real student information.

## Data leaves the device only in two, clearly-bounded ways

| Situation | What leaves the device | Default |
| --- | --- | --- |
| Fonts | Nothing — the app self-hosts its fonts in `client/public/fonts` (no request to Google or any third party) | Off (no outbound request) |
| Optional remote companion (`VITE_CHAT_ENDPOINT`) | The typed message, sent to the configured endpoint | Off — nothing is sent unless configured |
| Optional remote sentiment (`VITE_SENTIMENT_ENDPOINT`) | The analysed text | Off |

With no environment variables set — the shipped default — the app makes **no
network requests at all** after the page loads. The fonts are served from the same
origin via `scripts/fetch-fonts.mjs`.

Turning a remote endpoint on is a deliberate configuration act and is a consent issue, not just a
technical one: it means a student's words leave the browser. Crisis text is never sent to any remote
endpoint — the crisis check runs locally first and short-circuits the network path entirely (see
`docs/integration.md`).

Opting into reminders requests the browser Notification permission. Notifications are generated
locally, contain no personal content beyond a generic check-in nudge, and only fire while the app is
open in the browser.

## The server (integration reference, not used by the demo)

The Express API stores a name, email, password hash (bcrypt cost 12), optional student ID, optional
college information, role and anonymous alias. Authenticated endpoints use short-lived signed access
tokens with an HTTP-only refresh cookie. MongoDB persistence is optional in development; otherwise
accounts use an in-memory demo store. Its conversation endpoint returns a supportive reply plus
sentiment, emotion, topic, a fuzzy risk tier, and a crisis flag.

If and when the client is wired to the server, the note below applies to that flow.

## Threat model

| Threat | Current mitigation | Remaining work |
| --- | --- | --- |
| Password disclosure | bcrypt cost 12; password never returned by APIs | Password reset / email verification; production secret rotation |
| Guessing or credential stuffing | Auth rate limit; generic login errors; five-failure lockout | Persistent distributed rate-limit and lockout storage |
| Token theft | Short-lived access token; HTTP-only, SameSite refresh cookie; Helmet | CSRF review; rotation/revocation store; HTTPS deployment |
| Cross-origin requests | Configured CORS allow-list | Verify deployed origins and proxy configuration |
| Invalid input | Zod validation; JSON body-size limit | Broader endpoint schemas as modules are implemented |
| Unwanted disclosure to a remote model | Remote adapters are off by default; crisis text is never sent | Written consent copy and a UI toggle before enabling remote models |
| Third-party font request leaking visitor IP | Fonts are self-hosted in `client/public/fonts`; no external font request is made | Keep the self-hosted fonts in sync via `scripts/fetch-fonts.mjs` |
| Misuse of screening outputs | Non-diagnostic copy; validated instrument wording; deterministic crisis override | Independent clinical, safety and accessibility review |
| Data loss or excess retention | Everything is local and deletable; the demo warns that storage is volatile | Retention schedule, encryption at rest, audited export/deletion |

## Confidentiality limits

The service must not promise absolute confidentiality. Where a credible safety concern is identified,
a designated professional may need to be notified, and access should be minimal, assigned and
audit-logged. Those production safety and audit workflows are **not** implemented here.

## Before launch

Do not use real student data until: field-level encryption for journal and chat text; audited,
role-based professional access; k-anonymity suppression for any analytics; account export and
deletion; retention controls; security testing; HTTPS; institution-approved
crisis escalation are implemented and independently reviewed. Every helpline
number, the campus counselling contact and the Department of Psychiatry details
displayed in the app are placeholders and must be verified.
