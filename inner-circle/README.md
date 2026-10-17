# Inner Circle

**Your Mind Matters. Always.** — *a quiet space for students*

Inner Circle is a student mental-wellbeing **prototype**: a clickable web app that brings together a
daily mood check-in, a supportive AI companion, validated screening (PHQ-9 / GAD-7), an explainable
fuzzy support engine, relaxing activities, and a route to real professional help (Department of
Psychiatry, Dayananda Sagar University).

It screens, supports and signposts. It **never diagnoses or prescribes**, and it is **not an
emergency service**. The interface is available in **English, हिन्दी and ಕನ್ನಡ**.

---

## Quick start

Requires Node.js 20.19 or newer. From this folder:

```sh
npm install
npm run dev
```

- Web app: <http://localhost:5173>
- (Optional) reference API: <http://localhost:4000>

The client runs entirely on its own — **no server, database or API key is needed**. To run only the app:

```sh
npm run dev --workspace client
```

### Getting in

There are no demo credentials. On the register screen either create a profile (an **18+ gate** is
enforced) or press **Fill with demo details** and continue. Everything is then stored in this browser.

---

## What is in this build

Ten destinations (all reachable from the sidebar) plus the entry/consent screen:

| Route | Page | What it does |
| --- | --- | --- |
| `/register` | Register / consent | 18+ gate, consent items, language picker, sign in |
| `/home` | Home | Greeting, 7-mood check-in, "what would help right now?" choices, gentle suggestion |
| `/companion` | AI Companion | Supportive chat with quick prompts, follow-ups, **voice input**, optional read-aloud, live sentiment strip |
| `/mood` | My Mood Journey | Weekly mood calendar, trend shape, mood history, reflections, tiny wins |
| `/assessments` | Mental Health Check-in | PHQ-9 and GAD-7 landing, past results, standard severity bands |
| `/assessments/:type` | Assessment runner | Intro → questions → daily-life question, progress, immediate safety pathway |
| `/assessments/:type/result` | Screening result | Score, band, meaning, next steps, safety-first layout when item 9 is flagged |
| `/play` | Play & Relax | Endless runner, match-3, memory, focus game, colouring canvas, calm jar, mindfulness, positive moments |
| `/breathe` | Breathe & Reset | One-minute reset, box breathing, 5-4-3-2-1 grounding, muscle relaxation, mindfulness, relaxation timer |
| `/puzzles` | Puzzles | Block puzzle, sudoku, word search, jigsaw, riddles, memory, and a **playable chess game** |
| `/professional` | Contact a Professional | Department placeholders, demo appointment request, urgent support |
| `/how` | How Inner Circle Works | The full pipeline: sentiment demo, interactive fuzzy engine, memberships, fired rules, suggestions |
| `/settings` | Settings & Privacy | Language, reminders, profile, preferences, data export, delete all data, sign out |

---

## Safety and ethics by design

- **Screening, never diagnosis.** Results are labelled as screening results and use the standard
  published PHQ-9 / GAD-7 bands and wording. Out-of-range copy avoids clinical labels.
- **Age 18+ gate** at registration, with consent items recorded.
- **PHQ-9 item 9 is a hard trigger.** Any answer other than "Not at all" opens urgent support
  immediately — it never waits for a score or the fuzzy engine.
- **Crisis language bypasses everything.** Crisis phrases (English, romanised, Devanagari and Kannada)
  open the safety pathway at once and are never scored — and are never sent to a remote service.
- **Nothing is forced.** No streaks, no penalties, no scheduled assessments; every activity, including
  reminders, is optional and off by default.
- **Honest labels.** The companion's replies and the sentiment analysis are clearly marked as
  simulated, and the fuzzy parameters are marked as illustrative — not clinically calibrated.
- **No invented institutional details.** Doctor profiles, timings and contact details are explicit
  placeholders to be filled by the university. Crisis numbers in the safety modal are India resources
  and must all be verified before launch.

---

## Languages

English, Hindi and Kannada are supported throughout, including sentiment cues, crisis detection and
speech. Two things deliberately stay in English and are disclosed on screen: the **PHQ-9/GAD-7
instrument wording** (a validated instrument must not be informally translated) and the **fuzzy rule
trace** on the explainability page. See [`docs/i18n.md`](docs/i18n.md).

---

## Data and privacy

Everything lives in this browser's `localStorage` (keys prefixed `ic.`):

`ic.profile` · `ic.consents` · `ic.settings` · `ic.moods` · `ic.entries` · `ic.wins` ·
`ic.assessments` · `ic.messages` · `ic.appts` · `ic.lang` · `ic.reminder.lastFired`

No data is uploaded anywhere. Settings & Privacy can export a JSON copy (the demo password hash is
excluded) and delete everything. The app makes **no network requests** after load: its fonts are
self-hosted in `client/public/fonts` (regenerate with `node scripts/fetch-fonts.mjs`), and the only
outbound requests would be the optional remote endpoints below, which are off unless you configure them.

---

## Where the logic lives

```
client/src/
  i18n/           dependency-free EN/HI/KN layer + locales/<lang>/<namespace>.json
  lib/
    moods.js        daily moods, mood-based suggestions, "what would help" choices
    screening.js    PHQ-9 / GAD-7 items, response scales, bands, safety index
    fuzzy.js        Mamdani FIS: membership functions, 14 rules, centroid, explainability
    sentiment.js    Unicode-aware lexicon sentiment, emotion/topic signals, crisis detection
    chatEngine.js   scripted companion intents, fallbacks, crisis reply
    voice.js        Web Speech API helpers (speech-to-text and text-to-speech)
    reminders.js    optional daily check-in reminder helpers (Notification API)
    remote.js       optional remote chat/sentiment adapters (off unless configured)
    institution.js  university/department placeholders to be filled in
    storage.js      localStorage load/save + date helpers
  context/AppContext.jsx   all state, persistence, safety modal, toasts, reminders
  components/  ui.jsx (shared UI + crisis resources), Shell.jsx (nav), LanguagePicker.jsx
  styles/      theme.css (the whole design system)
  pages/       one file per screen, plus pages/play, pages/puzzles (incl. chess/), pages/breathe
```

### Swapping in real services later

- **AI companion** — set `VITE_CHAT_ENDPOINT` to route replies to a real model; the local engine stays
  as the fallback and crisis text is never transmitted. See [`docs/integration.md`](docs/integration.md).
- **Sentiment** — set `VITE_SENTIMENT_ENDPOINT`, or swap `analyze` in `lib/sentiment.js`.
- **Fuzzy engine** — `lib/fuzzy.js` mirrors the server implementation. The membership functions and
  rules are illustrative research defaults and **must be clinically reviewed** before any real use.
- **Institutional details** — fill in `lib/institution.js` and verify every crisis number.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the client (and the reference API) |
| `npm run dev --workspace client` | Start only the web app |
| `npm run build` | Production build of the client **and** the server |
| `npm run build --workspace client` | Production build of the app only |
| `npm test` | Unit tests for the server (Jest) **and** the client (Node's built-in runner) |
| `npm run typecheck` | Type-check the server |
| `node scripts/fetch-fonts.mjs` | Re-download the self-hosted fonts |

### Tests

The client suite (62 checks across 10 files) runs on Node's built-in test runner with **no extra
dependencies** and covers the pure logic: the fuzzy engine (bands, safety override, membership
bounds, 14 rules), the PHQ-9/GAD-7 bands and item-9 index, multilingual crisis detection (English,
romanised, Devanagari, Kannada) and sentiment, the chess rules (castling, en passant, promotion,
checkmate/stalemate/insufficient material, legal-move invariants), the companion engine (crisis
short-circuit, translation-key coverage), and i18n key parity across all three languages.

---

## Docs

- [`docs/architecture.md`](docs/architecture.md) — how it fits together
- [`docs/i18n.md`](docs/i18n.md) — the translation layer and its ethics notes
- [`docs/fuzzy-spec.md`](docs/fuzzy-spec.md) — the fuzzy inference specification
- [`docs/privacy.md`](docs/privacy.md) — data flow, threat model, before-launch list
- [`docs/integration.md`](docs/integration.md) — optional remote endpoints
- [`docs/api.md`](docs/api.md) — the reference API
- [`docs/demo-script.md`](docs/demo-script.md) — the five-minute walkthrough
- [`docs/manual-qa.md`](docs/manual-qa.md) — what still needs a human to check

---

## Limitations

This is a coursework/demo prototype, not a product. It is not clinically validated, is not suitable
for emergency use, and must not be given real student data. Accessibility review, security review,
clinical calibration, translation review, and institutional approval are all required before any real
deployment. The translation is fluent but has not been certified, and the browser click-through in
[`docs/manual-qa.md`](docs/manual-qa.md) has not been machine-verified.
