/**
 * Language analysis for Inner Circle — sentiment, emotion, topic and safety signals.
 *
 * This is a transparent, rule-based (lexicon) implementation used so the prototype
 * can demonstrate the full flow: text -> analysis -> contextual response -> suggestion.
 * It is clearly labelled as a simulation in the interface; a trained model can be
 * swapped in later behind the same function signatures. It is assistive only —
 * never a diagnosis and never an automatic risk determination.
 */

const POSITIVE = [
  'good', 'great', 'fine', 'better', 'okay', 'ok', 'well', 'happy', 'glad', 'joy', 'peace',
  'calm', 'relaxed', 'relieved', 'excited', 'proud', 'grateful', 'thankful', 'love', 'enjoy',
  'enjoyed', 'nice', 'wonderful', 'awesome', 'fantastic', 'hopeful', 'confident', 'achieved',
  'completed', 'finished', 'passed', 'progress', 'hope', 'bright', 'smooth', 'supported',
]

const NEGATIVE = [
  'bad', 'terrible', 'awful', 'sad', 'depressed', 'depressing', 'worried', 'worry', 'anxious',
  'anxiety', 'angry', 'pain', 'hurt', 'suffer', 'worst', 'stressed', 'stress', 'overwhelmed',
  'overwhelming', 'tired', 'exhausted', 'lonely', 'alone', 'hopeless', 'useless', 'fail',
  'failed', 'failure', 'scared', 'afraid', 'panic', 'nervous', 'cry', 'crying', 'hate',
  'upset', 'frustrated', 'frustrating', 'pointless', 'pressure', 'burnout', 'drained',
  'cant', 'cannot', 'unable', 'dread', 'miserable', 'numb', 'trapped', 'behind', 'late',
]

const NEGATORS = ['not', "don't", 'dont', 'never', 'no', 'hardly', "isn't", 'isnt', "wasn't", 'wasnt', 'cannot', "can't", 'cant']

const INTENSIFIERS = ['very', 'so', 'really', 'extremely', 'super', 'incredibly', 'totally', 'completely', 'absolutely', 'too']

const EMOTION_LEXICON = {
  anxiety: ['anxious', 'anxiety', 'nervous', 'worried', 'worry', 'worrying', 'panic', 'panicking', 'uneasy', 'dread', 'afraid', 'scared', 'fear', 'restless', 'on edge', 'tense'],
  sadness: ['sad', 'down', 'low', 'hopeless', 'empty', 'crying', 'cry', 'tears', 'hurt', 'grief', 'disappointed', 'numb', 'unhappy', 'miserable'],
  frustration: ['frustrated', 'frustrating', 'annoyed', 'irritated', 'angry', 'mad', 'furious', 'stuck', 'fed up', 'hate'],
  joy: ['happy', 'glad', 'joy', 'excited', 'grateful', 'thankful', 'proud', 'love', 'wonderful', 'amazing', 'great', 'cheerful', 'delighted'],
  fatigue: ['tired', 'exhausted', 'drained', 'sleepy', 'fatigued', 'worn out', 'burnout', 'burnt out', 'no energy', 'weak'],
  relief: ['relieved', 'relief', 'calm', 'settled', 'peaceful', 'relaxed', 'better', 'eased', 'lighter'],
  loneliness: ['lonely', 'alone', 'isolated', 'left out', 'no friends', 'nobody', 'missing', 'homesick'],
}

const EMOTION_LABELS = {
  anxiety: 'Anxiety signal',
  sadness: 'Sadness signal',
  frustration: 'Frustration signal',
  joy: 'Positive / joy',
  fatigue: 'Tiredness signal',
  relief: 'Relief signal',
  loneliness: 'Loneliness signal',
  neutral: 'Neutral tone',
}

export const emotionLabel = (key) => EMOTION_LABELS[key] || 'Neutral tone'

const TOPIC_LEXICON = {
  'Academic pressure': ['exam', 'exams', 'assignment', 'assignments', 'project', 'deadline', 'submission', 'study', 'studying', 'grades', 'marks', 'academic', 'syllabus', 'viva', 'lab report', 'thesis', 'semester', 'class', 'college', 'university', 'attendance'],
  Anxiety: ['anxious', 'anxiety', 'nervous', 'panic', 'overthinking', 'worry', 'worried', 'fear', 'scared'],
  Stress: ['stress', 'stressed', 'pressure', 'overwhelmed', 'too much', 'load', 'busy', 'burnout', 'exhausted'],
  Loneliness: ['lonely', 'alone', 'isolated', 'no friends', 'homesick', 'missing home', 'left out'],
  Sleep: ['sleep', 'insomnia', 'cant sleep', "can't sleep", 'awake', 'nightmare', 'tired in morning', 'all night', 'sleeping late'],
  Relationships: ['relationship', 'partner', 'boyfriend', 'girlfriend', 'breakup', 'friend', 'fight', 'argument', 'parents', 'family', 'roommate'],
  Motivation: ['motivation', 'motivated', 'procrastinating', 'focus', 'concentrate', 'distracted', 'lazy', 'discipline', 'routine', 'organise', 'organize', 'planning'],
  'Low mood': ['depressed', 'sad', 'hopeless', 'worthless', 'useless', 'no point', 'empty', 'crying'],
}

/** Sentiment: -1 (negative) .. +1 (positive), with a rough confidence. */
export const analyzeSentiment = (text) => {
  const normalized = String(text || '').toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ')
  const words = normalized.split(/\s+/).filter(Boolean)
  if (!words.length) return { score: 0, label: 'Neutral', confidence: 0 }

  let score = 0
  words.forEach((word, index) => {
    let weight = 0
    if (POSITIVE.includes(word)) weight = 1
    if (NEGATIVE.includes(word)) weight = -1
    if (weight === 0) return

    const before = words.slice(Math.max(0, index - 3), index)
    const negated = before.some((w, i) => NEGATORS.includes(w) && before.length - i <= 3)
    const intensified = before.some((w) => INTENSIFIERS.includes(w))

    if (negated) weight *= -0.7
    if (intensified) weight *= 1.5
    score += weight
  })

  const raw = score / Math.max(3, Math.sqrt(words.length) * 1.6)
  const clamped = Math.max(-1, Math.min(1, raw))
  const label = clamped > 0.12 ? 'Positive' : clamped < -0.12 ? 'Negative' : 'Neutral'
  const confidence = Math.min(0.95, 0.35 + Math.abs(clamped) * 0.7)
  return { score: Number(clamped.toFixed(2)), label, confidence: Number(confidence.toFixed(2)) }
}

/** Emotion signals: which emotional vocabulary appears and how strongly. */
export const detectEmotion = (text) => {
  const normalized = String(text || '').toLowerCase()
  const found = []
  Object.entries(EMOTION_LEXICON).forEach(([emotion, words]) => {
    const hits = words.filter((w) => normalized.includes(w)).length
    if (hits > 0) found.push({ emotion, hits })
  })
  found.sort((a, b) => b.hits - a.hits)
  const primary = found[0]?.emotion || 'neutral'
  const secondary = found.slice(1, 3).map((f) => f.emotion)
  const intensity = found[0] ? Math.min(1, found[0].hits / 3) : 0
  return { primary, secondary, intensity: Number(intensity.toFixed(2)) }
}

/** Topic / semantic signals: what the message seems to be about. */
export const detectTopics = (text) => {
  const normalized = String(text || '').toLowerCase()
  const found = []
  Object.entries(TOPIC_LEXICON).forEach(([topic, words]) => {
    const hits = words.filter((w) => normalized.includes(w)).length
    if (hits > 0) found.push({ topic, hits })
  })
  found.sort((a, b) => b.hits - a.hits)
  return {
    primary: found[0]?.topic || 'General',
    secondary: found.slice(1, 3).map((f) => f.topic),
    confidence: found[0] ? Math.min(0.9, 0.4 + found[0].hits * 0.15) : 0.3,
  }
}

/** Full analysis bundle used by the companion and the sentiment demonstration. */
export const analyze = (text) => {
  const sentiment = analyzeSentiment(text)
  const emotion = detectEmotion(text)
  const topics = detectTopics(text)
  const crisis = checkCrisis(text)
  return { sentiment, emotion, topics, crisis }
}

/* ------------------------------- safety ---------------------------------- */

const CRISIS_PHRASES = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'want to be dead',
  'hurt myself', 'harm myself', 'self harm', 'self-harm', 'cut myself', 'overdose',
  'better off dead', 'no reason to live', 'cant go on', "can't go on", 'end it all',
  'take my life', 'jump off', 'hang myself', 'atma hatya', 'aatma hatya', 'kill me',
]

/**
 * Deterministic safety-language check. Always runs before anything else and
 * never depends on a fuzzy score: if this returns true the safety pathway opens.
 */
export const checkCrisis = (text) => {
  const normalized = String(text || '').toLowerCase()
  const detected = CRISIS_PHRASES.find((phrase) => normalized.includes(phrase))
  return {
    isCrisis: Boolean(detected),
    phrase: detected || null,
    severity: detected ? 'high' : 'none',
  }
}
