/**
 * PHQ-9 and GAD-7 screening instruments — validated public-domain wording,
 * the standard 0–3 response scale, the recognised severity bands and the
 * official recall periods.
 *
 * These are screening tools, not diagnostic tests. Severity labels describe
 * the *level of reported symptoms in the screening*, never a condition.
 */

export const PHQ9_INTRO_KEY = 'screening.intro'
export const GAD7_INTRO_KEY = 'screening.intro'
export const INSTRUMENT_NOTE_KEY = 'screening.instrumentNote'

export const RESPONSES = [
  { value: 0, labelKey: 'screening.responses.notAtAll' },
  { value: 1, labelKey: 'screening.responses.severalDays' },
  { value: 2, labelKey: 'screening.responses.moreThanHalf' },
  { value: 3, labelKey: 'screening.responses.nearlyEveryDay' },
]

export const DIFFICULTY_RESPONSES = [
  { value: 0, labelKey: 'screening.difficulty.notAtAll' },
  { value: 1, labelKey: 'screening.difficulty.somewhat' },
  { value: 2, labelKey: 'screening.difficulty.very' },
  { value: 3, labelKey: 'screening.difficulty.extremely' },
]

export const PHQ9_ITEMS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading or watching television',
  'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
]

export const GAD7_ITEMS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
]

export const PHQ9_MAX = 27
export const GAD7_MAX = 21

/** Item 9 of the PHQ-9 is the safety-sensitive question. */
export const PHQ9_SAFETY_INDEX = 8

export const scoreOf = (answers) => answers.reduce((sum, value) => sum + (Number(value) || 0), 0)

const severity = (level, tone) => ({
  level,
  tone,
  labelKey: `screening.severity.${level}.label`,
  shortKey: `screening.severity.${level}.short`,
})

export const phq9Severity = (score) => {
  if (score <= 4) return severity('minimal', 'low')
  if (score <= 9) return severity('mild', 'low')
  if (score <= 14) return severity('moderate', 'mid')
  if (score <= 19) return severity('moderatelySevere', 'mid')
  return severity('severe', 'high')
}

export const gad7Severity = (score) => {
  if (score <= 4) return severity('minimal', 'low')
  if (score <= 9) return severity('mild', 'low')
  if (score <= 14) return severity('moderate', 'mid')
  return severity('severe', 'high')
}

export const severityFor = (type, score) => (type === 'phq9' ? phq9Severity(score) : gad7Severity(score))

/**
 * Maps the difficulty item (0–3) onto the 0–10 functional-impact input that the
 * fuzzy inference system expects. Illustrative mapping, not a clinical scale.
 */
export const difficultyToFunctional = (difficulty) => [0, 3, 7, 10][difficulty ?? 0]

export const DISCLAIMER_KEY = 'screening.disclaimer'
