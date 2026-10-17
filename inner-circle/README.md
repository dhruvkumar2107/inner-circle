# Inner Circle

**Your Mind Matters. Always.** — *a quiet space for students*

Inner Circle is a student mental-wellbeing **prototype**: a clickable web app that brings together a daily
mood check-in, a supportive AI companion, validated screening (PHQ-9 / GAD-7), an explainable fuzzy
support engine, relaxing activities, and a route to real professional help (Department of Psychiatry,
Dayananda Sagar University).

It screens, supports and signposts. It **never diagnoses or prescribes**, and it is **not an emergency service**.

---

## Quick start

Requires Node.js 20.19 or newer. From this folder:

```sh
npm install
npm run dev
```

- Web app: <http://localhost:5173>
- (Optional) old reference API: <http://localhost:4000>

The client runs entirely on its own — **no server, database or API key is needed**. To run only the app:

```sh
npm run dev --workspace client
```

### Getting in

There are no demo credentials. On the register screen either create a profile (an **18+ gate** is
enforced) or press **Fill with demo details** and continue. Everything is then stored in this browser.

---

## What is in this build

Eleven clickable screens, all reachable from the sidebar:

| Route | Page | What it does |
| --- | --- | --- |
| `/home` | Home | Greeting, 7-mood check-in, "what would help right now?" choices, gentle suggestion, entry points |
| `/companion` | AI Companion | Supportive chat with quick prompts, follow-ups, **voice input**, optional read-aloud, live sentiment strip |
| `/mood` | My Mood Journey | Weekly mood calendar, trend shape, mood history, reflections, tiny wins |
| `/assessments` | Mental Health Check-in | PHQ-9 and GAD-7 landing, past results, standard severity bands |
| `/assessments/:type` | Assessment runner | Intro → questions → daily-life question, progress, immediate safety pathway |
| `/assessments/:type/result` | Screening result | Score, band, meaning, next steps, safety-first layout when item 9 is flagged |
| `/play` | Play & Relax | Endless runner, match-3, memory, focus game, colouring canvas, calm jar, mindfulness, positive moments |
| `/breathe` | Breathe & Reset | One-minute reset, box breathing, 5-4-3-2-1 grounding, muscle relaxation, mindfulness, relaxation timer |
| `/puzzles` | Puzzles | Block puzzle, sudoku, word search, jigsaw, riddles, memory (+ chess marked *planned*) |
| `/professional` | Contact a Professional | Department of Psychiatry placeholders, demo appointment request, urgent support |
| `/how` | How Inner Circle Works | The full pipeline: sentiment demo, interactive fuzzy engine, memberships, fired rules, suggestions |
| `/settings` | Settings & Privacy | Profile, consents, preferences, data export, delete all data, sign out |

---

## Safety and ethics by design

- **Screening, never diagnosis.** Results are labelled as screening results and use the standard
  published PHQ-9 / GAD-7 bands and wording. Out-of-range copy avoids clinical labels.
- **Age 18+ gate** at registration.
- **PHQ-9 item 9 is a hard trigger.** Any answer other than "Not at all" opens urgent support
  immediately — it never waits for a score or the fuzzy engine.
- **Crisis language bypasses everything.** Crisis phrases in chat open the safety pathway at once and
  are never scored.
- **Nothing is forced.** No streaks, no penalties, no scheduled assessments; every activity is optional.
- **Honest labels.** The companion's replies and the sentiment analysis are clearly marked as
  simulated, and the fuzzy parameters are marked as illustrative — not clinically calibrated.
- **No invented institutional details.** Doctor profiles, timings and contact details are explicit
  placeholders to be filled by the university. Crisis numbers in the safety modal are India resources
  and must all be verified before launch.

---

## Data and privacy

Everything lives in this browser's `localStorage` (keys prefixed `ic.`):

`ic.profile` · `ic.consents` · `ic.settings` · `ic.moods` · `ic.entries` · `ic.wins` · `ic.assessments` ·
`ic.messages` · `ic.appts`

No data is uploaded anywhere. Settings & Privacy can export a JSON copy (the demo password hash is
excluded) and delete everything.

---

## Where the logic lives

```
client/src/
  lib/
    moods.js        daily moods, mood-based suggestions, "what would help" choices
    screening.js    PHQ-9 / GAD-7 items, response scales, bands, safety index
    fuzzy.js        Mamdani FIS: membership functions, 14 rules, centroid, explainability
    sentiment.js    lexicon sentiment, emotion/topic signals, crisis detection
    chatEngine.js   scripted companion intents, fallbacks, crisis reply
    voice.js        Web Speech API helpers (speech-to-text and text-to-speech)
    storage.js      localStorage load/save + date helpers
  context/AppContext.jsx   all state, persistence, safety modal, toasts
  components/  ui.jsx (shared UI + crisis resources), Shell.jsx (nav + layout)
  styles/      theme.css (the whole design system)
  pages/       one file per screen, plus pages/play, pages/puzzles, pages/breathe
```

### Swapping in real services later

- **AI companion** — replace `generateReply` in `lib/chatEngine.js` with a `POST /api/chat` call,
  keeping the `{ text, prompts, suggestion, crisis, intent }` return shape. The Express API under
  `server/` is left untouched as a reference for that integration.
- **Sentiment** — swap `analyze` in `lib/sentiment.js` for a model endpoint; the UI already labels it
  as simulated.
- **Fuzzy engine** — `lib/fuzzy.js` mirrors the server implementation. The membership functions and
  rules are illustrative research defaults and **must be clinically reviewed** before any real use.
- **Institutional details** — replace the placeholder doctor profiles and add verified contact
  details; verify every crisis number.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the client (and the legacy API) |
| `npm run dev --workspace client` | Start only the web app |
| `npm run build --workspace client` | Production build of the app |

---

## Limitations

This is a coursework/demo prototype, not a product. It is not clinically validated, is not suitable
for emergency use, and must not be given real student data. Accessibility review, security review,
clinical calibration, and institutional approval are all required before any real deployment.
