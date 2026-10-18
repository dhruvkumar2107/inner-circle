/**
 * The demo response engine behind the AI companion.
 *
 * It reads the conversation's context (topic signals from earlier messages),
 * matches the newest message to a supportive intent and answers with an
 * empathetic reflection plus a genuine choice of next steps — never a forced
 * activity, never a diagnosis, never a promise that everything will be fine.
 *
 * Every user-visible string is a translation key in the `companion` namespace.
 * `generateReply` returns `{ key, vars }` for the reply text (render with
 * `t(key, vars)`), suggestion chips as `{ labelKey, seed }` (render the label
 * with `t(labelKey)`, send `seed` back through the engine) and its suggestion as
 * `{ labelKey, to }`. Clearly labelled "simulated responses" in the interface.
 * To connect a real model later, replace `generateReply` with a call to your
 * backend endpoint (e.g. POST /api/chat) while keeping the same return shape.
 */

import { analyze, checkCrisis, topicKey } from './sentiment.js'

const pick = (list, seed) => list[Math.abs(seed) % list.length]

const INTENTS = [
  {
    key: 'anxious',
    match: ['anxious', 'anxiety', 'panic', 'nervous', 'overthink', 'overthinking', 'worried', 'worry', 'scared', 'afraid', 'dread', 'butterflies', 'on edge'],
    replies: ['companion.replies.anxious.0', 'companion.replies.anxious.1', 'companion.replies.anxious.2'],
    follow: [
      { labelKey: 'companion.prompts.tellMore', seed: 'Tell me more' },
      { labelKey: 'companion.prompts.helpRelax', seed: 'Help me relax' },
    ],
    suggestion: { labelKey: 'companion.suggestions.grounding', to: '/breathe?ex=grounding' },
  },
  {
    key: 'academic',
    match: ['assignment', 'assignments', 'exam', 'exams', 'deadline', 'submission', 'project', 'grades', 'marks', 'study', 'studying', 'syllabus', 'presentation', 'viva', 'semester', 'academic', 'classes', 'attendance', 'lab'],
    replies: ['companion.replies.academic.0', 'companion.replies.academic.1', 'companion.replies.academic.2'],
    follow: [
      { labelKey: 'companion.prompts.organise', seed: 'Help me organise my day' },
      { labelKey: 'companion.prompts.justTalk', seed: 'I just want to talk' },
    ],
    suggestion: { labelKey: 'companion.suggestions.minuteReset', to: '/breathe?ex=minute' },
  },
  {
    key: 'overwhelmed',
    match: ['overwhelmed', 'too much', 'cant cope', "can't cope", 'cant handle', "can't handle", 'breaking point', 'stressed', 'stress', 'pressure', 'buried', 'drowning', 'everything at once'],
    replies: ['companion.replies.overwhelmed.0', 'companion.replies.overwhelmed.1', 'companion.replies.overwhelmed.2'],
    follow: [
      { labelKey: 'companion.prompts.calmDown', seed: 'Help me calm down' },
      { labelKey: 'companion.prompts.needTalk', seed: 'I need to talk' },
    ],
    suggestion: { labelKey: 'companion.suggestions.breathingReset', to: '/breathe?ex=minute' },
  },
  {
    key: 'lonely',
    match: ['lonely', 'loneliness', 'alone', 'isolated', 'no friends', 'left out', 'homesick', 'missing home', 'nobody', 'no one', 'by myself'],
    replies: ['companion.replies.lonely.0', 'companion.replies.lonely.1', 'companion.replies.lonely.2'],
    follow: [
      { labelKey: 'companion.prompts.justTalk', seed: 'I just want to talk' },
      { labelKey: 'companion.prompts.distraction', seed: 'Suggest a distraction' },
    ],
    suggestion: { labelKey: 'companion.suggestions.calmingActivity', to: '/play' },
  },
  {
    key: 'sleep',
    match: ['sleep', 'insomnia', 'awake', 'cant sleep', "can't sleep", 'all night', 'nightmare', 'tired in the morning', 'exhausted', 'dark circles'],
    replies: ['companion.replies.sleep.0', 'companion.replies.sleep.1'],
    follow: [
      { labelKey: 'companion.prompts.helpRelax', seed: 'Help me relax' },
      { labelKey: 'companion.prompts.aboutDay', seed: 'Talk about my day' },
    ],
    suggestion: { labelKey: 'companion.suggestions.boxBreathing', to: '/breathe?ex=box' },
  },
  {
    key: 'low',
    match: [
      'sad', 'depressed', 'down', 'low', 'hopeless', 'empty', 'numb', 'worthless', 'useless',
      'failure', 'failed', 'crying', 'hurt', 'heartbroken', 'give up',
      // distress phrases — checked before the positive intent so negated
      // wording such as "not feeling good" can never select a cheerful reply
      'not feeling good', 'not feeling well', 'not doing well',
      "don't feel good", 'dont feel good', "don't feel okay", 'dont feel okay',
      "don't feel ok", 'dont feel ok', "don't feel well", 'dont feel well',
      'not feeling okay', 'not feeling ok', 'not okay', 'not ok', 'not well',
      'feel bad', 'feeling bad', 'feeling down', 'feeling low', 'feeling sad',
    ],
    replies: ['companion.replies.low.0', 'companion.replies.low.1', 'companion.replies.low.2'],
    follow: [
      { labelKey: 'companion.prompts.understand', seed: 'I want to understand my feelings' },
      { labelKey: 'companion.prompts.somethingCalming', seed: 'Suggest something calming' },
    ],
    suggestion: { labelKey: 'companion.suggestions.quietActivity', to: '/play' },
  },
  {
    key: 'planning',
    match: ['organise', 'organize', 'planning', 'plan', 'schedule', 'motivation', 'motivated', 'procrastinat', 'focus', 'concentrate', 'distracted', 'time management', 'daily'],
    replies: ['companion.replies.planning.0', 'companion.replies.planning.1', 'companion.replies.planning.2'],
    follow: [
      { labelKey: 'companion.prompts.nextStep', seed: 'Help me with the next step' },
      { labelKey: 'companion.prompts.needBreak', seed: 'I need a break instead' },
    ],
    suggestion: { labelKey: 'companion.suggestions.puzzles', to: '/puzzles' },
  },
  {
    key: 'positive',
    match: ['good', 'great', 'better', 'happy', 'passed', 'completed', 'finished', 'proud', 'excited', 'relieved', 'thank', 'awesome', 'went well', 'done with'],
    replies: ['companion.replies.positive.0', 'companion.replies.positive.1', 'companion.replies.positive.2'],
    follow: [
      { labelKey: 'companion.prompts.recordWin', seed: 'Record a tiny win' },
      { labelKey: 'companion.prompts.nothingElse', seed: 'Nothing else, thanks' },
    ],
    suggestion: { labelKey: 'companion.suggestions.recordWin', to: '/mood?wins=1' },
  },
  {
    key: 'smalltalk',
    match: ['hello', 'hi ', 'hey', 'good morning', 'good evening', 'how are you', 'thank you', 'thanks', 'ok thanks', 'bye'],
    replies: ['companion.replies.smalltalk.0', 'companion.replies.smalltalk.1', 'companion.replies.smalltalk.2'],
    follow: [
      { labelKey: 'companion.prompts.feelingAnxious', seed: "I'm feeling anxious" },
      { labelKey: 'companion.prompts.academicPressure', seed: 'I have too much academic pressure' },
    ],
    suggestion: null,
  },
  {
    key: 'about-ai',
    match: ['are you a bot', 'are you real', 'are you human', 'are you a doctor', 'diagnose', 'diagnosis', 'prescribe', 'medicine', 'therapist?', 'ai?'],
    replies: ['companion.replies.aboutAi.0', 'companion.replies.aboutAi.1'],
    follow: [
      { labelKey: 'companion.prompts.professional', seed: 'Show me professional support' },
      { labelKey: 'companion.prompts.somethingElse', seed: 'I want to talk about something else' },
    ],
    suggestion: { labelKey: 'companion.suggestions.professional', to: '/professional' },
  },
]

const FALLBACKS = ['companion.fallbacks.0', 'companion.fallbacks.1', 'companion.fallbacks.2', 'companion.fallbacks.3']

const TOPIC_FALLBACKS = [
  'companion.fallbacks.topic.0',
  'companion.fallbacks.topic.1',
  'companion.fallbacks.topic.2',
  'companion.fallbacks.topic.3',
]

const GENERAL_PROMPTS = [
  { labelKey: 'companion.prompts.wantTalk', seed: 'I want to talk' },
  { labelKey: 'companion.prompts.helpRelax', seed: 'Help me relax' },
]

const CRISIS_REPLY = {
  key: 'companion.crisis.text',
  vars: {},
  prompts: [
    { labelKey: 'companion.prompts.openUrgent', seed: 'Open urgent support' },
    { labelKey: 'companion.prompts.talkMore', seed: 'I want to talk more' },
  ],
  suggestion: { labelKey: 'companion.suggestions.openUrgent', to: '/professional?urgent=1' },
}

const INTENT_NEGATORS = new Set([
  'not', "don't", 'dont', 'never', 'no', "isn't", 'isnt', "wasn't", 'wasnt',
  'cannot', "can't", 'cant', 'hardly', 'without',
])

/**
 * Negation-aware intent matching. A single-word cue preceded by a negator
 * (e.g. "good" in "not feeling good") must not select that intent — the
 * word is describing the *absence* of the feeling, not its presence.
 * Multi-word phrases already encode their own polarity and are matched as-is.
 */
const detectIntent = (message) => {
  const tokens = message.toLowerCase().split(/[^a-z0-9'’\u0900-\u097F\u0C80-\u0CFF]+/).filter(Boolean)
  const lower = ` ${tokens.join(' ')} `
  const negated = (word) => {
    const idx = tokens.indexOf(word)
    if (idx < 0) return false
    return tokens.slice(Math.max(0, idx - 3), idx).some((w) => INTENT_NEGATORS.has(w))
  }
  for (const intent of INTENTS) {
    for (const word of intent.match) {
      if (!lower.includes(word)) continue
      if (!word.includes(' ') && negated(word)) continue
      return intent
    }
  }
  return null
}

const topicMentions = (history) => {
  const topics = history
    .filter((m) => m.role === 'user')
    .map((m) => analyze(m.text).topics.primary)
    .filter((t) => t !== 'General')
  return topics.length ? topics[topics.length - 1] : null
}

/**
 * @param {{ text: string, history?: Array<{role: string, text: string}> }} params
 * @returns {{
 *   key: string,
 *   vars: Record<string, string>,
 *   prompts: Array<{ labelKey: string, seed: string }>,
 *   suggestion: { labelKey: string, to: string } | null,
 *   crisis: boolean,
 *   intent: string,
 * }}
 */
export const generateReply = ({ text, history = [] }) => {
  const crisis = checkCrisis(text)
  if (crisis.isCrisis) {
    return { ...CRISIS_REPLY, crisis: true, intent: 'crisis' }
  }

  const { sentiment } = analyze(text)
  let intent = detectIntent(text)
  const seed = history.filter((m) => m.role === 'user').length
  const earlierTopic = topicMentions(history)

  // Consistency guard: a message that reads negative overall must never get a
  // cheerful "positive" reply, even when a positive-looking word appears
  // (e.g. "everything good in my life is gone").
  if (intent?.key === 'positive' && sentiment.label === 'Negative') {
    intent = INTENTS.find((i) => i.key === 'low')
  }

  if (!intent) {
    if (sentiment.label === 'Negative' && earlierTopic) {
      return {
        key: pick(TOPIC_FALLBACKS, seed),
        vars: { topicKey: topicKey(earlierTopic) },
        prompts: GENERAL_PROMPTS,
        suggestion: null,
        crisis: false,
        intent: 'general',
      }
    }
    return {
      key: pick(FALLBACKS, seed),
      vars: {},
      prompts: GENERAL_PROMPTS,
      suggestion: null,
      crisis: false,
      intent: 'general',
    }
  }

  let key = pick(intent.replies, seed)
  if (intent.key === 'smalltalk' && sentiment.label === 'Negative') {
    key = 'companion.smalltalkNegative'
  }

  return {
    key,
    vars: {},
    prompts: intent.follow || [],
    suggestion: intent.suggestion || null,
    crisis: false,
    intent: intent.key,
  }
}

/** Starter prompts shown before the first message. */
export const QUICK_PROMPTS = [
  { labelKey: 'companion.quick.anxious', seed: "I'm feeling anxious." },
  { labelKey: 'companion.quick.academic', seed: 'I have too much academic pressure.' },
  { labelKey: 'companion.quick.lonely', seed: 'I feel lonely.' },
  { labelKey: 'companion.quick.calm', seed: 'I need help calming down.' },
  { labelKey: 'companion.quick.talk', seed: 'I just want to talk.' },
  { labelKey: 'companion.quick.organise', seed: 'Help me organise my day.' },
]
