# Manual QA checklist

The build is verified automatically (`npx vite build`, plus the i18n parity check). The items below
need a human clicking through a browser and have **not** been machine-verified. Run through this
list before any demo or submission.

## First run
- [ ] `npm run dev` at `inner-circle` opens the app; with no profile it lands on `/register`.
- [ ] Register with the 18+ confirmation, all consents, a demo email and a password → lands on Home.
- [ ] Refreshing the page keeps you signed in (state is in `localStorage`).

## Language (do this once per language: English, हिन्दी, ಕನ್ನಡ)
- [ ] Switch language from the topbar picker and from Settings → Language; the whole app updates.
- [ ] After a switch, reload — the choice persists.
- [ ] No screen shows a raw key (e.g. `home.title`); no layout breakage from longer text.
- [ ] The safety modal, helpline names and numbers are correct and readable in each language.
- [ ] PHQ-9/GAD-7 show the English instrument wording plus the on-screen disclosure note.

## Safety pathway (most important)
- [ ] Type crisis language into the companion (try English, Devanagari and Kannada) → the safety
      modal opens immediately; no chat reply is generated.
- [ ] Deliberately answer PHQ-9 item 9 with anything other than "Not at all" → the safety
      interstitial appears before a result is shown.
- [ ] "I need help now" in the topbar opens the modal from every screen.
- [ ] "Department contact" goes to `/professional`.

## Screening
- [ ] Complete both PHQ-9 and GAD-7; the difficulty item appears; the score and band are plausible.
- [ ] The result shows the "screening result, not a diagnosis" disclaimer.
- [ ] History in My Mood Journey lists the attempts; deleting one works.

## Companion
- [ ] Several message types return sensible, non-clinical replies.
- [ ] Read-aloud toggles; the microphone button explains itself when unsupported.
- [ ] Live sentiment strip updates as you talk; the "Demo" badge is visible.
- [ ] Clear conversation works (with its confirm step).

## Activities
- [ ] Breathe: each exercise's timing feels right; the voice guide (if enabled) follows the rhythm.
- [ ] Play: runner, match-3, memory, focus, colouring, calm jar, mindfulness, positive moment all run.
- [ ] Puzzles: block, sudoku, word search, jigsaw, riddles, memory all work.
- [ ] Chess: legal moves only; try castling, en passant and promotion; play the computer; undo; reset;
      check/checkmate/stalemate messages appear correctly. (Engine rules were unit-checked; please
      confirm in the browser.)

## Reminders
- [ ] Turn reminders on, set a time a minute ahead, grant notification permission → one toast and
      one notification arrive, and only once that day.
- [ ] Deny permission → the app still works and explains the limitation.

## Settings & privacy
- [ ] Data export downloads a JSON file that opens.
- [ ] Delete-my-data clears everything and returns to the entry screen.
- [ ] The urgent-support panel opens the safety modal.

## Accessibility (spot-check)
- [ ] Keyboard-only: reach and operate the sidebar, chess board and modals.
- [ ] Screen reader: chess squares and the safety modal have useful labels.
- [ ] `prefers-reduced-motion`: animations are effectively off.

## Deployment (separate)
- [ ] Static client deploys and all routes resolve via the SPA rewrite.
- [ ] If the API is deployed, `/api/health` responds and the adapters are configured (see
      `docs/integration.md`).
