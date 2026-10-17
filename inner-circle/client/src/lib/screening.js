/**
 * PHQ-9 and GAD-7 screening instruments — validated public-domain wording,
 * the standard 0–3 response scale, the recognised severity bands and the
 * official recall periods.
 *
 * These are screening tools, not diagnostic tests. Severity labels describe
 * the *level of reported symptoms in the screening*, never a condition.
 */

export const PHQ9_INTRO = 'Over the last 2 weeks, how often have you been bothered by the following problems?'
export const GAD7_INTRO = 'Over the last 2 weeks, how often have you been bothered by the following problems?'

export const RESPONSES = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

export const DIFFICULTY_RESPONSES = [
  { value: 0, label: 'Not difficult at all' },
  { value: 1, label: 'Somewhat difficult' },
  { value: 2, label: 'Very difficult' },
  { value: 3, label: 'Extremely difficult' },
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

export const phq9Severity = (score) => {
  if (score <= 4) return { label: 'Minimal reported symptoms', short: 'Minimal', tone: 'low' }
  if (score <= 9) return { label: 'Mild reported symptoms', short: 'Mild', tone: 'low' }
  if (score <= 14) return { label: 'Moderate reported symptoms', short: 'Moderate', tone: 'mid' }
  if (score <= 19) return { label: 'Moderately severe reported symptoms', short: 'Moderately severe', tone: 'mid' }
  return { label: 'Severe reported symptoms', short: 'Severe', tone: 'high' }
}

export const gad7Severity = (score) => {
  if (score <= 4) return { label: 'Minimal reported symptoms', short: 'Minimal', tone: 'low' }
  if (score <= 9) return { label: 'Mild reported symptoms', short: 'Mild', tone: 'low' }
  if (score <= 14) return { label: 'Moderate reported symptoms', short: 'Moderate', tone: 'mid' }
  return { label: 'Severe reported symptoms', short: 'Severe', tone: 'high' }
}

export const severityFor = (type, score) => (type === 'phq9' ? phq9Severity(score) : gad7Severity(score))

/**
 * Maps the difficulty item (0–3) onto the 0–10 functional-impact input that the
 * fuzzy inference system expects. Illustrative mapping, not a clinical scale.
 */
export const difficultyToFunctional = (difficulty) => [0, 3, 7, 10][difficulty ?? 0]

export const DISCLAIMER =
  'This is a screening result, not a medical diagnosis. It describes the symptoms you reported today.'
