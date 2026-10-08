# Security and privacy

## Data flow and access

Registration stores a name, email, password hash, optional student ID, optional college information, role, and anonymous alias. Passwords are hashed with bcrypt cost 12. Authenticated endpoints use short-lived signed access tokens and an HTTP-only refresh cookie. MongoDB persistence is optional in local development; otherwise accounts use an in-memory demo store. Screening summaries in the current client are stored in browser local storage and are demo-only.

Forum responses are built from a strict public projection containing only post ID, author alias, post body, room, and creation time. Real name, email, student ID, and internal author ID are excluded. Professional and admin record-access workflows are not yet implemented; no student records should be used for those demo views.

## Threat model

| Threat | Current mitigation | Remaining work |
| --- | --- | --- |
| Password disclosure | bcrypt cost 12; password is not returned by APIs | Password reset/email verification and production secret rotation |
| Guessing or credential stuffing | Auth-specific rate limit; generic login errors; 5-failure lockout | Persistent distributed rate-limit and lockout storage |
| Token theft | Short-lived access token; HTTP-only, SameSite refresh cookie; Helmet | CSRF review, rotation/revocation store, HTTPS deployment |
| Cross-origin requests | Configured CORS allow-list | Verify deployed origins and proxy configuration |
| Invalid input | Zod validation and JSON body-size limit | Broader endpoint schemas as modules are implemented |
| PII exposure to peers | Alias generator and forum allow-list projection with privacy test | End-to-end API privacy tests for all future chat/analytics surfaces |
| Misuse of screening outputs | Non-diagnostic copy and deterministic crisis override | Independent clinical, safety, and accessibility review |
| Data loss or excess retention | Demo warns about volatile/local browser storage | Retention schedule, user export/deletion, encryption at rest |

## Confidentiality limits

The service should not promise absolute confidentiality. When a credible safety concern is identified, a designated professional may need to be notified and access should be minimal, assigned, and audit-logged. The production safety and audit workflows are not implemented in this demo.

## Before launch

Do not use real student data until field-level encryption for journal/chat text, audited role-based professional access, k-anonymity suppression, account export/deletion, retention controls, security testing, HTTPS, and institution-approved crisis escalation are implemented and independently reviewed.
