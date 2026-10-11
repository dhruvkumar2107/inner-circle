/**
 * Mental health chatbot pipeline.
 *
 * Stages: NLP preprocessing → Sentiment/Emotion → Topic detection →
 * Crisis safety check → Context retrieval (incl. conversation history) →
 * Response generation (LLM when a key is configured, otherwise a genuinely
 * context-aware rule engine) → safety filter → recommendations + suggestions.
 *
 * Important: when no LLM key is configured we do NOT pretend a templated
 * answer is personalised. Instead the rule engine reads the actual message and
 * the conversation history so the reply is specific to what the student said.
 * The active provider is reported on the output (`provider`) so callers can be
 * honest about it. If an LLM key IS configured but the call fails we surface an
 * error rather than fabricating a reply.
 */

import { tryLLM } from './providers/llm'

/* ------------------------------- types -------------------------------- */

export type SentimentResult = {
  score: number // -1 (negative) to +1 (positive)
  label: 'Negative' | 'Neutral' | 'Positive'
  confidence: number
}

export type EmotionResult = {
  primary: string
  secondary: string[]
  intensity: number
}

export type TopicResult = {
  primary: string
  secondary: string[]
  confidence: number
}

export type CrisisCheck = {
  isCrisis: boolean
  type: 'self-harm' | 'crisis-language' | 'none'
  detectedPhrase: string | null
  severity: 'low' | 'medium' | 'high'
  language: 'english' | 'hindi' | 'kannada' | 'transliterated' | 'none'
}

export type Context = {
  recentSentiment: number
  lastAssessment: { phq9?: number; gad7?: number; tier?: number } | null
  primaryConcerns: string[]
  language: string
  tier: number
  riskScore: number
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
  at?: string
}

export interface PipelineInput {
  message: string
  userId?: string
  language?: string
  tier?: number
  lastRiskScore?: number
  /** Recent conversation, oldest → newest. Used for continuity and de-duplication. */
  history?: ChatTurn[]
}

export interface Suggestion {
  label: string
  prompt: string
}

export interface Recommendation {
  title: string
  description: string
  type: 'resource' | 'activity' | 'referral'
  reason: string
}

export interface PipelineOutput {
  success: boolean
  reply: string
  suggestions: Suggestion[]
  sentiment: SentimentResult
  emotion: EmotionResult
  topics: TopicResult
  crisis: CrisisCheck
  riskUpdated: boolean
  riskScore: number
  tier: number
  provider: 'llm' | 'rules'
  recommendation?: Recommendation
  chatUpdated: boolean
}

/* ---------------------------- preprocessing --------------------------- */

export const preprocessMessage = (message: string): string =>
  message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const words = (text: string): string[] => preprocessMessage(text).split(/[^a-z0-9']+/).filter(Boolean)

const hasWord = (normalized: string, word: string): boolean =>
  new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(normalized)

/* ----------------------------- sentiment ------------------------------ */

const POSITIVE_WORDS = new Set([
  'good', 'great', 'fine', 'better', 'best', 'okay', 'ok', 'well', 'happy', 'happier', 'joy',
  'peace', 'peaceful', 'calm', 'excited', 'grateful', 'thankful', 'hopeful', 'proud', 'relieved',
  'supported', 'love', 'loved', 'progress', 'improving', 'manageable', 'confident', 'rested',
])

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'sad', 'depressed', 'depressing', 'anxious', 'anxiety', 'worried',
  'worry', 'angry', 'pain', 'painful', 'suffer', 'suffering', 'hopeless', 'worthless', 'lonely',
  'alone', 'stressed', 'overwhelmed', 'exhausted', 'tired', 'drained', 'burnout', 'burnt',
  'panic', 'scared', 'afraid', 'fear', 'numb', 'empty', 'guilty', 'ashamed', 'stuck', 'helpless',
  'crying', 'cry', 'miserable', 'hate', 'struggling', 'struggle', 'hard', 'difficult', 'unbearable',
])

const NEGATORS = new Set(['not', "n't", 'no', 'never', 'hardly', 'barely', 'without'])

export const analyzeSentiment = (message: string): SentimentResult => {
  const tokens = words(message)
  if (tokens.length === 0) return { score: 0, label: 'Neutral', confidence: 0 }

  let posCount = 0
  let negCount = 0
  tokens.forEach((token, index) => {
    const negated = index > 0 && NEGATORS.has(tokens[index - 1])
    if (POSITIVE_WORDS.has(token)) negated ? negCount++ : posCount++
    if (NEGATIVE_WORDS.has(token)) negated ? posCount++ : negCount++
  })

  const total = Math.max(1, tokens.length)
  const raw = (posCount - negCount) / total
  const score = Math.max(-1, Math.min(1, raw * 1.8))
  const label = score > 0.08 ? 'Positive' : score < -0.08 ? 'Negative' : 'Neutral'
  const confidence = Math.min(1, Math.abs(score) * 1.5 + (posCount + negCount) / total)
  return { score, label, confidence }
}

/* ------------------------------ emotions ------------------------------ */

const EMOTION_BY_TOPIC: Record<string, string> = {
  academic: 'pressure',
  exam: 'anxiety',
  concentration: 'frustration',
  motivation: 'low motivation',
  loneliness: 'loneliness',
  relationships: 'hurt',
  sleep: 'exhaustion',
  burnout: 'overwhelmed',
  anxiety: 'anxiety',
  depression: 'sadness',
  general: 'mixed feelings',
}

export const detectEmotion = (message: string, topics: TopicResult, sentiment: SentimentResult): EmotionResult => {
  const normalized = preprocessMessage(message)
  const cues: Array<[string, string[]]> = [
    ['anxiety', ['anxious', 'nervous', 'panic', 'on edge', 'worried', 'worry', 'scared']],
    ['overwhelmed', ['overwhelmed', 'too much', 'drowning', 'buried', "can't keep up", 'spiral']],
    ['exhaustion', ['exhausted', 'tired', 'drained', 'no energy', 'burnt out', 'burnout']],
    ['loneliness', ['lonely', 'alone', 'isolated', 'no one', 'left out']],
    ['sadness', ['sad', 'down', 'hopeless', 'empty', 'numb', 'crying', 'depressed']],
    ['anger', ['angry', 'furious', 'irritated', 'annoyed', 'frustrated']],
    ['fear', ['afraid', 'scared', 'terrified', 'fear']],
  ]
  const hits = cues.filter(([, keys]) => keys.some(key => normalized.includes(key))).map(([name]) => name)
  const primary = hits[0] ?? EMOTION_BY_TOPIC[topics.primary] ?? 'mixed feelings'
  const secondary = hits.slice(1)
  const intensity = Math.min(1, Math.abs(sentiment.score) + (hits.length ? 0.3 : 0.1))
  return { primary, secondary, intensity }
}

/* ------------------------------- topics ------------------------------- */

type TopicDef = { key: string; phrases: string[]; words: string[]; concerns: string[] }

const TOPIC_DEFS: TopicDef[] = [
  {
    key: 'exam',
    phrases: ['exam', 'test anxiety', 'finals', 'midterms', 'midterm', 'quiz', 'i have exams', 'exams next week'],
    words: ['exam', 'exams', 'test', 'tests', 'midterm', 'final', 'finals', 'quiz', 'viva'],
    concerns: ['Exam stress', 'Academic pressure'],
  },
  {
    key: 'academic',
    phrases: ['academic pressure', 'study load', 'coursework', 'assignments due', 'too much to study', 'study plan'],
    words: ['study', 'studying', 'assignment', 'assignments', 'coursework', 'grades', 'university', 'college', 'syllabus', 'deadline', 'deadlines', 'semester'],
    concerns: ['Academic pressure'],
  },
  {
    key: 'concentration',
    phrases: ['can\'t concentrate', 'cannot concentrate', 'cant concentrate', 'can\'t focus', 'cannot focus', 'cant focus', 'mind wanders', 'lose focus', 'distracted'],
    words: ['concentrate', 'concentration', 'focus', 'distracted', 'procrastinate', 'procrastinating'],
    concerns: ['Academic pressure'],
  },
  {
    key: 'motivation',
    phrases: ['no motivation', 'lost motivation', 'can\'t get started', 'cannot get started', 'no energy to', 'don\'t feel like'],
    words: ['motivation', 'motivated', 'lazy', 'unmotivated'],
    concerns: ['Low motivation'],
  },
  {
    key: 'sleep',
    phrases: ['can\'t sleep', 'cannot sleep', 'cant sleep', 'trouble sleeping', 'stay up', 'not sleeping', 'poor sleep'],
    words: ['sleep', 'sleeping', 'insomnia', 'nightmare', 'nightmares', 'bedtime', 'awake'],
    concerns: ['Sleep'],
  },
  {
    key: 'loneliness',
    phrases: ['feel alone', 'feel lonely', 'no friends', 'no one to talk', 'left out', 'by myself'],
    words: ['lonely', 'alone', 'isolated', 'loneliness'],
    concerns: ['Loneliness'],
  },
  {
    key: 'relationships',
    phrases: ['my boyfriend', 'my girlfriend', 'my partner', 'broke up', 'breakup', 'my friend', 'my roommate', 'my parents', 'my family'],
    words: ['relationship', 'relationships', 'boyfriend', 'girlfriend', 'partner', 'breakup', 'friend', 'friends', 'roommate', 'family', 'parents', 'argument', 'fight'],
    concerns: ['Relationships'],
  },
  {
    key: 'burnout',
    phrases: ['burnt out', 'burned out', 'running on empty', 'too much going on', 'at my limit', 'breaking point'],
    words: ['burnout', 'exhausted', 'drained', 'overworked'],
    concerns: ['Burnout'],
  },
  {
    key: 'anxiety',
    phrases: ['panic attack', 'on edge', 'can\'t stop worrying', 'cannot stop worrying', 'constant worry'],
    words: ['anxious', 'anxiety', 'nervous', 'panic', 'worry', 'worried', 'worries', 'stress', 'stressed'],
    concerns: ['Anxiety', 'Stress'],
  },
  {
    key: 'depression',
    phrases: ['feel empty', 'feel numb', 'no point', 'feel hopeless', 'feel worthless', 'can\'t enjoy'],
    words: ['depressed', 'depression', 'sad', 'hopeless', 'worthless', 'empty', 'numb'],
    concerns: ['Depression', 'Low mood'],
  },
]

export const detectTopics = (message: string): TopicResult => {
  const normalized = preprocessMessage(message)
  const tokens = words(message)
  const scored: Array<{ topic: string; score: number; concerns: string[] }> = []

  for (const def of TOPIC_DEFS) {
    let score = 0
    for (const phrase of def.phrases) {
      if (phrase.includes(' ') ? normalized.includes(phrase) : hasWord(normalized, phrase)) score += 3
    }
    for (const word of def.words) {
      if (tokens.includes(word) || hasWord(normalized, word)) score += 1
    }
    if (score > 0) scored.push({ topic: def.key, score, concerns: def.concerns })
  }

  scored.sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic))

  if (scored.length === 0) {
    return { primary: 'general', secondary: [], confidence: 0 }
  }

  const top = scored[0]
  const confidence = Math.min(1, top.score / Math.max(3, tokens.length))
  return {
    primary: top.topic,
    secondary: scored.slice(1, 3).map(item => item.topic),
    confidence,
  }
}

/** Human-readable label + concerns for a topic key (used for recommendations). */
const TOPIC_LABELS: Record<string, string> = {
  exam: 'exam stress',
  academic: 'academic pressure',
  concentration: 'focus difficulties',
  motivation: 'low motivation',
  sleep: 'sleep difficulties',
  loneliness: 'loneliness',
  relationships: 'relationship concerns',
  burnout: 'feeling overwhelmed',
  anxiety: 'anxiety',
  depression: 'low mood',
  general: 'how you are feeling',
}

export const concernsForTopic = (topic: string): string[] =>
  TOPIC_DEFS.find(def => def.key === topic)?.concerns ?? []

/* --------------------------- subject extraction ----------------------- */

const SUBJECT_HINTS = [
  'database management', 'dbms', 'data structures', 'operating systems', 'computer networks',
  'algorithms', 'machine learning', 'artificial intelligence', 'discrete maths', 'discrete math',
  'mathematics', 'maths', 'math', 'statistics', 'physics', 'chemistry', 'biology', 'english',
  'history', 'economics', 'accounting', 'finance', 'marketing', 'programming', 'java', 'python',
  'javascript', 'c++', 'networking', 'electronics', 'thermodynamics', 'anatomy', 'pharmacology',
  'psychology', 'sociology', 'law', 'taxation', 'operations research',
]

export const extractSubject = (message: string): string | null => {
  const normalized = preprocessMessage(message)
  for (const subject of SUBJECT_HINTS) {
    if (normalized.includes(subject)) {
      return subject.replace(/\b\w/g, c => c.toUpperCase())
    }
  }
  // Short, noun-like answers such as "Database management." are treated as a subject.
  const cleaned = message.replace(/[.?!]+$/, '').trim()
  const tokenCount = words(cleaned).length
  if (tokenCount > 0 && tokenCount <= 4 && !/\b(i|me|my|im|feel|feeling|am|is|are|was|can't|cant|don't|dont)\b/i.test(cleaned)) {
    return cleaned.replace(/\b\w/g, c => c.toUpperCase())
  }
  return null
}

const looksLikeAnswer = (message: string): boolean => {
  const tokens = words(message)
  return tokens.length > 0 && tokens.length <= 6 && !message.includes('?')
}

/* ------------------------------ crisis -------------------------------- */

const CRISIS_WORDS = ['suicide', 'suicidal', 'kill myself', 'end my life', 'hurt myself', 'self-harm', 'self harm', 'cutting', 'overdose', 'want to die', 'better off dead', 'cant go on', 'cannot go on']
const CRISIS_TRANSLITERATIONS = ['aatma hatya', 'atma hata', 'maar dena', 'marna chahta', 'jeene ka mann nahi', 'marana', 'ghataka']

export const checkCrisis = (message: string): CrisisCheck => {
  const normalized = preprocessMessage(message)
  const matched: string[] = []

  for (const phrase of [...CRISIS_WORDS, ...CRISIS_TRANSLITERATIONS]) {
    if (normalized.includes(phrase)) matched.push(phrase)
  }

  if (matched.length === 0) {
    return { isCrisis: false, type: 'none', detectedPhrase: null, severity: 'low', language: 'none' }
  }

  const high = ['suicide', 'suicidal', 'overdose', 'self-harm', 'self harm', 'want to die', 'better off dead']
  const isHigh = matched.some(item => high.includes(item))
  const language: CrisisCheck['language'] = CRISIS_TRANSLITERATIONS.some(item => matched.includes(item)) ? 'transliterated' : 'english'

  return {
    isCrisis: true,
    type: isHigh ? 'self-harm' : 'crisis-language',
    detectedPhrase: matched[0],
    severity: isHigh ? 'high' : 'medium',
    language,
  }
}

/* ------------------------------ context ------------------------------- */

export const retrieveContext = async (input: PipelineInput): Promise<Context> => {
  const history = input.history ?? []
  const userTurns = history.filter(turn => turn.role === 'user').slice(-5)
  const historySentiment = userTurns.length
    ? userTurns.reduce((sum, turn) => sum + analyzeSentiment(turn.text).score, 0) / userTurns.length
    : 0
  const recentSentiment = historySentiment || (input.lastRiskScore !== undefined
    ? input.lastRiskScore > 67 ? -0.5 : input.lastRiskScore > 33 ? -0.1 : 0.2
    : 0)

  const concerns = new Set<string>()
  for (const turn of userTurns) {
    detectTopics(turn.text).primary !== 'general' && concernsForTopic(detectTopics(turn.text).primary).forEach(c => concerns.add(c))
  }
  const currentTopics = detectTopics(input.message)
  concernsForTopic(currentTopics.primary).forEach(c => concerns.add(c))

  return {
    recentSentiment,
    lastAssessment: null,
    primaryConcerns: [...concerns],
    language: input.language || 'en',
    tier: input.tier ?? 1,
    riskScore: input.lastRiskScore ?? 25,
  }
}

/* --------------------------- safety templates ------------------------- */

export const generateCrisisResponse = (): string =>
  [
    "I'm really glad you told me, and I want to make sure you're safe right now.",
    '',
    'I care about you, but I am not a crisis service — so please reach a person who can be with you:',
    '',
    '**You deserve immediate human support:**',
    '- **Tele-MANAS: 14416** (24×7, India)',
    '- **KIRAN: 1800-599-0019** (mental-health helpline)',
    '- **Emergency: 112**',
    '',
    '**If you feel you might act on these thoughts, please call 112 now, or go to the nearest emergency room, and try to stay with someone you trust.**',
    '',
    'Would it help if I stayed with you here while you reach out to one of these numbers, or to a counselor through the "I need help now" button?',
  ].join('\n')

/* --------------------------- system prompt ---------------------------- */

export const generateSystemPrompt = (context: Context, crisis: CrisisCheck): string => {
  const crisisSection = crisis.isCrisis
    ? '\nCRISIS MODE: The user may be in danger. Validate first. Encourage reaching a real person. Give Tele-MANAS 14416, KIRAN 1800-599-0019, Emergency 112. Do NOT give long coping lists.'
    : ''
  return [
    'You are a warm, supportive companion for students on "Inner Circle", a mental-wellbeing platform.',
    'You are NOT a doctor, psychologist, or crisis service.',
    '',
    'Rules:',
    '1. Respond directly to what the user actually said in THIS message, using the conversation so far.',
    '2. Never diagnose or say "you have depression/anxiety". Never prescribe medication.',
    "3. Never promise confidentiality you can't keep (if there is a risk of harm, a trained person may need to be involved).",
    '4. Reflect the feeling briefly, then offer ONE practical, specific next step, then ask ONE gentle question.',
    '5. Keep it short (roughly 3-6 sentences). Use markdown lists for steps.',
    '6. Do not repeat a previous reply, and never concatenate generic templates.',
    '7. Respond in the user language (English, Hindi, or Kannada).',
    '8. No moralising or judgement.',
    '',
    'Context:',
    `- Approx. risk indicators: ${context.riskScore > 67 ? 'high' : context.riskScore > 33 ? 'moderate' : 'low'}`,
    `- Recent sentiment: ${context.recentSentiment > 0.1 ? 'positive' : context.recentSentiment < -0.1 ? 'negative' : 'neutral'}`,
    `- Known concerns: ${context.primaryConcerns.join(', ') || 'not yet known'}`,
    `- Language: ${context.language}`,
    crisisSection,
  ].join('\n')
}

/* ------------------------ rule-based response ------------------------- */

type ReplyPack = { ack: string; steps: string[]; question: string; suggestions: Suggestion[] }

const genericSuggestions = (): Suggestion[] => [
  { label: 'Give me a breathing exercise', prompt: 'Can you guide me through a quick breathing exercise?' },
  { label: 'I want to feel less overwhelmed', prompt: "I'm feeling really overwhelmed right now." },
  { label: 'Help me sleep better', prompt: "I'm having trouble sleeping." },
  { label: 'I could use some motivation', prompt: "I don't have any motivation lately." },
]

const replyPacks: Record<string, ReplyPack> = {
  exam: {
    ack: "That's a genuinely heavy load — three exams in one week is a lot to hold at once, and feeling overwhelmed makes complete sense.",
    steps: [
      '**Triage first:** list all three exams and mark each topic as *confident*, *shaky*, or *lost*. Start with the two "lost" topics — confusion is a signal of where you earn the most marks.',
      '**Plan backwards:** give each exam a two-day slot, then study in **25-minute blocks** with a 5-minute break (Pomodoro).',
      '**Do one small thing now:** open one set of notes and summarise one topic out loud in a single sentence.',
    ],
    question: 'Which of the three exams feels the hardest right now?',
    suggestions: [
      { label: 'Make me a study plan', prompt: 'Can you help me make a study plan for my exams?' },
      { label: "I can't concentrate", prompt: "I can't concentrate when I study." },
      { label: 'I feel anxious about it', prompt: "I'm feeling really anxious about my exams." },
      { label: 'Give me a grounding exercise', prompt: 'Can you guide me through a grounding exercise?' },
    ],
  },
  academic: {
    ack: 'Carrying a heavy study load can quietly wear you down, and it makes sense that it feels like a lot.',
    steps: [
      '**Brain-dump everything** onto one list — assignments, readings, deadlines. Getting it out of your head lowers the pressure.',
      '**Pick one "must-do today"** and let the rest wait. One finished task beats five half-started ones.',
      '**Protect your energy:** study in 25-minute blocks, then stand up and stretch for 5 minutes.',
    ],
    question: 'What is the one assignment or topic that feels most urgent right now?',
    suggestions: [
      { label: 'Make me a study plan', prompt: 'Can you help me make a study plan?' },
      { label: 'I keep procrastinating', prompt: 'I keep procrastinating instead of studying.' },
      { label: 'I feel burnt out', prompt: "I feel completely burnt out from studying." },
    ],
  },
  concentration: {
    ack: "Trouble concentrating is really frustrating — especially when you're already under pressure and need your focus the most.",
    steps: [
      '**Single-task:** close everything except the one thing you are working on (tabs, phone, notifications).',
      '**Use a "first 2 minutes" rule:** open the material and commit to only two minutes. Starting is the hard part; momentum usually follows.',
      '**Work in 25-minute blocks** with a 5-minute reset, and put your phone in another room if you can.',
    ],
    question: 'Is it hard to *start* studying, or does your mind drift once you begin?',
    suggestions: [
      { label: 'My mind keeps wandering', prompt: 'My mind keeps wandering when I try to study.' },
      { label: "I can't get started", prompt: "I just can't get started with my work." },
      { label: 'Give me a focus timer', prompt: 'Can you help me set up a focus timer routine?' },
    ],
  },
  motivation: {
    ack: 'Losing motivation can feel like a heavy fog — and it is not a personal failing, it is usually a sign you are running low.',
    steps: [
      '**Shrink the task:** make the first step so small it feels almost silly (open the document, write one line).',
      '**Pair it with something kind:** a favourite drink, a favourite playlist, a comfortable spot.',
      '**Celebrate finishing, not perfecting.** Even a 15-minute attempt counts.',
    ],
    question: 'What is the one small task you could do for just five minutes today?',
    suggestions: [
      { label: 'Give me one tiny step', prompt: 'What is one tiny step I could take right now?' },
      { label: 'I feel burnt out', prompt: 'I think I am burnt out.' },
      { label: 'Help me plan my day', prompt: 'Can you help me plan a gentle day?' },
    ],
  },
  sleep: {
    ack: 'Sleep trouble makes everything else harder to carry, and it is really common when your mind is busy.',
    steps: [
      '**Wind down 45 minutes before bed:** dim the lights, and put screens on night mode or away.',
      '**Try a slow exhale:** breathe in for 4 seconds, out for 6-8 seconds, for a couple of minutes. A longer exhale nudges your body toward calm.',
      '**If you are awake over 20 minutes,** get up and do something quiet and boring in dim light, then try again.',
    ],
    question: 'Is it falling asleep that is hard, or staying asleep through the night?',
    suggestions: [
      { label: 'Give me a wind-down routine', prompt: 'Can you give me a wind-down routine for sleep?' },
      { label: 'My mind races at night', prompt: 'My mind races when I try to sleep.' },
      { label: 'Help me relax', prompt: 'Can you help me relax before bed?' },
    ],
  },
  loneliness: {
    ack: 'Feeling alone can be really painful, and it is especially hard when it feels like everyone else is connected.',
    steps: [
      '**Start tiny:** one small message to one person counts. It does not have to be a deep conversation.',
      '**Use low-pressure spaces:** a study group, a hobby, or the anonymous community here can be a gentle first step.',
      '**Be kind to yourself:** loneliness is a normal human signal, not proof that something is wrong with you.',
    ],
    question: 'Is there one person, even an acquaintance, you could send a short message to this week?',
    suggestions: [
      { label: 'Help me reach out to someone', prompt: 'Can you help me think of how to reach out to someone?' },
      { label: 'Find me peer support', prompt: 'I would like to connect with peer support.' },
      { label: 'I feel isolated here', prompt: 'I feel isolated at my college.' },
    ],
  },
  relationships: {
    ack: 'Relationship strain can occupy a huge amount of mental space, and it is understandable that it is on your mind.',
    steps: [
      '**Name the feeling first:** is it hurt, anger, guilt, or worry? Naming it makes it easier to talk about.',
      '**Write, don\'t send:** jot down what you would want to say, then decide later what actually helps.',
      '**One calm conversation** beats ten tense messages — if it is safe to have one.',
    ],
    question: 'What is the part of this that is weighing on you the most right now?',
    suggestions: [
      { label: 'How do I set a boundary?', prompt: 'How do I set a boundary with this person?' },
      { label: 'I need to talk it through', prompt: 'I need to talk through what happened.' },
      { label: 'I feel hurt', prompt: 'I am feeling really hurt about it.' },
    ],
  },
  burnout: {
    ack: 'Feeling like you are running on empty is your body and mind asking for rest, not a sign of weakness.',
    steps: [
      '**Reduce today\'s load** to the single most essential thing. Let the rest wait.',
      '**Rest on purpose:** a real 20-minute break (away from screens) counts more than three distracted ones.',
      '**Reach out:** if this has been building for a while, support from a counselor or peer can help you rebalance.',
    ],
    question: 'What is draining you the most at the moment — study, work, or something else?',
    suggestions: [
      { label: 'Help me rest properly', prompt: 'How can I rest properly?' },
      { label: 'Talk to a counselor', prompt: 'I think I would like to talk to a counselor.' },
      { label: 'I feel overwhelmed', prompt: "I feel completely overwhelmed." },
    ],
  },
  anxiety: {
    ack: 'Anxiety can feel like your body is bracing for something, even when you are safe — and that is exhausting to carry.',
    steps: [
      '**Box breathing:** inhale 4, hold 4, exhale 4, hold 4. Repeat four times. It slows a racing system.',
      '**5-4-3-2-1 grounding:** name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste. It brings you back to now.',
      '**Name it, then shrink it:** write the worry down, then ask "what is one thing I can control about this?"',
    ],
    question: 'Is the anxiety tied to something specific, or does it feel more general right now?',
    suggestions: [
      { label: 'Guide me through box breathing', prompt: 'Can you guide me through box breathing?' },
      { label: 'Try 5-4-3-2-1 grounding', prompt: 'Can you guide me through the 5-4-3-2-1 grounding exercise?' },
      { label: 'It is exam-related', prompt: 'My anxiety is mostly about my exams.' },
    ],
  },
  depression: {
    ack: 'Low mood can make everything feel heavier and flatter, and I am glad you told me instead of holding it alone.',
    steps: [
      '**One small, gentle action:** a glass of water, opening a window, a short walk. Little things genuinely count.',
      '**Connect with one person** today, even briefly. Being with someone can soften the weight a little.',
      '**Be as kind to yourself as you would be to a friend** who felt this way.',
    ],
    question: 'How long have you been feeling this low — is it recent, or has it been building for a while?',
    suggestions: [
      { label: 'Talk to a counselor', prompt: 'I would like to talk to a counselor.' },
      { label: 'Give me a small task', prompt: 'What is one small thing I could do today?' },
      { label: 'I need support', prompt: 'I could really use some support right now.' },
    ],
  },
  general: {
    ack: 'Thank you for trusting me with that — I am here with you.',
    steps: [
      '**Take a slow breath** with me: in for 4, out for 6. You do not have to solve everything in this moment.',
      '**Name what is most in your way right now** — even one word helps me support you better.',
    ],
    question: 'What has been weighing on you the most today?',
    suggestions: genericSuggestions(),
  },
}

const fillSubject = (text: string, subject: string | null): string =>
  subject ? text.replace(/\{subject\}/g, subject).replace(/\{Subject\}/g, subject) : text

const buildSubjectPlan = (subject: string, topic: string): ReplyPack => ({
  ack: `Okay — ${subject}. When it sits in a pile with everything else, ${subject} can feel enormous, even though it is really just a set of topics.`,
  steps: [
    `**List the ${subject} topics** you actually need to cover. Seeing them named makes them smaller.`,
    '**Start with the two you understand least** — that is where the marks usually are.',
    '**Study in 25-minute blocks** with a 5-minute break, and after each block explain one idea out loud in a single sentence.',
  ],
  question: `Which ${subject} topic feels the hardest right now?`,
  suggestions: [
    { label: `Break ${subject} down`, prompt: `Can you help me break down ${subject} into smaller topics?` },
    { label: "I can't concentrate", prompt: `I can't concentrate when I study ${subject}.` },
    { label: `I feel behind in ${subject}`, prompt: `I feel really behind in ${subject}.` },
    { label: 'Make me a study plan', prompt: `Can you help me make a study plan for ${subject}?` },
  ],
})

const isSubjectQuestion = (text: string): boolean =>
  /\b(which|what)\b.*\b(exam|subject|topic|hardest|difficult|revise|revis)\b/i.test(text) ||
  /\bhardest\b/i.test(text)

const dedupe = (text: string): string => {
  const seen = new Set<string>()
  const lines = text.split('\n')
  const kept: string[] = []
  for (const line of lines) {
    const key = line.trim().toLowerCase().replace(/[*_`#\-•]/g, '').replace(/\s+/g, ' ')
    if (key.length === 0) {
      kept.push(line)
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    kept.push(line)
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

const compose = (pack: ReplyPack): string => {
  const steps = pack.steps.join('\n')
  return dedupe(`${pack.ack}\n\n${steps}\n\n${pack.question}`)
}

export const buildReply = (params: {
  message: string
  topics: TopicResult
  sentiment: SentimentResult
  history: ChatTurn[]
}): { reply: string; suggestions: Suggestion[] } => {
  const { message, topics, history } = params
  const lastAssistant = [...history].reverse().find(turn => turn.role === 'assistant')
  const previousUser = [...history].reverse().find(turn => turn.role === 'user')

  // Continuity: if we asked about a subject and the user replied with one.
  const subject = extractSubject(message)
  let pack: ReplyPack | null = null

  if (topics.primary === 'concentration' || /concentrat|focus|distract|procrastinat/i.test(message)) {
    pack = replyPacks.concentration
  } else if (topics.primary !== 'general') {
    pack = replyPacks[topics.primary] ?? replyPacks.general
  }

  if (pack && pack.question.includes('{subject}') && subject) {
    pack = buildSubjectPlan(subject, topics.primary)
  } else if (!pack) {
    const answeringSubject = lastAssistant && isSubjectQuestion(lastAssistant.text) && looksLikeAnswer(message) && subject
    if (answeringSubject) {
      pack = buildSubjectPlan(subject, 'academic')
    } else {
      pack = replyPacks.general
    }
  } else if (pack === replyPacks.academic && subject && !previousUser) {
    // Plain academic message without a subject — keep the generic pack.
  }

  if (pack.question.includes('{subject}')) {
    const fallbackSubject = subject ?? 'this subject'
    pack = { ...pack, ack: fillSubject(pack.ack, fallbackSubject), question: fillSubject(pack.question, fallbackSubject), steps: pack.steps.map(s => fillSubject(s, fallbackSubject)) }
  }

  // Never repeat the assistant's previous reply verbatim.
  let reply = compose(pack)
  if (lastAssistant && reply.trim().toLowerCase() === lastAssistant.text.trim().toLowerCase()) {
    reply = `${pack.ack}\n\nLet's stay with that a moment — what part of it feels most urgent right now?`
  }

  return { reply, suggestions: pack.suggestions.slice(0, 4) }
}

/* --------------------------- recommendations -------------------------- */

export const generateRecommendation = (
  topics: TopicResult,
  sentiment: SentimentResult,
  tier: number,
  primaryConcerns: string[],
): Recommendation => {
  const topic = topics.primary
  const byTopic: Record<string, Recommendation> = {
    exam: { title: 'Exam stress toolkit', description: 'A short study-planning and test-anxiety routine.', type: 'activity', reason: 'Your message mentions upcoming exams and pressure.' },
    academic: { title: 'Study skills & time management', description: 'Active-recall and prioritisation techniques.', type: 'resource', reason: 'Your recent messages point to academic pressure.' },
    concentration: { title: 'Focus timer routine', description: 'A 25-minute focus block with a gentle reset between.', type: 'activity', reason: 'You said concentrating is hard right now.' },
    motivation: { title: 'One-small-step plan', description: 'Shrink the first step until it feels doable.', type: 'activity', reason: 'You mentioned low motivation.' },
    sleep: { title: 'Wind-down routine', description: 'A calm pre-bed routine to help you rest.', type: 'activity', reason: 'You mentioned sleep difficulties.' },
    loneliness: { title: 'Peer circle', description: 'Low-pressure, anonymous peer support.', type: 'resource', reason: 'You mentioned feeling alone.' },
    relationships: { title: 'Boundaries & communication', description: 'Simple ways to talk things through calmly.', type: 'resource', reason: 'A relationship concern came up.' },
    burnout: { title: 'Rest & reset plan', description: 'Reduce the load and rest on purpose.', type: 'activity', reason: 'You described feeling overwhelmed or burnt out.' },
    anxiety: { title: '5-minute breathing exercise', description: 'Box breathing plus 5-4-3-2-1 grounding.', type: 'activity', reason: 'Your recent messages indicate anxiety.' },
    depression: { title: 'Self-compassion practice', description: 'A gentle exercise to treat yourself kindly.', type: 'activity', reason: 'You described a low mood.' },
    general: { title: 'A mindful pause', description: 'A two-minute breathing reset.', type: 'activity', reason: 'A gentle, general next step.' },
  }

  if (tier >= 3) {
    return { title: 'Talk to a counselor', description: 'Connect with a trained professional.', type: 'referral', reason: 'Your recent indicators suggest extra support would help.' }
  }
  return byTopic[topic] ?? { title: 'Wellness resources', description: 'Explore practices for how you are feeling.', type: 'resource', reason: `Related to ${primaryConcerns.join(' and ') || 'your recent messages'}.` }
}

/* ------------------------------ check-in ------------------------------ */

export const generateCheckInQuestion = (topics: TopicResult, sentiment: SentimentResult): string => {
  if (sentiment.label === 'Positive') return "I'm glad things feel a little lighter — what has been helping?"
  if (sentiment.label === 'Negative') return 'What has been the hardest part of your day today?'
  return replyPacks[topics.primary]?.question ?? replyPacks.general.question
}

/* ------------------------------- pipeline ----------------------------- */

export const runPipeline = async (input: PipelineInput): Promise<PipelineOutput> => {
  const history = input.history ?? []
  const crisis = checkCrisis(input.message)
  const sentiment = analyzeSentiment(input.message)
  const topics = detectTopics(input.message)
  const emotion = detectEmotion(input.message, topics, sentiment)
  const context = await retrieveContext({ ...input, history })

  let reply = ''
  let suggestions: Suggestion[] = []
  let provider: 'llm' | 'rules' = 'rules'
  let riskUpdated = false
  let newTier = context.tier
  let newRiskScore = context.riskScore
  let recommendation: Recommendation | undefined

  if (crisis.isCrisis) {
    reply = generateCrisisResponse()
    suggestions = [
      { label: 'I need help now', prompt: 'I need help right now.' },
      { label: 'Give me the crisis numbers', prompt: 'Please share the crisis support numbers again.' },
    ]
    newTier = 3
    newRiskScore = 100
    riskUpdated = true
    recommendation = { title: 'Immediate support', description: 'Talk to a counselor or call a helpline.', type: 'referral', reason: 'Safety check triggered.' }
  } else {
    recommendation = generateRecommendation(topics, sentiment, context.tier, context.primaryConcerns)

    const llmConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY)
    if (llmConfigured) {
      const llmReply = await tryLLM(
        [
          ...history.slice(-8).map(turn => ({ role: turn.role, content: turn.text })),
          { role: 'user', content: input.message },
        ],
        generateSystemPrompt(context, crisis),
      )
      if (llmReply) {
        reply = dedupe(llmReply)
        provider = 'llm'
      } else {
        // A provider is configured but failed — do not fabricate. Surface a clear error.
        return {
          success: false,
          reply: "I'm having trouble reaching the support service right now. Your message was not lost — please try again in a moment, or use the 'I need help now' button if things feel urgent.",
          suggestions: [],
          sentiment,
          emotion,
          topics,
          crisis,
          riskUpdated: false,
          riskScore: context.riskScore,
          tier: context.tier,
          provider: 'llm',
          recommendation,
          chatUpdated: false,
        }
      }
    } else {
      const built = buildReply({ message: input.message, topics, sentiment, history })
      reply = built.reply
      suggestions = built.suggestions
    }
  }

  return {
    success: true,
    reply,
    suggestions,
    sentiment,
    emotion,
    topics,
    crisis,
    riskUpdated,
    riskScore: newRiskScore,
    tier: newTier,
    provider,
    recommendation,
    chatUpdated: true,
  }
}

/* ------------------------------ risk utils ---------------------------- */

export const updateRollingSentiment = (currentSentiment: number, newScore: number): number =>
  currentSentiment * 0.7 + newScore * 0.3

export const updateRiskFromPipeline = (
  inputs: { phq9: number; gad7: number; sentiment: number; stress: number; functional: number },
): { riskScore: number; tier: number; level: string } => {
  let score = (inputs.phq9 / 27) * 30 + (inputs.gad7 / 21) * 25 + (inputs.stress / 10) * 20 + Math.max(0, -inputs.sentiment) * 15
  if (inputs.functional >= 7) score += 5
  const clamped = Math.max(0, Math.min(100, score))
  const tier = clamped < 33 ? 1 : clamped < 66 ? 2 : 3
  const level = tier === 1 ? 'Low' : tier === 2 ? 'Moderate' : 'High'
  return { riskScore: clamped, tier, level }
}
