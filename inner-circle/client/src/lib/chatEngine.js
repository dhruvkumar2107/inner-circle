/**
 * The demo response engine behind the AI companion.
 *
 * It reads the conversation's context (topic signals from earlier messages),
 * matches the newest message to a supportive intent and answers with an
 * empathetic reflection plus a genuine choice of next steps — never a forced
 * activity, never a diagnosis, never a promise that everything will be fine.
 *
 * Clearly labelled "simulated responses" in the interface. To connect a real
 * model later, replace `generateReply` with a call to your backend endpoint
 * (e.g. POST /api/chat) while keeping the same return shape.
 */

import { analyze, checkCrisis } from './sentiment'

const pick = (list, seed) => list[Math.abs(seed) % list.length]

const INTENTS = [
  {
    key: 'anxious',
    match: ['anxious', 'anxiety', 'panic', 'nervous', 'overthink', 'overthinking', 'worried', 'worry', 'scared', 'afraid', 'dread', 'butterflies', 'on edge'],
    replies: [
      "That restless, on-edge feeling is exhausting to sit with. Would it help to talk about what's triggering it, or would you rather try a short grounding exercise first?",
      "I hear you — anxiety can make everything feel louder than it is. We could slow things down together with the 5-4-3-2-1 grounding exercise, or you can tell me more about what's been worrying you.",
      "Thank you for saying it out loud. Would you like to unpack the worry together, or take one quiet minute of breathing to give yourself some room first?",
    ],
    follow: ['Tell me more', 'Help me relax'],
    suggestion: { label: 'Try the 5-4-3-2-1 grounding exercise', to: '/breathe?ex=grounding' },
  },
  {
    key: 'academic',
    match: ['assignment', 'assignments', 'exam', 'exams', 'deadline', 'submission', 'project', 'grades', 'marks', 'study', 'studying', 'syllabus', 'presentation', 'viva', 'semester', 'academic', 'classes', 'attendance', 'lab'],
    replies: [
      "That sounds like a lot to carry at once. Would it help to talk about what's stressing you most, or would you prefer to break your assignments into smaller steps?",
      "Academic pressure has a way of blurring everything into one huge wall. Want to sort through it together, or would a short break first help you see the next step?",
      "You're carrying a heavy load right now. We could talk it through, or I can help you sketch a simple plan for the next day or two — whichever feels lighter.",
    ],
    follow: ["Help me organise my day", "I just want to talk"],
    suggestion: { label: 'Take a one-minute reset', to: '/breathe?ex=minute' },
  },
  {
    key: 'overwhelmed',
    match: ['overwhelmed', 'too much', 'cant cope', "can't cope", 'cant handle', "can't handle", 'breaking point', 'stressed', 'stress', 'pressure', 'buried', 'drowning', 'everything at once'],
    replies: [
      "It sounds like everything is landing on you at the same time. Would you like to talk about what's weighing most, or take one small pause before anything else?",
      "When it's all too much, you don't have to solve it all right now. We could slow down together for a minute, or you could tell me the one thing that feels heaviest.",
      "That's a lot to hold. Would a short breathing break help first, or do you want to talk it through and let it out?",
    ],
    follow: ['Help me calm down', 'I need to talk'],
    suggestion: { label: 'One-minute breathing reset', to: '/breathe?ex=minute' },
  },
  {
    key: 'lonely',
    match: ['lonely', 'loneliness', 'alone', 'isolated', 'no friends', 'left out', 'homesick', 'missing home', 'nobody', 'no one', 'by myself'],
    replies: [
      "Loneliness can be very heavy, especially when everyone else seems busy. Would you like to talk about what's missing, or is there something small we could do to lighten the moment?",
      "I'm glad you told me. You don't have to fill the quiet alone right now — we can talk for as long as you like. What's been on your mind lately?",
      "Feeling disconnected from people hurts. Would it help to talk about the people around you, or shall we look at something gentle to do for a few minutes?",
    ],
    follow: ['I just want to talk', 'Suggest a distraction'],
    suggestion: { label: 'Explore a calming activity', to: '/play' },
  },
  {
    key: 'sleep',
    match: ['sleep', 'insomnia', 'awake', 'cant sleep', "can't sleep", 'all night', 'nightmare', 'tired in the morning', 'exhausted', 'dark circles'],
    replies: [
      "Sleep makes everything harder, and a tired mind tends to amplify worries. Would you like to talk about what keeps you up, or try a slow breathing rhythm you can use in bed?",
      "I'm sorry sleep has been rough. A longer exhale calms the body before rest — I can guide you through one, or we can talk about what's keeping your mind busy at night.",
    ],
    follow: ['Help me relax', 'Talk about my day'],
    suggestion: { label: 'Box breathing exercise', to: '/breathe?ex=box' },
  },
  {
    key: 'low',
    match: ['sad', 'depressed', 'down', 'low', 'hopeless', 'empty', 'numb', 'worthless', 'useless', 'failure', 'failed', 'crying', 'hurt', 'heartbroken', 'give up'],
    replies: [
      "I'm sorry you're feeling this way — that heaviness deserves some gentleness. Would you like to keep talking about it, or would a soft, no-pressure activity feel better?",
      "Thank you for trusting me with this. There's no rush to feel different. Do you want to tell me more, or would you like something quiet to focus on for a while?",
      "That sounds painful to carry. Would it help to talk through what happened, or to take a few calm minutes first?",
    ],
    follow: ['I want to understand my feelings', 'Suggest something calming'],
    suggestion: { label: 'A quiet, relaxing activity', to: '/play' },
  },
  {
    key: 'planning',
    match: ['organise', 'organize', 'planning', 'plan', 'schedule', 'motivation', 'motivated', 'procrastinat', 'focus', 'concentrate', 'distracted', 'time management', 'daily'],
    replies: [
      "Let's make it smaller and lighter. Pick the single task that would help most tomorrow — what is it?",
      "Good — naming the mess is the first step. Tell me your top two priorities for today and we'll shrink everything else.",
      "We can build a simple plan together: one must-do, one nice-to-do, and one thing you'll deliberately skip. Want to try?",
    ],
    follow: ['Help me with the next step', 'I need a break instead'],
    suggestion: { label: 'Puzzles for a focus break', to: '/puzzles' },
  },
  {
    key: 'positive',
    match: ['good', 'great', 'better', 'happy', 'passed', 'completed', 'finished', 'proud', 'excited', 'relieved', 'thank', 'awesome', 'went well', 'done with'],
    replies: [
      "That's genuinely good to hear. Would you like to save it as a tiny win in your mood journey so future-you can see it?",
      "I'm glad — hold on to that feeling for a moment. Want to record what went well, or carry on with your day?",
      "Lovely. Small wins like this are worth noticing. Shall we log it, or is there anything else you'd like to talk through?",
    ],
    follow: ['Record a tiny win', 'Nothing else, thanks'],
    suggestion: { label: 'Record a tiny win', to: '/mood?wins=1' },
  },
  {
    key: 'smalltalk',
    match: ['hello', 'hi ', 'hey', 'good morning', 'good evening', 'how are you', 'thank you', 'thanks', 'ok thanks', 'bye'],
    replies: [
      "Hello — I'm here and listening. How are you arriving today?",
      "Hi there. You can share as much or as little as you like. What's on your mind?",
      "Hey. Glad you're here. How has your day been so far?",
    ],
    follow: ["I'm feeling anxious", "I have too much academic pressure"],
    suggestion: null,
  },
  {
    key: 'about-ai',
    match: ['are you a bot', 'are you real', 'are you human', 'are you a doctor', 'diagnose', 'diagnosis', 'prescribe', 'medicine', 'therapist?', 'ai?'],
    replies: [
      "I'm a supportive AI companion inside Inner Circle — not a doctor and not a replacement for one. I can listen, help you reflect and suggest activities. If you'd like a professional opinion, I can take you to the Department of Psychiatry page whenever you're ready.",
      "I'm a simulated companion for this prototype: I can't diagnose or prescribe, and I won't pretend to. What I can do is listen, help you put words to what you're feeling, and point you to real support if you want it.",
    ],
    follow: ['Show me professional support', 'I want to talk about something else'],
    suggestion: { label: 'Contact a Professional', to: '/professional' },
  },
]

const FALLBACKS = [
  "I hear you. Would you like to say more about that, or would a gentle activity help right now?",
  "Thank you for sharing that with me. What do you think is behind it — and what would feel most supportive at this moment?",
  "That makes sense, and you don't have to figure it all out today. Want to keep talking, or take a short pause together?",
  "I'm listening. If you had to name the part that's weighing on you most, what would it be?",
]

const CRISIS_REPLY = {
  text:
    "I'm really glad you told me, and I'm taking this seriously. I'm an AI companion, so I can't support you the way a person should right now.\n\nPlease reach out to someone immediately — a person you trust, or one of the urgent support numbers in Inner Circle. If you may be in immediate danger, please contact emergency services on 112.\n\nWould you like me to open the urgent support options?",
  prompts: ['Open urgent support', 'I want to talk more'],
  suggestion: { label: 'Open urgent support options', to: '/professional?urgent=1' },
}

const detectIntent = (message) => {
  const lower = ` ${message.toLowerCase()} `
  for (const intent of INTENTS) {
    if (intent.match.some((word) => lower.includes(word))) return intent
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
 * @returns {{ text: string, prompts: string[], suggestion: {label: string, to: string}|null, crisis: boolean, intent: string }}
 */
export const generateReply = ({ text, history = [] }) => {
  const crisis = checkCrisis(text)
  if (crisis.isCrisis) {
    return { ...CRISIS_REPLY, crisis: true, intent: 'crisis' }
  }

  const { sentiment } = analyze(text)
  const intent = detectIntent(text)
  const seed = history.filter((m) => m.role === 'user').length
  const earlierTopic = topicMentions(history)

  if (!intent) {
    const prefix = sentiment.label === 'Negative' && earlierTopic
      ? `Earlier you mentioned ${earlierTopic.toLowerCase()} — I'm wondering if that's still what's sitting heavily with you. `
      : ''
    return {
      text: prefix + pick(FALLBACKS, seed),
      prompts: ['I want to talk', 'Help me relax'],
      suggestion: null,
      crisis: false,
      intent: 'general',
    }
  }

  let reply = pick(intent.replies, seed)
  if (intent.key === 'smalltalk' && sentiment.label === 'Negative') {
    reply = "It sounds like today has been heavy. I'm here — do you want to tell me what happened?"
  }

  return {
    text: reply,
    prompts: intent.follow || [],
    suggestion: intent.suggestion || null,
    crisis: false,
    intent: intent.key,
  }
}

/** Starter prompts shown before the first message. */
export const QUICK_PROMPTS = [
  "I'm feeling anxious.",
  'I have too much academic pressure.',
  'I feel lonely.',
  'I need help calming down.',
  "I just want to talk.",
  'Help me organise my day.',
]
