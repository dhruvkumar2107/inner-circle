# Connecting the AI Companion to a real model (optional)

The AI Companion in Inner Circle is **fully local by default**: replies come from
the scripted engine in `src/lib/chatEngine.js` and analysis from the lexicon
analyzer in `src/lib/sentiment.js`. Nothing leaves the browser.

This guide describes the **optional, opt-in** seam that lets you point the
companion at a remote model and/or a remote sentiment service. It is an
integration seam, not a product feature. With no environment variables set, the
app behaves exactly as it always has.

The seam lives in one file: `src/lib/remote.js`. The only UI wiring is in
`src/pages/Companion.jsx`.

---

## Environment variables

Both are read from Vite's `import.meta.env` and are **empty/off by default**.

| Variable                 | Purpose                         | Default    | Example                          |
| ------------------------ | ------------------------------- | ---------- | -------------------------------- |
| `VITE_CHAT_ENDPOINT`     | Remote chat completion endpoint | disabled   | `https://example.com/api/chat`   |
| `VITE_SENTIMENT_ENDPOINT`| Remote sentiment endpoint       | disabled   | `https://example.com/api/sentiment` |

Put them in `.env` / `.env.local` at `client/` and restart the dev server (Vite
inlines `VITE_`-prefixed values at build time). Only `VITE_`-prefixed variables
are exposed to client code — never put secrets in them. A remote model that
needs an API key must be called through your own backend, which holds the key.

If neither variable is set:

- `hasRemoteChat()` and `hasRemoteSentiment()` both return `false`;
- `Companion.jsx` takes the same local `generateReply` path as before (with the
  same 750 ms typing delay);
- the header badge reads the existing `companion.simulatedAi`;
- `analyzeRemote(text)` simply returns `analyze(text)`.

---

## What the client sends and accepts

### Chat — `requestChat({ text, history, lang })`

**Request** — `POST` with `Content-Type: application/json`:

```json
{
  "message": "the student's latest message",
  "history": [{ "role": "user", "text": "..." }, { "role": "ai", "text": "..." }],
  "lang": "en"
}
```

**Response** — any of these shapes is accepted and normalised to a plain string:

```json
{ "reply": "..." }
{ "text": "..." }
{ "message": "..." }
{ "content": "..." }
{ "choices": [{ "message": { "content": "..." } }] }
```

Any non-2xx status, an abort/timeout (default 15 s), or a body that contains no
usable text throws a descriptive `Error`. The companion then falls back to the
local scripted reply and shows a warn toast (`companion.remoteFailed`).

### Sentiment — `requestSentiment({ text })`

**Request** — `POST` with `Content-Type: application/json`:

```json
{ "text": "the student's message" }
```

**Response** — expected fields:

```json
{
  "score": -0.4,
  "label": "Negative",
  "confidence": 0.7,
  "emotion": { "primary": "anxiety", "secondary": [], "intensity": 0.6 },
  "topics": { "primary": "Academic pressure", "secondary": [], "confidence": 0.6 },
  "crisis": { "isCrisis": false, "phrase": null, "severity": "none" }
}
```

Any missing field is filled from the local `analyze()` bundle, so the caller
always receives a complete result. A non-2xx status, abort/timeout (default 8 s)
or an unparseable body throws.

`analyzeRemote(text)` wraps this: it tries `requestSentiment` when an endpoint is
configured and falls back to `analyze(text)` on any error; otherwise it returns
`analyze(text)` directly. It returns the same nested shape as `analyze()` and
never throws.

### Exported API of `src/lib/remote.js`

- `chatEndpoint(): string`
- `sentimentEndpoint(): string`
- `hasRemoteChat(): boolean`
- `hasRemoteSentiment(): boolean`
- `requestChat({ text, history, lang, signal, timeoutMs = 15000 }): Promise<string>`
- `requestSentiment({ text, signal, timeoutMs = 8000 }): Promise<{ score, label, confidence, emotion, topics, crisis }>`
- `analyzeRemote(text): Promise<{ sentiment, emotion, topics, crisis }>`

---

## Pointing it at the existing Express server

The repository already contains an Express API at `inner-circle/server`
(mounted under `/api`, see `server/src/app.ts`). Here is the honest state of
things if you try to reuse it without changes.

**What exists**

- `POST /api/chat` — the supportive chat pipeline (`server/src/routes/chat.routes.ts`).
  It requires `requireAuth` (a `Bearer` access JWT), accepts
  `{ message, language?, sessionId? }`, is rate-limited to 30 requests/minute,
  and **persists each conversation** per user. Its JSON response includes a
  top-level `reply` string, plus `message`, `suggestions`, `provider`,
  `sentiment`, `emotion`, `topics`, `crisis`, `riskScore` and `tier`.
- `POST /api/risk/infer`, `GET /api/risk/latest`, `GET /api/risk/trend`,
  `GET /api/risk/explain/:id` — fuzzy risk inference. These take assessment
  numbers (PHQ-9, GAD-7, stress, …), **not free text**.
- `POST /api/safety/help-now`, `GET /api/safety/resources` — the crisis pathway.

**Where the shapes differ (so an adapter or server change is required)**

1. **Auth.** `/api/chat` is behind `requireAuth` and expects an
   `Authorization: Bearer <token>` header. `remote.js` sends no credentials, so a
   direct call returns `401`. You need an auth-aware adapter/proxy in front of it,
   or a small server change that allows an appropriately scoped anonymous route.
2. **Field names.** The client sends `{ message, history, lang }`; the server
   schema reads `{ message, language, sessionId }`. `language` defaults to `'en'`
   and `history` is ignored (the server replays its own persisted history). So a
   direct call works for the text field, but `lang` is not honoured and the
   client-supplied `history` is unused. Either add a thin adapter that maps
   `lang → language`, or extend the server schema to accept `lang`.
3. **Reply shape.** This one already matches: the server returns `{ reply: "..." }`,
   which the client's normaliser accepts. No change needed for the text.
4. **Sentiment.** There is **no standalone sentiment endpoint** on the server.
   The closest signals are the `sentiment` / `emotion` / `topics` / `crisis`
   fields returned inside the `/api/chat` response. To use
   `VITE_SENTIMENT_ENDPOINT` with this server you must add a text-in route (for
   example `POST /api/sentiment` returning the contract above), or point it at an
   external service. Until then, leave `VITE_SENTIMENT_ENDPOINT` unset and the
   local analyzer is used.
5. **CORS.** `server/src/app.ts` allows `http://localhost:5173`, `:5174`, `:3000`
   by default (plus the deployment's own origin). The Vite dev client at `:5173`
   is already allowed; any other origin must be added via `CORS_ORIGIN`.

**Net:** to use the existing server as-is, put a thin adapter (a serverless
function, a dev proxy, or a small Express route) between the client and
`/api/chat` that injects auth, maps `lang → language`, and returns
`{ reply }`. Do not assume the client can call `/api/chat` directly today.

---

## Privacy, consent and safety

Turning remote replies on sends the student's typed text off their device. This
is only acceptable with **explicit, informed consent** and must never be a silent
default.

- **Consent is required.** Enabling a remote endpoint means the student's
  messages (and recent history) are transmitted to that endpoint and processed
  there. Surface this clearly in your own consent flow before enabling the
  variables; do not ship a build with a remote endpoint configured and no
  consent step.
- **Crisis text is never transmitted.** Before anything else, the companion runs
  its deterministic local crisis check (`analyze(seed).crisis`). If crisis
  language is present it opens the safety pathway and performs **no** network
  call at all. Neither the chat endpoint nor the sentiment endpoint ever sees
  crisis text.
- **Nothing new is stored by the client.** The app keeps its state in
  `localStorage` only (see `src/context/AppContext.jsx`). `remote.js` stores
  nothing; it only sends the request body. What the remote endpoint does with the
  text — logging, retention, training — is entirely the endpoint owner's
  responsibility and should be documented in your privacy notice.
- **Your backend holds the secrets.** If the remote model needs an API key, keep
  it server-side. Never put a key in a `VITE_` variable.
- **Always keep the local fallback.** If the endpoint is unreachable, slow or
  returns an unrecognised shape, the companion falls back to the local scripted
  reply rather than failing silently.

---

## Verify before launch

- Start with **no** env vars set and confirm the UI is unchanged: the badge reads
  "Simulated AI", replies come from the scripted engine, and there is no network
  traffic to any chat/sentiment host.
- Set `VITE_CHAT_ENDPOINT` to a test endpoint and confirm: a normal message
  produces a "Live AI" badge and plain-text reply; stopping the endpoint produces
  the `companion.remoteFailed` toast and a local fallback reply.
- Type a crisis phrase (e.g. "I want to die") and confirm in the browser Network
  tab that **no** request is made and the safety pathway opens.
- Confirm your endpoint is reachable under the deployed CORS policy and that any
  API key stays server-side.
- Confirm the privacy notice and consent screen describe exactly what is sent and
  where. Do not invent hostnames — replace the `https://example.com/...`
  placeholders with your real, reviewed endpoints.
