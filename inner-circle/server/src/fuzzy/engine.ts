export type MembershipFunction =
  | { type: 'trap'; a: number; b: number; c: number; d: number }
  | { type: 'tri'; a: number; b: number; c: number }

export interface FISInput {
  phq9: number
  gad7: number
  sentiment: number
  stress: number
  functional: number
  safetyOverride?: boolean
}

type InputName = keyof Omit<FISInput, 'safetyOverride'>
type SetName = 'Low' | 'Moderate' | 'High' | 'Medium' | 'Negative' | 'Neutral' | 'Positive'
type OutputName = 'Low' | 'Moderate' | 'Elevated' | 'High'

export interface Condition {
  input: InputName
  set: SetName
}

export interface Rule {
  id: string
  description: string
  conditions: Condition[]
  anyOf?: Condition[]
  output: OutputName
}

export interface FISOutput {
  riskScore: number
  tier: number
  level: OutputName
  memberships: Record<InputName, Record<string, number>>
  firedRules: Array<{ id: string; strength: number; text: string }>
  contributors: Array<{ factor: string; weight: number }>
  narrative: string[]
  safetyOverride: boolean
  warning?: string
}

export const PHQ9_MFS = {
  Low: { type: 'trap', a: 0, b: 0, c: 4, d: 8 },
  Moderate: { type: 'tri', a: 5, b: 10, c: 16 },
  High: { type: 'trap', a: 13, b: 18, c: 27, d: 27 },
} as const satisfies Record<string, MembershipFunction>

export const GAD7_MFS = {
  Low: { type: 'trap', a: 0, b: 0, c: 4, d: 7 },
  Moderate: { type: 'tri', a: 4, b: 9, c: 15 },
  High: { type: 'trap', a: 10, b: 15, c: 21, d: 21 },
} as const satisfies Record<string, MembershipFunction>

export const SENTIMENT_MFS = {
  Negative: { type: 'trap', a: -1, b: -1, c: -0.5, d: -0.1 },
  Neutral: { type: 'tri', a: -0.4, b: 0, c: 0.4 },
  Positive: { type: 'trap', a: 0.1, b: 0.5, c: 1, d: 1 },
} as const satisfies Record<string, MembershipFunction>

export const STRESS_MFS = {
  Low: { type: 'trap', a: 1, b: 1, c: 3, d: 5 },
  Medium: { type: 'tri', a: 3, b: 5.5, c: 8 },
  High: { type: 'trap', a: 6, b: 8, c: 10, d: 10 },
} as const satisfies Record<string, MembershipFunction>

export const FUNCTIONAL_MFS = {
  Low: { type: 'trap', a: 0, b: 0, c: 2, d: 4 },
  Moderate: { type: 'tri', a: 3, b: 5, c: 7 },
  High: { type: 'trap', a: 6, b: 8, c: 10, d: 10 },
} as const satisfies Record<string, MembershipFunction>

export const INPUT_MFS = {
  phq9: PHQ9_MFS,
  gad7: GAD7_MFS,
  sentiment: SENTIMENT_MFS,
  stress: STRESS_MFS,
  functional: FUNCTIONAL_MFS,
} as const

export const OUTPUT_MFS = {
  Low: { type: 'trap', a: 0, b: 0, c: 15, d: 35 },
  Moderate: { type: 'tri', a: 25, b: 45, c: 65 },
  Elevated: { type: 'tri', a: 50, b: 67, c: 82 },
  High: { type: 'trap', a: 70, b: 85, c: 100, d: 100 },
} as const satisfies Record<OutputName, MembershipFunction>

export const fuzzify = (value: number, mf: MembershipFunction): number => {
  if (mf.type === 'trap') {
    if (value < mf.a || value > mf.d) return 0
    if (value >= mf.b && value <= mf.c) return 1
    if (value >= mf.a && value < mf.b) return mf.b === mf.a ? 1 : (value - mf.a) / (mf.b - mf.a)
    return mf.d === mf.c ? 1 : (mf.d - value) / (mf.d - mf.c)
  }
  if (value <= mf.a || value >= mf.c) return 0
  if (value === mf.b) return 1
  return value < mf.b
    ? (value - mf.a) / (mf.b - mf.a)
    : (mf.c - value) / (mf.c - mf.b)
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const ruleBase: Rule[] = [
  { id: 'R1', description: 'Low screening indicators with low stress', conditions: [{ input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Low' }, { input: 'stress', set: 'Low' }], output: 'Low' },
  { id: 'R2', description: 'Low screening indicators with positive recent sentiment', conditions: [{ input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Low' }, { input: 'sentiment', set: 'Positive' }], output: 'Low' },
  { id: 'R3', description: 'Moderate depressive or anxiety indicators with medium stress', conditions: [{ input: 'stress', set: 'Medium' }], anyOf: [{ input: 'phq9', set: 'Moderate' }, { input: 'gad7', set: 'Moderate' }], output: 'Moderate' },
  { id: 'R4', description: 'Moderate depressive and anxiety indicators', conditions: [{ input: 'phq9', set: 'Moderate' }, { input: 'gad7', set: 'Moderate' }], output: 'Moderate' },
  { id: 'R5', description: 'Moderate screening indicators with high stress', conditions: [{ input: 'phq9', set: 'Moderate' }, { input: 'gad7', set: 'Moderate' }, { input: 'stress', set: 'High' }], output: 'Elevated' },
  { id: 'R6', description: 'High PHQ-9 or GAD-7 screening indicators', conditions: [], anyOf: [{ input: 'phq9', set: 'High' }, { input: 'gad7', set: 'High' }], output: 'High' },
  { id: 'R7', description: 'Negative recent sentiment with high functional impact', conditions: [{ input: 'sentiment', set: 'Negative' }, { input: 'functional', set: 'High' }], output: 'Elevated' },
  { id: 'R8', description: 'Moderate PHQ-9 indicators with high functional impact', conditions: [{ input: 'phq9', set: 'Moderate' }, { input: 'functional', set: 'High' }], output: 'Elevated' },
  { id: 'R9', description: 'Moderate anxiety indicators with high stress and negative sentiment', conditions: [{ input: 'gad7', set: 'Moderate' }, { input: 'stress', set: 'High' }, { input: 'sentiment', set: 'Negative' }], output: 'Elevated' },
  { id: 'R10', description: 'High PHQ-9 indicators with high functional impact', conditions: [{ input: 'phq9', set: 'High' }, { input: 'functional', set: 'High' }], output: 'High' },
  { id: 'R11', description: 'High stress and functional impact with negative sentiment', conditions: [{ input: 'stress', set: 'High' }, { input: 'functional', set: 'High' }, { input: 'sentiment', set: 'Negative' }], output: 'High' },
  { id: 'R12', description: 'High stress despite low screening indicators', conditions: [{ input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Low' }, { input: 'stress', set: 'High' }], output: 'Moderate' },
  { id: 'R13', description: 'Moderate anxiety indicators with neutral sentiment', conditions: [{ input: 'sentiment', set: 'Neutral' }, { input: 'phq9', set: 'Low' }, { input: 'gad7', set: 'Moderate' }], output: 'Moderate' },
  { id: 'R14', description: 'Positive sentiment with low stress and low functional impact', conditions: [{ input: 'sentiment', set: 'Positive' }, { input: 'functional', set: 'Low' }, { input: 'stress', set: 'Low' }], output: 'Low' },
]

export const RULES: Rule[] = ruleBase
export const ALL_RULES: Rule[] = RULES

const outputMembership = (name: OutputName, score: number): number =>
  fuzzify(score, OUTPUT_MFS[name])

const getMembership = (
  memberships: FISOutput['memberships'],
  condition: Condition,
): number => memberships[condition.input][condition.set] ?? 0

export const inferRisk = (rawInputs: FISInput): FISOutput => {
  const inputs: FISInput = {
    phq9: clamp(rawInputs.phq9, 0, 27),
    gad7: clamp(rawInputs.gad7, 0, 21),
    sentiment: clamp(rawInputs.sentiment, -1, 1),
    stress: clamp(rawInputs.stress, 1, 10),
    functional: clamp(rawInputs.functional, 0, 10),
    safetyOverride: rawInputs.safetyOverride ?? false,
  }
  const memberships = Object.fromEntries(
    Object.entries(INPUT_MFS).map(([input, sets]) => [
      input,
      Object.fromEntries(
        Object.entries(sets).map(([set, mf]) => [
          set,
          Number(fuzzify(inputs[input as InputName], mf).toFixed(4)),
        ]),
      ),
    ]),
  ) as FISOutput['memberships']

  const firedRules: FISOutput['firedRules'] = []
  const aggregated: Record<OutputName, number> = { Low: 0, Moderate: 0, Elevated: 0, High: 0 }
  const contributionByInput: Record<InputName, number> = {
    phq9: 0,
    gad7: 0,
    sentiment: 0,
    stress: 0,
    functional: 0,
  }

  for (const rule of RULES) {
    const andStrength = rule.conditions.reduce(
      (strength, condition) => Math.min(strength, getMembership(memberships, condition)),
      1,
    )
    const anyStrength = rule.anyOf
      ? Math.max(...rule.anyOf.map(condition => getMembership(memberships, condition)))
      : 1
    const strength = Math.min(andStrength, anyStrength)
    if (strength <= 0) continue
    firedRules.push({ id: rule.id, strength: Number(strength.toFixed(4)), text: rule.description })
    aggregated[rule.output] = Math.max(aggregated[rule.output], strength)
    for (const condition of [...rule.conditions, ...(rule.anyOf ?? [])]) {
      contributionByInput[condition.input] += strength
    }
  }

  let warning: string | undefined
  if (firedRules.length === 0) {
    warning = 'No rule fired; the conservative Moderate output was used.'
    aggregated.Moderate = 1
  }

  const samples = Array.from({ length: 101 }, (_, score) => {
    const membership = (Object.keys(aggregated) as OutputName[]).reduce(
      (max, output) => Math.max(max, Math.min(aggregated[output], outputMembership(output, score))),
      0,
    )
    return { score, membership }
  })
  const area = samples.reduce((sum, sample) => sum + sample.membership, 0)
  const centroid = area > 0
    ? samples.reduce((sum, sample) => sum + sample.score * sample.membership, 0) / area
    : 45
  const riskScore = Number(centroid.toFixed(2))
  const safetyOverride = inputs.safetyOverride === true
  const tier = safetyOverride ? 3 : riskScore < 33 ? 1 : riskScore < 67 ? 2 : 3
  const level: OutputName = safetyOverride
    ? 'High'
    : riskScore < 33 ? 'Low' : riskScore < 67 ? (aggregated.Elevated > aggregated.Moderate ? 'Elevated' : 'Moderate') : 'High'

  const totalContribution = Object.values(contributionByInput).reduce((sum, value) => sum + value, 0)
  const labels: Record<InputName, string> = {
    phq9: 'PHQ-9 indicators',
    gad7: 'GAD-7 indicators',
    sentiment: 'Recent emotional expression',
    stress: 'Self-reported stress',
    functional: 'Functional impact',
  }
  const contributors = (Object.keys(contributionByInput) as InputName[])
    .filter(input => contributionByInput[input] > 0)
    .map(input => ({
      factor: labels[input],
      weight: Number((contributionByInput[input] / Math.max(totalContribution, 1)).toFixed(3)),
    }))
    .sort((a, b) => b.weight - a.weight)

  const narrative: string[] = []
  if (memberships.phq9.Moderate > 0.3 || memberships.phq9.High > 0.3) narrative.push('Screening responses indicate some mood-related concerns')
  if (memberships.gad7.Moderate > 0.3 || memberships.gad7.High > 0.3) narrative.push('Screening responses indicate some anxiety-related concerns')
  if (memberships.stress.High > 0.3) narrative.push('Self-reported stress is elevated')
  if (memberships.sentiment.Negative > 0.3) narrative.push('Recent check-ins indicate difficult feelings')
  if (memberships.functional.High > 0.3) narrative.push('Daily activities may be feeling more affected')
  if (narrative.length === 0) narrative.push('Current screening and check-in indicators are within the lower range')

  return {
    riskScore,
    tier,
    level,
    memberships,
    firedRules,
    contributors,
    narrative,
    safetyOverride,
    ...(warning ? { warning } : {}),
  }
}

export const demoCase = (): FISOutput => inferRisk({
  phq9: 8,
  gad7: 6,
  sentiment: -0.4,
  stress: 7,
  functional: 5,
})

export const DEMO_EXPECTED = {
  riskScoreRange: [33, 70],
  tier: 2,
  level: 'Moderate',
} as const

export const verifySmoothness = (phq9a: number, phq9b: number): { scoreA: number; scoreB: number; diff: number } => {
  const baseline: Omit<FISInput, 'phq9'> = { gad7: 6, sentiment: -0.4, stress: 7, functional: 5 }
  const scoreA = inferRisk({ ...baseline, phq9: phq9a }).riskScore
  const scoreB = inferRisk({ ...baseline, phq9: phq9b }).riskScore
  return { scoreA, scoreB, diff: Math.abs(scoreA - scoreB) }
}
