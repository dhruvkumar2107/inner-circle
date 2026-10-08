# Architecture

```text
Student application
  ├─ Screening: PHQ-9 / GAD-7 and light check-ins
  ├─ Chat: supportive response, markdown, local demo pipeline
  └─ Wellness: resources, activities, peer community, appointments
          │
          ▼
REST API (Express, Zod, JWT, RBAC-ready middleware, rate limits)
  ├─ Identity: bcrypt password hashes, anonymous aliases
  ├─ Fuzzy Logic-Based Risk Stratification Module
  ├─ Safety override (separate from fuzzy inference)
  └─ Public forum projection (alias and post only)
          │
          ▼
Persistence: MongoDB/Mongoose when configured; in-memory demo store otherwise
```

## Risk-support flow

1. The student completes consent and screening inputs.
2. The Mamdani inference module fuzzifies PHQ-9, GAD-7, sentiment, stress, and functional impact; evaluates the inspectable rule base; aggregates output sets; and computes a centroid.
3. A deterministic safety override runs independently. A positive PHQ-9 item 9 or detected crisis must force Tier 3 and present safety resources regardless of the fuzzy score.
4. Risk-adaptive suggestions support self-guided, peer, or professional options. Human professionals make decisions for escalations; AI does not diagnose or book care.
5. Follow-up check-ins should update a risk timeline and trend; persistent storage and trend computation remain to be implemented.

## Runtime notes

`npm run dev` starts the Vite client and Express server. MongoDB is optional only for the local demo. `MONGO_URI` enables the Mongoose user schema. The current browser client persists the latest assessment in local storage, so it must not be used with real student information.

### Research positioning

Validated psychological screening (PHQ-9 / GAD-7) + **fuzzy risk inference** + NLP-based conversational analysis + risk-adaptive intervention + continuous monitoring + human-in-the-loop professional support.

This wording describes the intended research design, not clinical validation of this prototype.
