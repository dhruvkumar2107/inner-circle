# Inner Circle

**Your Mind Matters. Always.** — *your quiet space to heal*

Inner Circle is a student mental-wellbeing research prototype. It brings together validated psychological screening (PHQ-9 / GAD-7), fuzzy risk inference, NLP-based conversational analysis, risk-adaptive intervention, continuous monitoring, and human-in-the-loop professional support. It supports screening and support; it does not diagnose or prescribe.

## Start locally

Requires Node.js 20.19 or newer. From this folder:

```sh
npm install
npm run dev
```

The Vite client runs at <http://localhost:5173> and the API at <http://localhost:4000>. Register a demo student account to enter the app. If `MONGO_URI` is blank, the API uses a clearly logged in-memory demo store; accounts are lost when the API process stops. Set a MongoDB URI for persistence.

Copy `.env.example` to `.env` and set a long, random `JWT_SECRET` before using a persistent database or deploying. Never use the example secret in production. LLM provider settings are reserved for the adapter phase; the current chat demo uses a local response flow and requires no external API key.

## Implemented in this build

- Responsive, anonymous student shell; landing and account registration/login.
- Password hashing (bcrypt cost 12), short-lived access tokens, HTTP-only refresh cookie, lockout after repeated failed logins, Zod request validation, rate limits, Helmet, and CORS allow-list.
- Collision-aware student aliases and public forum response projection that excludes author identifiers and PII.
- Consent-first PHQ-9 / GAD-7 onboarding, check-in inputs, an explainable Mamdani fuzzy inference module, result summary, and deterministic item-9 safety override.
- Dashboard, accessible markdown chat demo, resources with in-app activity launch, appointments demo, anonymous community board, and research playground.

The web prototype stores the latest screening summary and consent locally in the browser for the demo. Appointment and forum interactions are not yet backed by durable collections. The research playground and professional/admin views need role-aware API endpoints before they can be used with real records.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start client and API together |
| `npm run build` | Build the client and compile the API |
| `npm test` | Run server unit and privacy tests |
| `npm run typecheck` | Type-check server modules |

## Safety and ethics

- Screening results are not medical diagnoses, and the fuzzy output is not a clinical decision.
- PHQ-9 item 9 or detected crisis language must activate the safety pathway; human review is required for high-tier and designated elevated cases.
- The crisis pathway in this prototype lists India resources: Tele-MANAS **14416** / **1800-891-4416**, KIRAN **1800-599-0019**, and emergency **112**. **Verify every number, service, and institutional contact before launch.** The application is not an emergency service.
- Clinical review, local institutional approval, accessibility review, security review, and privacy/retention decisions are required before real-world use. Fuzzy parameters are expert-defined and require clinical calibration.
- Demo persona credentials are not included; create an account locally. Never add real student data to demo environments.

## Limitations & ethics

PHQ-9 and GAD-7 are screening instruments, not diagnostic tools. The implementation has not been clinically validated. Validation is pending clinical review; institutional approval is required before psychiatry involvement. The fuzzy sets and rules are transparent research defaults, not clinically calibrated thresholds. Human professionals—not AI—must decide on care or escalation. This prototype is not suitable for production or emergency use.

## Out of scope

Wearables, a native mobile app, advanced predictive ML, production push notifications, durable appointment/forum workflows, voice interaction, and a configured external LLM provider.

See [the demo script](./docs/demo-script.md), [architecture](./docs/architecture.md), [fuzzy specification](./docs/fuzzy-spec.md), [privacy notes](./docs/privacy.md), and [API notes](./docs/api.md).
