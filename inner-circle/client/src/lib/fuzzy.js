/**
 * Fuzzy inference system (Mamdani) — Inner Circle's support engine.
 *
 * Inputs: PHQ-9 total, GAD-7 total, recent sentiment, self-reported stress and
 * functional impact. Each input is fuzzified with overlapping trapezoidal /
 * triangular membership functions, 14 transparent rules are evaluated with
 * min-AND / max-OR, the outputs are aggregated and defuzzified by centroid.
 *
 * IMPORTANT: the membership functions and rules below are ILLUSTRATIVE research
 * defaults written for this prototype. They are not clinically calibrated
 * thresholds and must be reviewed with qualified clinicians before any real
 * use. Output categories describe reported symptom severity for support
 * suggestions only — never a diagnosis. Urgent safety concerns bypass this
 * module entirely (see lib/sentiment.js checkCrisis and PHQ-9 item 9).
 */

export const INPUT_MFS = {
  phq9: {
    Low: { type: 'trap', a: 0, b: 0, c: 4, d: 8 },
    Moderate: { type: 'tri', a: 5, b: 10, c: 16 },
    High: { type: 'trap', a: 13, b: 18, c: 27, d: 27 },
  },
  gad7: {
    Low: { type: 'trap', a: 0, b: 0, c: 4, d: 7 },
    Moderate: { type: 'tri', a: 4, b: 9, c: 15 },
    High: { type: 'trap', a: 10, b: 15, c: 21, d: 21 },
  },
  sentiment: {
    Negative: { type: 'trap', a: -1, b: -1, c: -0.5, d: -0.1 },
    Neutral: { type: 'tri', a: -0.4, b: 0, c: 0.4 },
    Positive: { type: 'trap', a: 0.1, b: 0.5, c: 1, d: 1 },
  },
  stress: {
    Low: { type: 'trap', a: 1, b: 1, c: 3, d: 5 },
    Medium: { type: 'tri', a: 3, b: 5.5, c: 8 },
    High: { type: 'trap', a: 6, b: 8, c: 10, d: 10 },
  },
  functional: {
    Low: { type: 'trap', a: 0, b: 0, c: 2, d: 4 },
    Moderate: { type: 'tri', a: 3, b: 5, c: 7 },
    High: { type: 'trap', a: 6, b: 8, c: 10, d: 10 },
  },
}

export const OUTPUT_MFS = {
  Low: { type: 'trap', a: 0, b: 0, c: 15, d: 35 },
  Moderate: { type: 'tri', a: 25, b: 45, c: 65 },
  Elevated: { type: 'tri', a: 50, b: 67, c: 82 },
  High: { type: 'trap', a: 70, b: 85, c: 100, d: 100 },
}

export const INPUT_META = {
  phq9: { label: 'PHQ-9 score', min: 0, max: 27, unit: '', hint: '0–27' },
  gad7: { label: 'GAD-7 score', min: 0, max: 21, unit: '', hint: '0–21' },
  sentiment: { label: 'Recent sentiment', min: -1, max: 1, step: 0.1, unit: '', hint: '−1 to +1' },
  stress: { label: 'Self-reported stress', min: 1, max: 10, unit: '/10', hint: '1–10' },
  functional: { label: 'Functional impact', min: 0, max: 10, unit: '/10', hint: '0–10' },
}

export const RULES = [
  { id: 'R1', description: 'Lower screening indicators together with low stress', conditions: [{ input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Low' }, { input: 'stress', set: 'Low' }], output: 'Low' },
  { id: 'R2', description: 'Lower screening indicators with positive recent sentiment', conditions: [{ input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Low' }, { input: 'sentiment', set: 'Positive' }], output: 'Low' },
  { id: 'R3', description: 'Moderate depressive or anxiety indicators with medium stress', conditions: [{ input: 'stress', set: 'Medium' }], anyOf: [{ input: 'phq9', set: 'Moderate' }, { input: 'gad7', set: 'Moderate' }], output: 'Moderate' },
  { id: 'R4', description: 'Moderate depressive and anxiety indicators together', conditions: [{ input: 'phq9', set: 'Moderate' }, { input: 'gad7', set: 'Moderate' }], output: 'Moderate' },
  { id: 'R5', description: 'Moderate screening indicators with high stress', conditions: [{ input: 'phq9', set: 'Moderate' }, { input: 'gad7', set: 'Moderate' }, { input: 'stress', set: 'High' }], output: 'Elevated' },
  { id: 'R6', description: 'Higher PHQ-9 or GAD-7 screening indicators', conditions: [], anyOf: [{ input: 'phq9', set: 'High' }, { input: 'gad7', set: 'High' }], output: 'High' },
  { id: 'R7', description: 'Negative recent sentiment with high functional impact', conditions: [{ input: 'sentiment', set: 'Negative' }, { input: 'functional', set: 'High' }], output: 'Elevated' },
  { id: 'R8', description: 'Moderate PHQ-9 indicators with high functional impact', conditions: [{ input: 'phq9', set: 'Moderate' }, { input: 'functional', set: 'High' }], output: 'Elevated' },
  { id: 'R9', description: 'Moderate anxiety indicators with high stress and negative sentiment', conditions: [{ input: 'gad7', set: 'Moderate' }, { input: 'stress', set: 'High' }, { input: 'sentiment', set: 'Negative' }], output: 'Elevated' },
  { id: 'R10', description: 'Higher PHQ-9 indicators with high functional impact', conditions: [{ input: 'phq9', set: 'High' }, { input: 'functional', set: 'High' }], output: 'High' },
  { id: 'R11', description: 'High stress and functional impact with negative sentiment', conditions: [{ input: 'stress', set: 'High' }, { input: 'functional', set: 'High' }, { input: 'sentiment', set: 'Negative' }], output: 'High' },
  { id: 'R12', description: 'High stress despite lower screening indicators', conditions: [{ input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Low' }, { input: 'stress', set: 'High' }], output: 'Moderate' },
  { id: 'R13', description: 'Moderate anxiety indicators with neutral sentiment', conditions: [{ input: 'sentiment', set: 'Neutral' }, { input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Moderate' }], output: 'Moderate' },
  { id: 'R14', description: 'Positive sentiment with low stress and low functional impact', conditions: [{ input: 'sentiment', set: 'Positive' }, { input: 'functional', set: 'Low' }, { input: 'stress', set: 'Low' }], output: 'Low' },
]

export const OUTPUT_CATEGORIES = {
  Low: { label: 'Lower reported symptom severity', tone: 'low' },
  Moderate: { label: 'Moderate reported symptom severity', tone: 'mid' },
  Elevated: { label: 'Moderate-to-higher reported symptoms', tone: 'mid' },
  High: { label: 'Higher reported symptom severity', tone: 'high' },
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const fuzzify = (value, mf) => {
  if (mf.type === 'trap') {
    if (value < mf.a || value > mf.d) return 0
    if (value >= mf.b && value <= mf.c) return 1
    if (value >= mf.a && value < mf.b) return mf.b === mf.a ? 1 : (value - mf.a) / (mf.b - mf.a)
    return mf.d === mf.c ? 1 : (mf.d - value) / (mf.d - mf.c)
  }
  if (value <= mf.a || value >= mf.c) return 0
  if (value === mf.b) return 1
  return value < mf.b ? (value - mf.a) / (mf.b - mf.a) : (mf.c - value) / (mf.c - mf.b)
}

const DEFAULTS = { phq9: 0, gad7: 0, sentiment: 0, stress: 5, functional: 0, safetyOverride: false }

const CONTRIBUTOR_LABELS = {
  phq9: 'PHQ-9 screening responses',
  gad7: 'GAD-7 screening responses',
  sentiment: 'Recent emotional expression',
  stress: 'Self-reported stress',
  functional: 'Effect on daily activities',
}

/**
 * Run the inference and return an explainable result: memberships, every rule
 * that fired with its strength, contributors, a plain-language narrative and
 * the support suggestions that go with the category.
 */
export const inferSupport = (raw = {}) => {
  const inputs = {
    phq9: clamp(Number(raw.phq9 ?? DEFAULTS.phq9), 0, 27),
    gad7: clamp(Number(raw.gad7 ?? DEFAULTS.gad7), 0, 21),
    sentiment: clamp(Number(raw.sentiment ?? DEFAULTS.sentiment), -1, 1),
    stress: clamp(Number(raw.stress ?? DEFAULTS.stress), 1, 10),
    functional: clamp(Number(raw.functional ?? DEFAULTS.functional), 0, 10),
    safetyOverride: raw.safetyOverride === true,
  }

  const memberships = Object.fromEntries(
    Object.entries(INPUT_MFS).map(([input, sets]) => [
      input,
      Object.fromEntries(
        Object.entries(sets).map(([set, mf]) => [set, Number(fuzzify(inputs[input], mf).toFixed(4))]),
      ),
    ]),
  )

  const firedRules = []
  const aggregated = { Low: 0, Moderate: 0, Elevated: 0, High: 0 }
  const contribution = { phq9: 0, gad7: 0, sentiment: 0, stress: 0, functional: 0 }

  RULES.forEach((rule) => {
    const andStrength = rule.conditions.reduce(
      (strength, condition) => Math.min(strength, memberships[condition.input][condition.set] ?? 0),
      1,
    )
    const anyStrength = rule.anyOf
      ? Math.max(...rule.anyOf.map((condition) => memberships[condition.input][condition.set] ?? 0))
      : 1
    const strength = Math.min(andStrength, anyStrength)
    if (strength <= 0) return
    firedRules.push({
      id: rule.id,
      strength: Number(strength.toFixed(3)),
      text: rule.description,
      output: rule.output,
    })
    aggregated[rule.output] = Math.max(aggregated[rule.output], strength)
    ;[...rule.conditions, ...(rule.anyOf ?? [])].forEach((condition) => {
      contribution[condition.input] += strength
    })
  })

  let warning
  if (firedRules.length === 0) {
    warning = 'No rule fired for these inputs, so the conservative middle category was used.'
    aggregated.Moderate = 1
  }

  const samples = Array.from({ length: 101 }, (_, score) => {
    const membership = Object.keys(aggregated).reduce(
      (max, output) => Math.max(max, Math.min(aggregated[output], fuzzify(score, OUTPUT_MFS[output]))),
      0,
    )
    return { score, membership }
  })
  const area = samples.reduce((sum, s) => sum + s.membership, 0)
  const centroid = area > 0 ? samples.reduce((sum, s) => sum + s.score * s.membership, 0) / area : 45
  const riskScore = Number(centroid.toFixed(1))

  const safetyOverride = inputs.safetyOverride
  const tier = safetyOverride ? 3 : riskScore < 33 ? 1 : riskScore < 67 ? 2 : 3
  const category = safetyOverride
    ? 'High'
    : riskScore < 33
      ? 'Low'
      : riskScore < 67
        ? aggregated.Elevated > aggregated.Moderate
          ? 'Elevated'
          : 'Moderate'
        : 'High'

  const totalContribution = Object.values(contribution).reduce((sum, v) => sum + v, 0)
  const contributors = Object.keys(contribution)
    .filter((input) => contribution[input] > 0)
    .map((input) => ({
      factor: CONTRIBUTOR_LABELS[input],
      weight: Number((contribution[input] / Math.max(totalContribution, 1)).toFixed(3)),
    }))
    .sort((a, b) => b.weight - a.weight)

  const narrative = []
  if (memberships.phq9.Moderate > 0.3 || memberships.phq9.High > 0.3) narrative.push('mood-related concerns in your screening responses')
  if (memberships.gad7.Moderate > 0.3 || memberships.gad7.High > 0.3) narrative.push('anxiety-related concerns in your screening responses')
  if (memberships.stress.High > 0.3) narrative.push('elevated stress')
  if (memberships.sentiment.Negative > 0.3) narrative.push('recently expressed difficult feelings')
  if (memberships.functional.High > 0.3) narrative.push('daily activities feeling more affected')

  return {
    inputs,
    riskScore,
    tier,
    category,
    categoryLabel: OUTPUT_CATEGORIES[category].label,
    tone: OUTPUT_CATEGORIES[category].tone,
    memberships,
    firedRules,
    contributors,
    narrative: narrative.length ? narrative : ['indicators within the lower range'],
    safetyOverride,
    warning,
    suggestions: suggestionsFor(category, safetyOverride),
  }
}

export const suggestionsFor = (category, safetyOverride = false) => {
  if (safetyOverride) {
    return [
      { key: 'professional', label: 'Reach a person now', to: '/professional', note: 'Urgent support options come first.' },
      { key: 'talk', label: 'Talk to your companion', to: '/companion', note: 'A supportive conversation while you decide on the next step.' },
    ]
  }
  if (category === 'Low') {
    return [
      { key: 'breathe', label: 'Relaxation and self-care activities', to: '/breathe', note: 'Keep the small habits that are working.' },
      { key: 'mood', label: 'Repeat a check-in when it suits you', to: '/mood', note: 'A weekly rhythm is plenty for lower-range results.' },
    ]
  }
  if (category === 'Moderate' || category === 'Elevated') {
    return [
      { key: 'talk', label: 'Supportive AI conversation', to: '/companion', note: 'Talk through what is driving these feelings.' },
      { key: 'breathe', label: 'Grounding or breathing exercise', to: '/breathe', note: 'Short daily practice can lower the background noise.' },
      { key: 'mood', label: 'Repeat this check-in sooner', to: '/mood', note: 'Re-check in a few days to see which direction things are moving.' },
      { key: 'professional', label: 'Consider contacting a professional', to: '/professional', note: 'A qualified person can confirm what these results mean.' },
    ]
  }
  return [
    { key: 'professional', label: 'Contact a qualified professional', to: '/professional', note: 'The Department of Psychiatry at DSU can guide you.' },
    { key: 'talk', label: 'Talk to your companion now', to: '/companion', note: 'You do not have to carry this alone while you arrange support.' },
    { key: 'breathe', label: 'A gentle calming exercise', to: '/breathe', note: 'Something small to steady the next hour.' },
  ]
}

/**
 * Smoothness check used in the demo: two adjacent PHQ-9 scores must produce
 * nearly identical output — the reason fuzzy logic is used at all.
 */
export const smoothnessDemo = (base) => {
  const a = inferSupport({ ...base, phq9: 9 }).riskScore
  const b = inferSupport({ ...base, phq9: 10 }).riskScore
  return { a, b, diff: Number(Math.abs(a - b).toFixed(2)) }
}
