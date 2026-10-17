# Five-minute demo walkthrough

1. **Entry.** Open the app. Show the register/consent screen: the 18+ confirmation, the consent
   items, and the language picker. Point out that the copy says this is a prototype.
2. **Register & sign in.** Create a demo account with a demo email and password. You land on Home.
   Refresh once to show that the demo state persists in this browser only.
3. **Language.** Switch between English, हिन्दी and ಕನ್ನಡ from the topbar. Show the interface change
   throughout, and note that the PHQ-9/GAD-7 instrument wording stays in English by design (there is
   an on-screen note explaining why).
4. **Check in & companion.** Do a mood check-in and follow the gentle suggestion. Open the
   **AI Companion**, send a couple of messages, show the live sentiment strip and the "Demo" badge,
   toggle read-aloud, and try the microphone (or see the browser-support note).
5. **Safety pathway.** Type a crisis phrase into the companion (or answer PHQ-9 item 9 with anything
   other than "Not at all"). The urgent-support modal opens immediately. Show the helplines and the
   "verify before launch" note, then "Department contact".
6. **Screening.** Complete PHQ-9 and GAD-7 with ordinary answers; show the result screen, the score,
   the severity band and the "screening result, not a diagnosis" disclaimer.
7. **Unwind.** Open **Play & Relax** and **Breathe & Reset** (run the one-minute reset), then
   **Puzzles** and play a few moves of **chess** (castling, promotion, or play the computer).
8. **Explainability.** Open **How Inner Circle Works** (`/how`). Slide the fuzzy inputs, watch the
   memberships and fired rules, and show the contributor breakdown and the risk-adaptive suggestions.
   Note that the rule trace is in English and the parameters are illustrative.
9. **Professional.** Open **Contact a Professional**. Show the request form and the placeholder
   department details, and say clearly that names, numbers, timings and contacts are placeholders
   that the university must fill in.
10. **Settings & privacy.** Show the language row, reminders (and the honest "works only while the
    browser is open" note), data export, and delete-my-data. Explain that nothing is transmitted and
    that optional remote models are off unless explicitly configured.

The professional and admin views are demonstration shells only. Assigned professional access, review
actions, audit trails, k-anonymity analytics, durable scheduling and production crisis escalation are
not yet connected; see `docs/architecture.md` and `docs/privacy.md`.
