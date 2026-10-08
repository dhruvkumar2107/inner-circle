# INNER CIRCLE v2 — MASTER BUILD PROMPT

> Paste everything below the line into your AI coding agent (OpenCode / Claude Code / Cursor). Run it phase by phase (Section 15). Do not skip the acceptance checks.

---

## 0. ROLE & MISSION

You are a senior full-stack engineer, applied-AI researcher, and product designer. Rebuild **Inner Circle** — "*your quiet space to heal*" — a student mental-wellbeing platform, as a complete, working, demo-ready research prototype.

**Rule #1 — Nothing that exists today may disappear.** Every screen, feature, label, resource, anonymous-identity mechanism, and flow in Section 2 must exist in v2, in a *better* version. Section 3 adds the new research layer on top.

**Research positioning (use this wording in the UI "About", README, and architecture page):**
> Validated psychological screening (PHQ-9 / GAD-7) + **fuzzy risk inference** + NLP-based conversational analysis + risk-adaptive intervention + continuous monitoring + human-in-the-loop professional support.

**Hard positioning rules:**
- The system does **screening, support and escalation**. It never diagnoses or prescribes. Never write "diagnosis", "you have depression", etc. in UI copy. Use "screening result", "symptoms detected", "indicators".
- Name the module **"Fuzzy Logic-Based Risk Stratification Module"**, never "AI Diagnosis System".
- Every screening result screen carries: *"This screening result is not a medical diagnosis."*
- AI assists; humans decide (human-in-the-loop) for anything Moderate-and-above that needs action.

Tagline: **"Your Mind Matters. Always."** Brand sub-line (keep): **"your quiet space to heal"**.

---

## 1. TECH STACK (fixed — do not substitute without reason)

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand (light state), Recharts (charts), Framer Motion (subtle motion), react-i18next, lucide-react icons, react-markdown (render chat) |
| Backend | Node.js + Express (TypeScript), REST + a WebSocket/SSE channel for chat streaming and volunteer chat |
| DB | MongoDB (Mongoose) |
| Auth/Security | JWT (short-lived access + refresh cookie, httpOnly, sameSite), bcrypt (cost ≥ 12), RBAC middleware, Helmet, express-rate-limit, express-validator/zod, CORS allow-list, HTTPS in deployment, audit log |
| AI | LLM provider behind an **adapter interface** (`LLMProvider.generate()`); env-selectable (Anthropic / OpenAI / Gemini). **Must degrade gracefully** to a rule-based responder when no API key is present so the demo never breaks. |
| NLP | Lightweight lexicon sentiment (e.g. `vader-sentiment`) + LLM structured-JSON emotion/topic classifier + keyword fallback |
| Fuzzy | **Hand-written Mamdani FIS in TypeScript** (no black-box library) in `/server/src/fuzzy/` so the maths is inspectable for the paper. Pure functions, 100% unit-tested. |
| Hosting | Frontend: Vercel/Render static. Backend: Render. DB: MongoDB Atlas. `.env.example` provided. |

Monorepo layout:
```
inner-circle/
  client/        (React app)
  server/        (Express API)
    src/
      fuzzy/     (membership.ts, rules.ts, engine.ts, explain.ts, __tests__)
      nlp/       (sentiment.ts, emotion.ts, topics.ts, crisis.ts)
      ai/        (providers/, chatPipeline.ts, prompts.ts, fallback.ts)
      modules/   (auth, screening, checkin, chat, resources, appointments, forum, journal, gamification, analytics, admin, audit)
      middleware/(auth, rbac, validate, rateLimit, errors)
      seed/      (seed.ts)
  docs/          (architecture.md, fuzzy-spec.md, privacy.md, demo-script.md)
  README.md
```

---

## 2. EXISTING FEATURES — MUST BE PRESERVED (and improved)

This is what the current prototype already has (taken from the recorded walkthrough). Re-create all of it.

### 2.1 Global shell
- Left **sidebar**: brand block ("Inner Circle" / "your quiet space to heal"), nav items in this order: **Dashboard, AI Chat, Appointments, Resources, Forum**. Active item has a pale-cyan pill highlight. Bottom of sidebar: **anonymous user chip** (avatar icon + alias e.g. "Harmonious Aurora" + role "Student").
- **Top bar**: small caps eyebrow "INNER CIRCLE", subtitle **"Curated support to meet you where you are."**, notification **bell**, user chip, **Logout** button.
- Visual language (keep, then refine): Inter font, near-white background with soft blue/lavender blur blobs, frosted white cards with large radius (2xl) and soft shadows, cyan/teal primary (`#0EA5C6`-ish), indigo→purple gradient hero, pill chips, toast notifications top-right.

### 2.2 Anonymous identity system (IMPORTANT — preserve + strengthen)
- On registration every student is auto-assigned a **calm, positive anonymous alias** in the pattern **`<Adjective> <Noun>`** — e.g. *Harmonious Aurora*. The alias — not the real name — is shown in the sidebar, greeting ("Welcome back, Harmonious Aurora!"), forum, volunteer chat, and anywhere peers can see.
- Implement: curated wordlists (≥ 120 adjectives such as Harmonious, Serene, Gentle, Radiant, Steady, Hopeful, Luminous, Tranquil, Resilient, Mellow…; ≥ 120 nouns such as Aurora, Meadow, Lantern, Horizon, Willow, Ember, Breeze, Harbor, Comet, Lotus…), no negative/trigger words, collision-safe (unique index; append a short numeric suffix only on collision).
- Student may **re-roll** the alias in Settings (max 3 times / 30 days) and toggle "Show my real first name to my assigned counselor only".
- Real name/email/student ID live only in the `users` collection and are **never** returned by forum, peer-chat, or analytics endpoints. Peers see alias only. Add an automated test proving no PII leaks from those endpoints.
- Volunteers also get an alias plus a "Verified student volunteer" badge.

### 2.3 Registration ("Create your account")
Fields exactly as today: **First Name, Last Name, Email Address, Student ID (Optional), Password (with show/hide eye), Confirm Password**, link "Or sign in to your existing account".
- Live password-rule checklist (green ticks): at least 6 characters (raise to 8 in v2), contains letters, add number. Match check on confirm.
- Add (minimal, non-sensitive): college, department, year — all optional.
- Today the PHQ-9 / GAD-7 appear on the same page under the form. In v2 move them to the **onboarding flow** (Section 4.3) right after account creation — but keep the identical question wording, 4-option pill layout, and "QUESTION n OF 9 / 7" cards.
- Login page: email + password, Forgot password (email reset token), "Create account" link, rate-limited, generic error messages.

### 2.4 Dashboard
- Gradient hero card (indigo→violet): chip **"INNER CIRCLE DASHBOARD"**, heading **"Welcome back, {alias}!"**, text "How are you feeling today? Take a moment to check-in, explore calming practices, or reach out to your support circle.", buttons **"Start mindful chat"** (primary) and **"Schedule time with a guide"**.
- Right-hand glass card **"MOOD SNAPSHOT"** with heart icon: **"Take a mindful pause"** — "Try a 2-minute breathing reset or share a reflection with your accountability circle." — mini buttons **"Breathing reset · 2 min"** and **"Mood log · Guided prompts"**.
- Section **"QUICK ACTIONS — Your mindful control center"** (grid of action cards; v2 adds more, see 4.5).

### 2.5 AI Chat
- Header: avatar, green **"Listening now"** status chip, **"Mood pulse"** chip (emoji reacts to the detected mood), live **"Risk: Low"** badge, **"End Chat"** button.
- Opening bot message: *"Hello! I'm here to provide emotional support and coping strategies. How are you feeling today? You can share what's on your mind, and I'll do my best to help."* with timestamp.
- Quick-reply chips under the input: **"I need a calming exercise", "Feeling overwhelmed", "Motivation boost", "Sleep issues"** (v2: chips become context-aware but these four remain defaults).
- Input "Type your message…" + send button; user bubbles right (cyan gradient), bot bubbles left (white).
- Existing behaviour to keep: for anxiety it offers **5-4-3-2-1 grounding**, **box breathing (4-4-4-4)**, "focus on what you can control", suggestion to book a counselor, and asks a follow-up ("What specific worries are on your mind?").
- **Bug to fix:** current bot reply collapses a numbered list into one paragraph. v2 must render proper markdown lists/steps.

### 2.6 Appointments
- Page title "Appointments — Manage your…", **"+ Book Appointment"** button.
- Four stat cards: **Total Appointments, Upcoming, Completed, Online**.
- **"Your Appointments"** list with **Filter**; each row: counselor name (e.g. **Dr. Sarah Johnson**, **Dr. Michael Chen**), status chip (**confirmed / scheduled / cancelled / completed**), type chip (**individual / follow-up**), date, time, duration (60 min / 45 min), location (**office / online**), buttons **Reschedule** and **Cancel** (cancelled row shows a disabled red "Cancelled").
- Toasts: "Appointment cancelled", "Appointment rescheduled".
- **"Book New Appointment" modal**: Counselor (select), Date (date picker), Time (select, e.g. 10:00 AM), Type (Individual / Follow-up / + Group, Emergency-priority), Location (Office / Online), Notes (optional: "Any specific concerns or preferences you'd like us to know?"), Cancel / Book Appointment.
- **Fix:** seed data must use dates relative to *today* (current seed shows stale 2024 dates), validate no past dates, no double-booking.

### 2.7 Resources
- Search bar **"Search guided practices, playlists, worksheets…"** + **Filters**.
- Card grid (2 columns). Each card: icon tile, title, one-line description, bullet links (external-link icon), buttons **"Try now"** and **"Save for later"**. **Keep these four cards and every item verbatim:**
  1. **Relaxation Guides** — *Guided breathing, mindfulness scripts, and grounding routines to help you reset.* → **Guided breathing audio set** (Follow immersive breathing sessions curated by Inner Circle mentors.) · **Mindful moments journal prompts** (Download prompts that anchor your reflections in calm and gratitude.)
  2. **Music Therapy** — *Curated soundscapes and playlists matched to mood, focus, and relaxation goals.* → **Lo-fi focus sessions** (Hand-picked beats to help you stay grounded while you study or create.) · **Sleep & unwind melodies** (Gentle ambient tracks to calm the nervous system before bedtime.) · **Confidence boosting affirmations** (Daily mantras voiced by therapists to reinforce self-belief.)
  3. **Gamified Activities** — *Interactive challenges that build resilience, gratitude, and emotional regulation skills.* → **Zen puzzle flow** (Play a calming block puzzle that encourages steady breathing and focus.) · **Affirmation typing quest** (Type uplifting words to guide your character through a mindful adventure.) · **Gratitude badge builder** (Earn digital badges by completing quick gratitude quests and reflection prompts.)
  4. **Mini Library** — *Short reads, printable worksheets, and expert-backed toolkits for your mental wellness journey.* → **How We Learn — Benedict Carey** · **Atomic Habits — James Clear** · **Self-Compassion — Dr. Kristin Neff** (with the same descriptions as today).
- v2 additions: categories by concern (Anxiety, Depression, Stress, Academic pressure, Relationships, Sleep, Self-esteem, Exam stress), a **"Recommended for you"** row with **"Why am I seeing this?"** (Section 6), saved-items tab, multilingual resource text. **"Try now" must open a real in-app experience** where feasible (breathing exercise, grounding, journal prompt, mini zen game), not just an external link.

### 2.8 Forum / Peer Support
- Page hero: **"Verified student volunteers"** chip, **"Find a supporter who aligns with your needs"** — *Browse by name, specialization, or availability to match with psychology students trained in peer support.* — buttons **"Start volunteer chat"** and **"Explore all rooms"**.
- **"How peer support works"** three tiles: **Connect** (browse and select a peer supporter who matches your needs) · **Talk** (confidential conversations via chat, voice, or video) · **Grow** (receive guidance, grounding routines, and practical coping strategies).
- **"Inner Circle Volunteers — Peer Support Desk"** chat modal: green Online dot, topic tags **General Support**, **Quick Check-ins**, example thread (volunteer: "Hey, thanks for reaching out today! What kind of support would feel most helpful right now?" → student: "I'm feeling overwhelmed about exams and would love some grounding tips." → volunteer: "Let's take a deep breath together. Want to try a 3-2-1 check-in?"), input "Type a supportive message…", Send.
- v2 adds the anonymous community board (Section 4.9) beneath, plus volunteer cards (alias, specializations, availability, rating-free).

---

## 3. NEW RESEARCH LAYER ("fuzzy AI") — THE CORE OF v2

### 3.1 End-to-end architecture (implement and render it as a live diagram on an **"How it works"** page and in the Admin console)

```
                      INNER CIRCLE
                           │
                  STUDENT APPLICATION
        ┌──────────────────┼──────────────────┐
   Screening            Chatbot             Wellness
  PHQ-9 / GAD-7          + NLP              Resources
        └──────────────────┼──────────────────┘
                  INTELLIGENCE LAYER
        ┌──────────────────┼──────────────────┐
 Sentiment/Emotion   Fuzzy Inference     Trend Analysis
     Analysis            System
        └──────────────────┼──────────────────┘
                 RISK STRATIFICATION
              ┌────────────┼────────────┐
             LOW        MODERATE       HIGH
          Self-care    AI + Peer    Professional
          Resources     Support     Intervention
              └────────────┼────────────┘
                  PERIODIC MONITORING
                           │
                   RISK TREND UPDATE ──► Reassessment
```
Under it: **Backend** (Node + Express + REST + Auth + RBAC + Security) → **Data layer** (MongoDB: Users | Assessments | Chats | Appointments | Resources | Forums | Journals | Audit).

### 3.2 Fuzzy Inference System (Mamdani) — exact spec

Put the spec in `docs/fuzzy-spec.md` and implement in `server/src/fuzzy/`.

**Inputs (crisp → fuzzified):**

| # | Input | Range | Source | Fuzzy sets (membership) |
|---|---|---|---|---|
| 1 | PHQ-9 total | 0–27 | screening | Low `trap(0,0,4,8)` · Moderate `tri(5,10,16)` · High `trap(13,18,27,27)` |
| 2 | GAD-7 total | 0–21 | screening | Low `trap(0,0,4,7)` · Moderate `tri(4,9,15)` · High `trap(10,15,21,21)` |
| 3 | Recent emotional state (sentiment) | −1…+1 | rolling mean of last N chat/check-in/journal sentiment scores (recency-weighted) | Negative `trap(-1,-1,-0.5,-0.1)` · Neutral `tri(-0.4,0,0.4)` · Positive `trap(0.1,0.5,1,1)` |
| 4 | Stress level | 1–10 | self-report slider | Low `trap(1,1,3,5)` · Medium `tri(3,5.5,8)` · High `trap(6,8,10,10)` |
| 5 | Functional impact | 0–10 | "How much is this affecting your studies / sleep / daily activities?" (map PHQ-9 difficulty item: not at all=0, somewhat=3, very=7, extremely=10; or slider) | Low `trap(0,0,2,4)` · Moderate `tri(3,5,7)` · High `trap(6,8,10,10)` |

> Note: a PHQ-9 of 9 and 10 must produce *nearly identical* risk, not a jump. Add a unit test for that (that is the whole point of using fuzzy logic).

**Output:** `riskScore` 0–100. Output sets: Low `trap(0,0,15,35)` · Moderate `tri(25,45,65)` · Elevated `tri(50,67,82)` · High `trap(70,85,100,100)`.

**Operators:** AND = min, OR = max, implication = min (clipping), aggregation = max, defuzzification = **centroid** (sampled at 1-unit resolution).

**Rule base (minimum — implement all, store in a data file so a professional can inspect it; each rule has an id and a human-readable description used by the explainer):**
1. PHQ Low ∧ GAD Low ∧ Stress Low → **Low**
2. PHQ Low ∧ GAD Low ∧ Sentiment Positive → **Low**
3. (PHQ Moderate ∨ GAD Moderate) ∧ Stress Medium → **Moderate**
4. PHQ Moderate ∧ GAD Moderate → **Moderate**
5. PHQ Moderate ∧ GAD Moderate ∧ Stress High → **Elevated**
6. PHQ High ∨ GAD High → **High**
7. Sentiment Negative ∧ Functional High → **Elevated**
8. PHQ Moderate ∧ Functional High → **Elevated**
9. GAD Moderate ∧ Stress High ∧ Sentiment Negative → **Elevated**
10. PHQ High ∧ Functional High → **High**
11. Stress High ∧ Functional High ∧ Sentiment Negative → **High**
12. PHQ Low ∧ GAD Low ∧ Stress High → **Moderate** (stress alone is a signal)
13. Sentiment Neutral ∧ PHQ Low ∧ GAD Moderate → **Moderate**
14. Sentiment Positive ∧ Functional Low ∧ Stress Low → **Low**

If total firing strength is zero (should not occur) → return Moderate with a flagged warning, never crash.

**Tier mapping:** Low (score < 33) → **Tier 1**; Moderate/Elevated (33–66) → **Tier 2** (Elevated sub-flag when the Elevated set dominates → more frequent check-ins + proactive counselor nudge); High (≥ 67) → **Tier 3**.

**Expected demo case:** PHQ-9 = 8, GAD-7 = 6, Stress = 7, Sentiment = −0.4, Functional = 5 ⇒ risk score in the **Moderate band (~55–70)**. Compute actual value, snapshot-test it, and display it as "Risk Score N / 100 — Moderate".

**Explainability output (required, returned with every inference):**
```json
{
  "riskScore": 63,
  "tier": 2,
  "level": "Moderate",
  "memberships": { "phq9": {"Low":0.0,"Moderate":0.72,"High":0.0}, "...": {} },
  "firedRules": [{"id":"R3","strength":0.72,"text":"Moderate depressive or anxiety symptoms with medium stress"}],
  "contributors": [{"factor":"Elevated GAD-7","weight":0.31}, {"factor":"Recent negative emotional expression","weight":0.22}],
  "narrative": ["Moderate depressive symptoms","Elevated anxiety indicators","Increased academic stress","Recent negative emotional expression"],
  "safetyOverride": false
}
```
Contributor weights = normalized firing-strength contributions per input.

### 3.3 HARD SAFETY RULE (not fuzzy — deterministic, runs BEFORE and OVERRIDES the FIS)
Triggers (any one):
- PHQ-9 **item 9 > 0**
- Crisis language detected in chat/journal/check-in (keyword + phrase + LLM classifier, in English, Hindi, Kannada, and common transliterations)
- Student presses an in-app **"I need help now"** button (present on every page)

Behaviour: set `safetyOverride = true`, force **Tier 3**, immediately show the **Safety Pathway** screen: calm message, crisis resources, one-tap "Talk to a counselor now", "Notify my counselor", "I'm safe for now — continue". The fuzzy score is displayed but cannot lower the tier. Notify the assigned professional (in-app alert + audit entry). The chatbot must switch to a **crisis-safe response template** (no long coping lists; validate, encourage reaching a person, give resources).

Crisis resources (India, configurable in `resources.crisis.json`; **show a "verify numbers before launch" note in the README**): Tele-MANAS **14416** (or 1800-891-4416), KIRAN **1800-599-0019**, emergency **112**, plus the institution's own counselling number and campus security (configurable). Allow admin to edit.

### 3.4 Risk-Adaptive Intervention (visible in UI + architecture)
- **Tier 1 — Low:** self-guided support → wellness activities → resources → periodic check-in (weekly).
- **Tier 2 — Moderate:** AI support + wellness + **peer support** + more frequent check-ins (twice weekly) → professional referral suggested if trend worsens.
- **Tier 3 — High:** safety pathway → professional intervention → counselor/psychiatric support → follow-up monitoring (auto-schedule follow-up task).
The dashboard's "Your care plan" card shows the current tier as a 3-step ladder with the student's position highlighted, in gentle language (never "HIGH RISK" in red alarm style to the student; use "Extra support recommended").

### 3.5 Risk Trend Prediction
- Store each inference as a timeline point. Compute trajectory using EWMA + linear-regression slope over last 3–6 points → **Improving / Stable / Worsening** (thresholds in config).
- If worsening for 3 consecutive check-ins: show *"⚠️ Your stress indicators have increased over the last 3 check-ins. Would you like to talk to someone?"* with buttons [Talk to a counselor] [Try a calming exercise] [Not now].
- Trend chart on dashboard (Recharts) with PHQ-9, GAD-7, stress and composite risk lines.

### 3.6 Explainable AI everywhere
- **Assessment result page** → "Why this result?" panel (contributors + fired rules in plain language + membership bars).
- **Every recommendation card** → expandable **"Why am I getting this recommendation?"** (e.g. *5-minute breathing exercise — Why? Your recent check-in indicates elevated stress and anxiety.*; *Academic Stress Resource — Why? Your recent responses indicate academic pressure as a recurring concern.*). Store the reason string generated server-side with the recommendation record.
- **Professional dashboard** → full fired-rule trace per student.
- A dedicated page **"How Inner Circle makes decisions"** explains screening → fuzzy → tiers in student-friendly language.

### 3.7 Human-in-the-Loop
Make it explicit in code and UI: `AI → Risk assessment → Recommendation → Human review (required for Tier 3 and for any Tier-2 "Elevated" or worsening trend) → Professional/Peer intervention`. Professional dashboard has a **Review queue**; a professional can confirm, adjust (with note), or dismiss an AI-suggested escalation. All of it is audit-logged. AI never auto-books a clinical appointment without the student's confirmation (except showing the safety pathway).

---

## 4. FULL FEATURE SPEC (MUST / SHOULD / OPTIONAL)

### 4.1 Landing page (public) — MUST
Logo + name; tagline **"Your Mind Matters. Always."**; short explanation; CTAs **Get Started**, **Login**, **Learn About Mental Well-Being**; emergency/help disclaimer strip (crisis numbers); privacy & confidentiality statement; short "How it works" (Screen → Understand → Support → Follow-up) and the anonymity promise. Language switcher (EN / हिन्दी / ಕನ್ನಡ).

### 4.2 Auth — MUST
Register/login/forgot-password/logout, JWT + refresh, RBAC roles: `student`, `volunteer`, `professional`, `admin`. Account lockout after repeated failures. Collect only necessary data.

### 4.3 Onboarding — MUST
Stepper after registration: **"Let's understand how you're feeling."**
1. Welcome + **consent & privacy** screen (what is stored, who can see what, anonymity, right to delete; required checkbox; optional checkbox "allow anonymized data for research").
2. **PHQ-9** (progress bar, one-card-per-question, 4 pills: *Not at all / Several days / More than half the days / Nearly every day*; plus the functional-difficulty item).
3. **GAD-7** (same pattern).
4. Optional wellbeing questions: stress 1–10, sleep quality, main concerns (multi-select: stress, anxiety, loneliness, academic pressure, relationships, sleep, burnout, other), preferred language.
5. **Result**: "Assessment → Risk Analysis → Personalized Support". Show the two-row table (PHQ-9 score/27 + severity; GAD-7 score/21 + severity) using wording "**Screening Result: Mild Symptoms Detected**" + "not a medical diagnosis", then the **AI-Assisted Well-Being Assessment** (risk gauge N/100, level, bars for PHQ-9 / GAD-7 / Stress / Negative Mood, and the "Why this result?" list), then the personalized plan.
Severity cut-offs: PHQ-9 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe. GAD-7 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe.

**PHQ-9 items (keep wording):** (1) Little interest or pleasure in doing things (2) Feeling down, depressed, or hopeless (3) Trouble falling or staying asleep, or sleeping too much (4) Feeling tired or having little energy (5) Poor appetite or overeating (6) Feeling bad about yourself — or that you are a failure or have let yourself or your family down (7) Trouble concentrating on things, such as reading the newspaper or watching television (8) Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual (9) Thoughts that you would be better off dead or of hurting yourself in some way.
**GAD-7 items:** (1) Feeling nervous, anxious, or on edge (2) Not being able to stop or control worrying (3) Worrying too much about different things (4) Trouble relaxing (5) Being so restless that it is hard to sit still (6) Becoming easily annoyed or irritable (7) Feeling afraid, as if something awful might happen.
Scoring 0/1/2/3. Header copy: "PHQ-9 · Mood over the last 2 weeks — Please indicate how often you have been bothered by the following concerns."

### 4.4 AI Mental-Health Chatbot — MUST
Pipeline (implement as discrete, testable stages in `chatPipeline.ts`; show the stage trace in an optional **"Developer/Research view"** toggle for the demo):
```
User message → NLP preprocessing → Sentiment + Emotion detection → Topic detection
→ Crisis/Risk safety check → Context retrieval (recent check-ins, last assessment, journal themes, language, tier)
→ LLM response generation (system prompt + context + guardrails) → Response safety filter
→ Personalized recommendation attach (with "why") → Persist + update rolling sentiment + live "Risk: …" badge
```
Must understand: **stress, anxiety, loneliness, academic pressure, relationship concerns, sleep issues, burnout, emotional distress.**
Must provide: empathetic reply, coping suggestions, **breathing exercises, grounding techniques**, relevant resources, **referral when appropriate**.
**System prompt guardrails (store in `prompts.ts`):** warm, brief, non-clinical; never diagnose; never prescribe medication; never promise confidentiality it can't keep (explain limits of confidentiality in crisis); ask one gentle question at a time; reflect feelings before advice; respond in the user's language (en/hi/kn); on crisis → crisis template; decline medical/legal advice politely and route to humans; no moralizing; markdown formatting for steps.
Features: streaming responses, typing indicator, quick-reply chips (the four defaults + dynamic), message reactions (👍 helpful / 👎), "End Chat" → short mood-after check-in and a summary card ("Today you talked about exam stress. Here's what helped."), inline interactive **breathing widget** and **5-4-3-2-1 grounding widget** rendered inside chat, **voice input** (Web Speech API, SHOULD-level), chat history list.
Privacy: chat transcripts belong to the student; professionals see only AI-extracted summaries/flags unless the student consents or a safety override fires (then break-glass access is audit-logged).

### 4.5 Student Dashboard — MUST
Keep the hero + Mood Snapshot from 2.4, then:
- **Your Well-Being** card: current level (gentle wording), PHQ-9 trend, GAD-7 trend, stress trend, last assessment date, **next check-in** date + "Check in now".
- **Risk trend** chip (Improving / Stable / Worsening) + chart.
- **Your care plan** (tier ladder, 3.4).
- **Quick Actions — "Your mindful control center":** Talk to AI · Take a Check-In · Relax · Book Support · Explore Resources · Peer Circle · Journal · Wellness streak.
- **Recommended for you** (3–4 cards with "Why?").
- Streak/points widget ("🌱 7-Day Wellness Journey").
- Persistent floating **"I need help now"** button.

### 4.6 Periodic Monitoring (Check-ins) — MUST
Weekly (Tier 1) / twice-weekly (Tier 2 / Elevated) / auto follow-up (Tier 3). Do **not** ask for full PHQ-9/GAD-7 daily; do a full re-screen every 2 weeks (configurable) and a light check-in otherwise.
Light check-in: "How have you been feeling this week?" **😊 Good · 😐 Okay · 😟 Stressed · 😔 Low · 😣 Overwhelmed**, stress slider 1–10, functional-impact slider, optional one-line note (sentiment-analysed). Then recompute fuzzy risk, update trend, show a result toast with a one-line "why". Email/in-app reminder (bell notifications).

### 4.7 Wellness Hub + Gamification — MUST/SHOULD
Hub tiles: **Breathing** (box, 4-7-8, coherent), **Guided meditation**, **Grounding** (5-4-3-2-1), **Music/relaxation**, **Journaling**, **Sleep tips**, **Focus exercises**, plus the existing games (**Zen puzzle flow**, **Affirmation typing quest**, **Gratitude badge builder**) as real mini-games. Gamification (restrained): daily streak, completed-activity count, wellbeing points, badges (e.g. "First Breath", "7-Day Journey", "Gratitude Starter"), weekly progress ring. Points never shown to peers; no leaderboards.

### 4.8 Personalized Resource Hub — MUST
Per 2.7, plus recommendation engine: score each resource by (tags ∩ student's concerns/recent topics) + tier suitability + language + recency of use; return top-N with a generated **reason**.

### 4.9 Peer Support / Inner Circle Community — SHOULD
- Keep the Volunteer desk (2.8).
- **Anonymous community board**: rooms/categories (Exam Anxiety, Sleep, Loneliness, Burnout, Relationships, Wins & Gratitude, General), anonymous posting under alias, replies, reactions (🤝 support / 💙 relate / 🌱 grow — no downvotes), **Report post**, auto-moderation (toxicity + crisis detector: self-harm content is hidden from the feed, the author gets a private caring message + resources, and volunteers/moderators are alerted), moderator queue, trained **verified student volunteers** with training badge, posting rate limits. Example prompt thread: "How do you deal with exam anxiety?"
- Volunteer chat: real-time (WebSocket), 1:1, escalate-to-professional button for volunteers ("This student may need more support"), volunteer-side quick tips and the safety script.

### 4.10 Professional Support — MUST
Booking per 2.6, upgraded: counselor/doctor directory (name, specialization, languages, mode), **available slots** calendar, Online/In-person, appointment type incl. **Emergency/priority**, **appointment history**, reschedule/cancel with reason, reminders, .ics export. Seed: Dr. Sarah Johnson, Dr. Michael Chen, plus a psychiatry intern (labelled "supervised intervention — subject to institutional approval").

### 4.11 Professional Dashboard — MUST
Role-based. Shows: **assigned students (alias + minimal ID)**, risk category + tier, assessment trends, **flagged interactions** (summaries, not transcripts), appointment requests, follow-up status, intervention history/notes, **AI Review queue** (3.7), fired-rule explanation per student. Real identity revealed only to the *assigned* professional and only if the student allowed it. **Minimum-necessary principle**; no default access to chats. Notes are professional-only.

### 4.12 Admin Dashboard & Analytics — MUST/SHOULD
KPI cards: total registered students, assessments completed, risk distribution (e.g. LOW █████ 62% · MODERATE ██ 27% · HIGH █ 11%), weekly/monthly trends, most common concerns, resource usage, appointment statistics, peer-support activity. **Aggregated/anonymized only**, with a **minimum cell size of 5** (suppress smaller groups). User/role management, volunteer verification, resource CMS, crisis-resource editor, fuzzy parameter viewer (read-only for admin; change requires a versioned config + audit entry), **audit-log viewer** with filters, CSV export of aggregates.

### 4.13 Digital Wellbeing Journal — SHOULD
"My Journal": free-text entries ("Today I felt overwhelmed because…"), optional AI insights (emotion, stressors, **recurring themes** bar chart: Academic stress, Sleep, Loneliness, Relationships…), clearly labelled *wellbeing insights, not diagnosis*; per-entry toggle "Don't analyse this entry"; journal sentiment feeds the fuzzy input only if the student allows it.

### 4.14 Multilingual — SHOULD
**English + Hindi + Kannada** (react-i18next; chatbot replies in the selected language; resources have translated titles/descriptions for at least the Relaxation Guides and crisis numbers). Do not half-implement more languages.

### 4.15 Voice interaction — OPTIONAL (last)
"🎙️ Talk instead of Type": speech-to-text → same pipeline. Only after everything MUST is done.

### 4.16 Future / out of scope (list in README only)
Wearables, native mobile app, advanced predictive ML, real-time push notifications.

---

## 5. DATA MODEL (MongoDB / Mongoose)

- `users` {realName, email, passwordHash, studentId?, college?, dept?, year?, role, alias, aliasHistory[], language, consent{privacy, research, ts}, assignedProfessionalId?, streak, points, badges[], createdAt, lastLoginAt, lockUntil?}
- `assessments` {userId, type: 'PHQ9'|'GAD7', answers[], total, severity, item9Flag, functionalDifficulty?, takenAt}
- `checkins` {userId, mood, stress, functionalImpact, note?, sentiment?, takenAt}
- `riskInferences` {userId, inputs{phq9,gad7,sentiment,stress,functional}, memberships, firedRules[], riskScore, tier, level, safetyOverride, contributors[], narrative[], trend, createdAt}
- `chatSessions` {userId, language, startedAt, endedAt, moodBefore, moodAfter, summary, riskPeak, messages[{role, text, sentiment, emotions, topics[], crisisFlag, ts}]} (encrypted at rest field-level for `messages.text`)
- `recommendations` {userId, resourceId|activityId, reason, sourceSignals[], shownAt, actedAt?}
- `resources` {category, title, description, items[{title, desc, url|inAppRoute, type}], tags[], concerns[], tiers[], languages{}}
- `savedResources` {userId, resourceId}
- `appointments` {userId, professionalId, date, time, durationMin, type, mode, location, status, notes, priority, history[]}
- `professionals` {userId, name, title, specialization[], languages[], availability[]}
- `forumRooms`, `forumPosts` {roomId, authorAlias, authorId (server-only), body, reactions, reports[], status, flaggedCrisis}, `volunteerChats`
- `journalEntries` {userId, text, analysed:boolean, emotions[], themes[], sentiment, createdAt}
- `flags` {userId, source:'assessment'|'chat'|'forum'|'journal'|'button', severity, status, reviewedBy, decision, note, createdAt}
- `auditLogs` {actorId, role, action, targetUserId?, resource, ip, ts, meta}
- `fuzzyConfigs` {version, sets, rules, activeFrom, changedBy}

Indexes: unique `email`, unique `alias`, `userId+takenAt` on time-series collections.

---

## 6. API SURFACE (REST, all validated with zod, all documented in `docs/api.md` + OpenAPI)

```
POST /auth/register | /auth/login | /auth/refresh | /auth/logout | /auth/forgot | /auth/reset
GET  /me   PATCH /me   POST /me/alias/reroll   DELETE /me   (export + delete my data)
POST /screening/phq9   POST /screening/gad7   GET /screening/history
POST /checkins   GET /checkins
POST /risk/infer   GET /risk/latest   GET /risk/trend   GET /risk/explain/:id
POST /chat/sessions   POST /chat/sessions/:id/messages (SSE stream)   POST /chat/sessions/:id/end   GET /chat/sessions
GET  /resources  GET /resources/recommended  POST /resources/:id/save  GET /resources/saved
GET  /professionals  GET /professionals/:id/slots
POST /appointments  GET /appointments  PATCH /appointments/:id (reschedule/cancel)
GET/POST /forum/rooms|posts|replies   POST /forum/posts/:id/report|react
WS   /volunteer-chat
GET/POST /journal   GET /journal/themes
POST /safety/help-now
GET  /pro/students  GET /pro/review-queue  POST /pro/review/:id  GET /pro/students/:id/trend
GET  /admin/analytics   GET /admin/audit   CRUD /admin/resources|users|crisis
```
Every professional/admin read of a student-linked record writes an `auditLogs` entry.

---

## 7. SECURITY & PRIVACY — MUST BE VISIBLE (put a "Security & Privacy" page in the app)

JWT auth, bcrypt, role-based access, HTTPS in deployment, input validation (zod) + output sanitisation (XSS), rate limiting (stricter on auth, chat, forum), Helmet headers, CORS allow-list, secure cookie flags, secrets only via env, field-level encryption of chat/journal text, anonymised/aggregated analytics (k ≥ 5), audit logs for all professional/admin actions, privacy controls (download my data, delete my account, toggle AI analysis of journal, toggle alias-reveal to counselor), data minimisation, no third-party trackers, LLM calls strip PII (never send real name/email/ID), documented confidentiality limits (crisis exception). Add a threat-model section in `docs/privacy.md`.

---

## 8. UI / UX — "same soul, better version"

- Keep the existing calm, glassy, cyan-lavender look and component shapes. Improve: consistent design tokens, 8-pt spacing, proper typography scale, dark mode, skeleton loaders, meaningful empty states, smooth but minimal motion (respect `prefers-reduced-motion`).
- **Responsive**: sidebar collapses to bottom tab bar on mobile (Dashboard, Chat, Book, Resources, Forum).
- **Accessibility**: WCAG AA contrast, full keyboard nav, ARIA labels, focus rings, screen-reader-friendly assessment cards, large tap targets, no colour-only meaning.
- **Tone**: gentle, non-clinical, no alarmist red for the student side. Professional/admin side can use clearer risk colours.
- Screens to include in the demo recording: Landing → Register → Onboarding → PHQ-9 → GAD-7 → AI Assessment result with Why → Dashboard → Chat (grounding widget) → Crisis demo (safety pathway) → Check-in → Trend alert → Resources (Why this?) → Forum (anonymous) → Booking → Professional dashboard (review queue) → Admin analytics → "How it works" architecture page.
- Include a **Research/Demo mode** (admin-only flag) with sample student personas (Low / Moderate / High / Worsening-trend / Crisis) and a **Fuzzy Playground** page: sliders for the 5 inputs → live membership plots, fired rules and risk output (excellent for the paper and viva).

---

## 9. SEED DATA

- Users: demo student per persona (Low, Moderate, High, Worsening, Crisis), 2 volunteers, 3 professionals (Dr. Sarah Johnson, Dr. Michael Chen, 1 psychiatry intern), 1 admin. Passwords in README (demo only).
- 6–8 weeks of back-dated check-ins/inferences per persona so trends and charts are populated.
- Appointments with dates **relative to today**.
- All resources from 2.7 + ≥ 25 additional items covering the concern categories.
- 30 forum posts across rooms with anonymous aliases (no real PII).

---

## 10. TESTING & QUALITY GATES

- **Fuzzy unit tests:** membership correctness at breakpoints; PHQ 9 vs 10 smoothness (|Δscore| small); monotonicity (raising any risk input never lowers score); all 14 rules reachable; deterministic output; golden-case snapshots (Section 3.2 demo case); no-rule-fires fallback.
- **Safety tests:** PHQ item 9 > 0 always yields Tier 3 + safety pathway regardless of fuzzy output; crisis phrases in en/hi/kn (including transliteration) trigger; chatbot never returns diagnostic phrases (regex test over a red-team prompt set); forum crisis post is hidden + author notified.
- **Privacy tests:** no PII from forum/volunteer/analytics endpoints; professionals cannot read other professionals' students; k-anonymity suppression works; audit entries written.
- **Auth tests:** RBAC matrix, lockout, rate limits, JWT expiry/refresh.
- E2E (Playwright): register → onboard → assessment → dashboard → chat → book → cancel.
- Lint + type-check + test must pass in CI (GitHub Actions).

---

## 11. WHAT THE CURRENT PROTOTYPE GOT WRONG (fix these)

1. Chat reply formatting (lists collapse) → markdown rendering.
2. Canned/templated chatbot → real LLM pipeline with NLP + safety + context.
3. PHQ-9/GAD-7 jammed into the sign-up page → proper onboarding with progress + consent.
4. Hard-coded "Mild + Mild = Low" style classification → fuzzy inference with explanations.
5. Stale 2024 appointment seed dates and no validation → relative dates + validation.
6. "Risk: Low" badge not tied to any logic → live from the pipeline.
7. Resources were static links → recommendations with reasons + in-app activities.
8. No professional/admin visibility → both dashboards with audit + RBAC.
9. Security was invisible → Security & Privacy page + tests.

---

## 12. DOCUMENTATION DELIVERABLES

`README.md` (setup in < 10 min, env vars, demo accounts, scripts), `docs/architecture.md` (diagrams from 3.1), `docs/fuzzy-spec.md` (sets, rules, operators, worked example with numbers, limitations), `docs/privacy.md` (data flow, retention, threat model, confidentiality limits), `docs/demo-script.md` (5-minute viva walkthrough), `docs/api.md`. Include a **"Limitations & ethics"** section: screening ≠ diagnosis, validation pending clinical review, institutional approval needed for psychiatry involvement, fuzzy parameters are expert-defined and require clinical calibration.

---

## 13. DEFINITION OF DONE

- Every item in Section 2 exists and is recognisably the same product.
- Every MUST item in Section 4 works end-to-end with seeded and fresh data.
- Fuzzy module is isolated, tested, explainable, and demonstrable in the Playground.
- Safety override works from assessment, chat, and the help-now button.
- App runs locally with one command (`npm run dev` at root) and deploys with the provided config; runs fully **without** an LLM key (fallback mode) and **with** one.
- Lighthouse accessibility ≥ 90 on main screens; no console errors.

---

## 14. WORKING AGREEMENT FOR THE AGENT

- Work in the phases below; after each phase run tests, summarise what exists, list anything deferred, and wait only if blocked — otherwise continue.
- Never invent clinical claims. If unsure about a clinical statement, make it neutral and add a TODO for clinician review.
- Prefer small, composable modules and clear types. No dead code, no placeholder lorem ipsum, no `any` in the fuzzy/safety modules.
- When something in this prompt conflicts, priority order: **safety > privacy > preserving existing features > research architecture > polish**.

---

## 15. PHASED EXECUTION PLAN

**Phase 1 — Foundation:** monorepo, tooling, design tokens, shell (sidebar/topbar), auth + RBAC + security middleware, user model, **anonymous alias generator + PII-leak test**, landing page, i18n scaffolding.
*Accept:* register/login works; alias assigned; shell matches 2.1.

**Phase 2 — Screening + Fuzzy core:** onboarding, consent, PHQ-9, GAD-7, scoring, severity, `fuzzy/` engine + rules + explainer + full unit tests, safety override, risk inference API, assessment result page with Why panel, Fuzzy Playground.
*Accept:* demo case lands Moderate; item-9 triggers safety pathway; tests green.

**Phase 3 — Dashboard + monitoring:** student dashboard (hero, snapshot, quick actions, care plan, trend), check-ins, trend engine + worsening alert, notifications bell.
*Accept:* seeded Worsening persona shows the alert after 3 check-ins.

**Phase 4 — AI chat:** NLP stages, LLM adapter + fallback, crisis template, widgets (breathing, grounding), chips, End Chat summary, live risk badge, rolling sentiment into FIS.
*Accept:* all 8 concern types detected; crisis phrase → safety pathway; works with no API key.

**Phase 5 — Resources + Wellness + gamification:** all 4 original cards verbatim + new categories, search/filter/save, recommendation engine with reasons, in-app activities, streak/points/badges, journal.

**Phase 6 — Support network:** appointments (full flow + fixes), professional directory/slots, volunteer desk (WebSocket), anonymous community board + moderation + report.

**Phase 7 — Professional & Admin:** professional dashboard + review queue (HITL) + audit, admin analytics (k-anonymity), CMS, crisis editor, audit viewer.

**Phase 8 — Hardening & polish:** multilingual (EN/HI/KN), dark mode, accessibility pass, security page, E2E tests, seed/demo mode, docs, deployment configs, demo script.

**Phase 9 — Optional:** voice input.

Begin with Phase 1. Before coding, print a short plan of the files you will create and confirm the folder structure from Section 1.
