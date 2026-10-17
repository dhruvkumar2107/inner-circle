# Architecture

## Shape of this repository

```text
inner-circle/
  client/   React + Vite single-page app — the clickable prototype and its demo data
  server/   Express + TypeScript API — kept as the integration reference, not needed for the demo
  api/      Vercel serverless entry that wraps the same Express app for deployment
  docs/     This documentation
```

The **prototype the demo uses is the client only**. It runs entirely in the browser with no
network calls of its own and stores everything in `localStorage`. The server exists so that the
project's intended production flow (accounts, persistence, server-side safety handling) is
represented and can be wired in later. See `docs/integration.md` for how to connect the two.

## Client layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Internationalisation | `client/src/i18n` | Dependency-free EN / HI / KN dictionaries, `useT()`, auto-discovered namespaces |
| Shell & navigation | `client/src/components/Shell.jsx`, `ui.jsx` | Sidebar, topbar, urgent-support modal, shared UI primitives |
| Screens | `client/src/pages` | The 10 destinations, the register/consent flow, the screening flow |
| State | `client/src/context/AppContext.jsx` | All demo state, persisted to `localStorage` |
| Domain logic | `client/src/lib` | Screening, sentiment, fuzzy inference, chat engine, voice, reminders, storage, remote adapters |

### The ten destinations

`Home` · `AI Companion` · `My Mood Journey` · `Mental Health Check-in` · `Play & Relax`
· `Breathe & Reset` · `Puzzles` (incl. playable chess) · `Contact a Professional`
· `How Inner Circle Works` (explainability) · `Settings & Privacy`
plus the public-feeling `Register` entry screen.

## Ordinary flow vs. the safety pathway

These are deliberately separate code paths.

1. Text typed into the companion is analysed locally (lexicon sentiment, emotion and topic cues).
2. A **deterministic crisis check** runs first and never depends on any score. If it fires, the
   urgent-support modal opens immediately and no fuzzy inference, chat reply, or network call is
   reached.
3. Screening results compute a fuzzy inference score only after a safety-sensitive answer has been
   handled: PHQ-9 item 9 opens the pathway without waiting for a total.
4. The explainability page (`/how`) shows the fuzzy inputs, fireable rules, memberships and
   suggestions so a student can see how a recommendation was reached.

## Risk-support flow (as implemented in the client)

1. The student completes a consent step and answers PHQ-9 / GAD-7.
2. `lib/fuzzy.js` fuzzifies the screening score, sentiment, stress and functional impact; evaluates
   the inspectable 14-rule base; aggregates and defuzzifies to a 0–100 score and a support tier.
3. A separate safety override forces the highest tier and surfaces resources when item 9 or crisis
   language is present, without altering the fuzzy score.
4. Tiers map to self-guided, peer or professional suggestions. Nothing is auto-booked and the app
   never diagnoses.

## Data: where it lives

All demo state is in `localStorage` under these keys, and nowhere else:

`ic.profile` · `ic.consents` · `ic.settings` · `ic.moods` · `ic.entries` · `ic.wins`
· `ic.assessments` · `ic.messages` · `ic.appts` · `ic.lang` · `ic.reminder.lastFired`

Clearing site data, or **Settings → delete my data**, removes all of it. Nothing is transmitted.

## Optional server integration (off by default)

Two environment variables can point the client at real services; with neither set, behaviour is
unchanged:

| Variable | Effect |
| --- | --- |
| `VITE_CHAT_ENDPOINT` | Companion replies come from a remote model instead of the local scripted engine |
| `VITE_SENTIMENT_ENDPOINT` | The analysis strip can use a remote sentiment service |

Remote chat is never used for crisis text. Full contract, consent and privacy obligations are in
`docs/integration.md`.

## Deployment

`inner-circle/vercel.json` builds the client (`client/dist`) and exposes the API through
`api/index.ts` (`/api/*`). `npm run build` at the `inner-circle` root builds both the client and the
server. The static prototype needs no environment variables; the serverless API needs its own
(for example `MONGO_URI`).

## Research positioning

Validated psychological screening (PHQ-9 / GAD-7) + transparent **fuzzy risk inference** +
NLP-style conversational analysis + risk-adaptive suggestions + optional continuous check-ins +
human-in-the-loop professional support, with a trilingual interface.

This describes the intended research design, not clinical validation of this prototype.
