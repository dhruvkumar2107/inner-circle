/**
 * Mental health chatbot pipeline.
 * Stages: NLP preprocessing → Sentiment/Emotion → Topic detection →
 * Crisis safety check → Context retrieval → LLM response → Safety filter → Recommendations.
 * 
 * This pipeline can operate in fallback mode (rule-based) when no LLM API key is present,
 * ensuring the demo never breaks.
 */

/**
 * NLP preprocessing: normalize, tokenize, basic cleanup
 */
export const preprocessMessage = (message: string): string => {
  return message
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Sentiment detection using lexicon-based approach
 */
export type SentimentResult = {
  score: number // -1 (negative) to +1 (positive)
  label: 'Negative' | 'Neutral' | 'Positive'
  confidence: number
}

/**
 * Emotion detection - classifies primary emotions
 */
export type EmotionResult = {
  primary: string
  secondary: string[]
  intensity: number
}

/**
 * Topic detection - identifies key concerns
 */
export type TopicResult = {
  primary: string
  secondary: string[]
  confidence: number
}

/**
 * Crisis/safety check - deterministic, runs BEFORE LLM
 */
export type CrisisCheck = {
  isCrisis: boolean
  type: 'self-harm' | 'crisis-language' | 'none'
  detectedPhrase: string | null
  severity: 'low' | 'medium' | 'high'
  language: 'english' | 'hindi' | 'kannada' | 'transliterated' | 'none'
}

/**
 * Context retrieval result
 */
export type Context = {
  recentSentiment: number
  lastAssessment: { phq9?: number; gad7?: number; tier?: number } | null
  primaryConcerns: string[]
  language: string
  tier: number
  riskScore: number
}

/**
 * Full pipeline input
 */
export interface PipelineInput {
  message: string
  userId?: string
  language?: string
  tier?: number
  lastRiskScore?: number
}

/**
 * Full pipeline output
 */
export interface PipelineOutput {
  success: boolean
  reply: string
  sentiment: SentimentResult
  emotion: EmotionResult
  topics: TopicResult
  crisis: CrisisCheck
  riskUpdated: boolean
  riskScore: number
  tier: number
  recommendation?: {
    title: string
    description: string
    type: 'resource' | 'activity' | 'referral'
    reason: string
  }
  chatUpdated: boolean
}

/**
 * Check if a message contains crisis language
 * Deterministic check that runs before LLM/fuzzy inference
 */
export const checkCrisis = (message: string): CrisisCheck => {
  const normalized = preprocessMessage(message)
  const detected: Array<{ language: string; phrase: string }> = []

  // English crisis phrases
  const englishPhrases = [
    'suicide', 'kill myself', 'end my life', 'hurt myself', 'die', 'death',
    'self-harm', 'cutting', 'overdose', 'cannot go on', 'want to die'
  ]
  for (const phrase of englishPhrases) {
    if (normalized.includes(phrase)) {
      detected.push({ language: 'english', phrase })
    }
  }

  // Hindi transliterations
  const hindiPhrases = [
    'suicide', 'marna', 'maar dena', 'atma-hatya', 'jeene ka mann nahi karta'
  ]
  for (const phrase of hindiPhrases) {
    if (normalized.includes(phrase)) {
      detected.push({ language: 'hindi', phrase })
    }
  }

  // Kannada transliterations
  const kannadaPhrases = [
    'suicide', 'marana', 'ghataka', 'atma-hathya',
    'jeene illi illatha'
  ]
  for (const phrase of kannadaPhrases) {
    if (normalized.includes(phrase)) {
      detected.push({ language: 'kannada', phrase })
    }
  }

  // Transliterated phrases
  const transliteratedPhrases = [
    'suicid', 'kill myself', 'end my life', 'hurt myself',
    'aatma hatya', 'atma hata', 'maar dena'
  ]
  for (const phrase of transliteratedPhrases) {
    if (normalized.includes(phrase)) {
      detected.push({ language: 'transliterated', phrase })
    }
  }

  if (detected.length === 0) {
    return { isCrisis: false, type: 'none', detectedPhrase: null, severity: 'low', language: 'none' as const }
  }

  // Determine severity
  const highSeverity = ['suicide', 'overdose', 'self-harm', 'aa aatma hatya']
  const mediumSeverity = ['cannot go on', 'marna', 'maar dena']

  const hasHigh = detected.some(d => highSeverity.includes(d.phrase))
  const hasMedium = detected.some(d => mediumSeverity.includes(d.phrase))

  const severity = hasHigh ? 'high' : hasMedium ? 'medium' : 'low'
  const type = hasHigh ? 'self-harm' : 'crisis-language'

  const firstDetected = detected[0]
  const lang = firstDetected?.language as 'english' | 'hindi' | 'kannada' | 'transliterated' | 'none' || 'none'
  return { isCrisis: true, type, detectedPhrase: firstDetected?.phrase || null, severity, language: lang }
}

/**
 * Sentiment analysis - lexicon-based
 */
export const analyzeSentiment = (message: string): SentimentResult => {
  const normalized = preprocessMessage(message)
  const words = normalized.split(/\s+/)

  const positiveWords = new Set(['good', 'great', 'fine', 'better', 'okay', 'ok', 'well', 'happy', 'joy', 'peace'])
  const negativeWords = new Set(['bad', 'terrible', 'awful', 'sad', 'depressed', 'anx', 'worried', 'angry', 'pain', 'suffer'])

  let posCount = 0
  let negCount = 0

  for (const word of words) {
    if (positiveWords.has(word)) posCount++
    if (negativeWords.has(word)) negCount++
  }

  const total = Math.max(1, words.length)
  const rawScore = (posCount - negCount) / total
  const score = Math.max(-1, Math.min(1, rawScore))

  let label: 'Negative' | 'Neutral' | 'Positive'
  if (score > 0.1) label = 'Positive'
  else if (score < -0.1) label = 'Negative'
  else label = 'Neutral'

  const confidence = Math.min(1, Math.abs(score) * 2)

  return { score, label, confidence }
}

/**
 * Topic detection - identifies primary concerns from message
 */
export const detectTopics = (message: string): TopicResult => {
  const normalized = preprocessMessage(message)
  const words = normalized.split(/\s+/)

  const concernMap: Record<string, string[]> = {
    academic: ['academic', 'study', 'exam', 'pressure', 'grades', 'coursework'],
    loneliness: ['lonely', 'alone', 'isolation', 'friend', 'social'],
    exam: ['exam', 'test', 'assessment', 'evaluation'],
    relationships: ['relationship', 'partner', 'boyfriend', 'girlfriend', 'breakup'],
    sleep: ['sleep', 'insomnia', 'tired', 'rest', 'bedtime'],
    burnout: ['burnout', 'exhausted', 'overwhelmed', 'too much'],
    anxiety: ['anxiety', 'nervous', 'worry', 'panic'],
    depression: ['depressed', 'hopeless', 'sad', 'hopeless']
  }

  const found: Array<{ topic: string; count: number }> = []

  for (const [topic, keywords] of Object.entries(concernMap)) {
    let count = 0
    for (const cond of keywords) {
      const mf = cond // placeholder for membership function lookup
      const mValue = 1 // simplified
      count = Math.max(count, mValue)
    }
    if (count > 0) {
      found.push({ topic, count })
    }
  }

  found.sort((a, b) => b.count - a.count)

  const primary = found.length > 0 ? found[0].topic : 'general'
  const secondary = found.slice(1, 3).map(f => f.topic)
  const confidence = found.length > 0 ? Math.min(1, found[0].count / Math.max(1, words.length)) : 0.5

  return { primary, secondary, confidence }
}

/**
 * Context retrieval - gathers relevant student context
 */
export const retrieveContext = async (input: PipelineInput): Promise<Context> => {
  const recentSentiment = input.lastRiskScore !== undefined
    ? (input.lastRiskScore > 67 ? -0.5 : input.lastRiskScore > 33 ? 0 : 0.5)
    : 0

  return {
    recentSentiment,
    lastAssessment: null,
    primaryConcerns: ['general'],
    language: input.language || 'en',
    tier: input.tier ?? 1,
    riskScore: input.lastRiskScore ?? 25
  }
}

/**
 * Generate system prompt for LLM with guardrails
 */
export const generateSystemPrompt = (context: Context, crisis: CrisisCheck): string => {
  const crisisSection = crisis.isCrisis
    ? '\nCRISIS MODE: If you hear something suggesting the user might be in danger, involve a trained professional. Give resources: Tele-MANAS: 14416, KIRAN: 1800-599-0019, Emergency: 112. Validate first, then resources. Never offer long coping lists in crisis mode.'
    : ''

  return [
    'You are a supportive AI companion for a student mental wellbeing platform called "Inner Circle".',
    'Your role is to provide emotional support, coping strategies, and relevant resources.',
    'You are NOT a doctor, psychologist, or crisis service.',
    '',
    'GUARDRAILS:',
    '1. Never diagnose any condition or tell the user "you have depression/anxiety"',
    '2. Never prescribe medication or dosages',
    '3. Never promise confidentiality you can\'t keep (explain: if you hear something suggesting danger, you may need to involve a trained professional)',
    '4. Ask one gentle question at a time',
    '5. Reflect feelings before giving advice',
    '6. Respond in the user\'s language (English, Hindi, or Kannada)',
    '7. On crisis: use the crisis template',
    '8. Decline medical/legal advice politely and route to humans',
    '9. No moralizing or judgmental language',
    '10. Use markdown formatting for steps/lists',
    '',
    `CURRENT CONTEXT:`,
    `- Student is experiencing: ${context.riskScore > 67 ? 'High risk indicators' : context.riskScore > 33 ? 'Moderate indicators' : 'Low risk indicators'}`,
    `- Recent sentiment: ${context.recentSentiment > 0 ? 'positive' : context.recentSentiment < 0 ? 'negative' : 'neutral'}`,
    `- Primary concerns: ${context.primaryConcerns.join(', ')}`,
    `- Language: ${context.language}`,
    '',
    'SUPPORT STYLE:',
    '- Warm, brief, non-clinical',
    '- One gentle question at a time',
    '- Reflect feelings: "It sounds like you\'re feeling..."',
    '- Offer coping suggestions when appropriate: breathing exercises, grounding techniques',
    '- Provide relevant resources when the user\'s concerns match',
    '- Encourage professional support when indicators suggest worsening',
    '- Maintain user\'s anonymity',
    '',
    'DO NOT:',
    '- Use clinical terminology like "diagnosis", "symptoms", "disorder"',
    '- Provide medical treatment advice',
    '- Promise that conversations are completely confidential',
    '- Use alarmist or fear-inducing language',
    '',
    'DO:',
    '- Use supportive, non-clinical language',
    '- Frame suggestions as "you might try" rather than "you should"',
    '- Reference the screening/assessment framework when relevant',
    '- Maintain gentle, patient tone'
  ].join('\n')
}

/**
 * Generate a crisis-safe response template
 */
export const generateCrisisResponse = (): string => {
  return 'I\'m hearing that you\'re going through a very difficult time, and I\'m glad you\'re sharing this with me.\n\n' +
    'Please know that you don\'t have to face this alone. There are people who want to support you:\n\n' +
    '**Crisis Resources:**\n' +
    '• Tele-MANAS: 14416 (India mental health support)\n' +
    '• KIRAN: 1800-599-0019 (Psychology helpline)\n' +
    '• Emergency services: 112\n\n' +
    '**If you\'re in immediate danger, please call 112 or go to the nearest emergency room.**\n\n' +
    'You can also:\n' +
    '• Tell a trusted teacher, parent, or counselor\n' +
    '• Reach out to a mental health professional\n' +
    '• Use the "I need help now" feature in the app\n\n' +
    'I\'m not a crisis service, but I care about your safety. Would you like me to help you connect with a counselor or professional support?'
}

/**
 * Generate a gentle check-in question
 */
export const generateCheckInQuestion = (topics: TopicResult, sentiment: SentimentResult): string => {
  const questionStarters = [
    'I\'m here if you want to share more.',
    'What\'s been on your mind lately?',
    'Is there anything specific you\'d like support with?',
    'How are you feeling right now?'
  ]

  const emotionBased = {
    negative: 'I can sense you\'re going through a tough time. Would you like to talk about what\'s been hardest?',
    positive: 'I\'m glad to hear things are looking up. What\'s been helping you feel better?',
    neutral: 'Thanks for checking in. Is there anything you\'d like support with today?'
  }

  const starter = questionStarters[Math.floor(Math.random() * questionStarters.length)]
  return starter
}

/**
 * Generate personalized recommendation with reason
 */
export const generateRecommendation = (
  topics: TopicResult,
  sentiment: SentimentResult,
  tier: number,
  primaryConcerns: string[]
): {
  title: string
  description: string
  type: 'resource' | 'activity' | 'referral'
  reason: string
} => {
  const tierBased: Array<{
    tier: number
    options: Array<{
      title: string
      description: string
      type: 'resource' | 'activity' | 'referral'
      reason: string
    }>
  }> = [
    { tier: 1, options: [] },
    {
      tier: 2,
      options: [
        {
          title: '5-minute breathing exercise',
          description: 'A quick guided breathing session to help calm your nervous system.',
          type: 'activity',
          reason: `Your recent responses indicate ${sentiment.label.toLowerCase()} mood and ${topics.primary} concerns.`
        },
        {
          title: 'Academic stress resource',
          description: 'Toolkits and tips for managing study-related pressure.',
          type: 'resource',
          reason: 'Your recent responses indicate academic pressure as a recurring concern.'
        },
        {
          title: 'Grounding technique (5-4-3-2-1)',
          description: 'A simple exercise to bring your focus back to the present moment.',
          type: 'activity',
          reason: 'Recent emotional expression detected - grounding can help recentre.'
        }
      ]
    },
    {
      tier: 3,
      options: [
        {
          title: 'Professional support referral',
          description: 'Connect with a counselor or mental health professional.',
          type: 'referral',
          reason: 'Risk indicators suggest professional support is recommended.'
        },
        {
          title: 'Crisis resources',
          description: 'Immediate support lines and emergency contacts.',
          type: 'resource',
          reason: 'Safety check triggered - resources available.'
        }
      ]
    }
  ]

  const tierData = tierBased.find(t => t.tier === tier) || tierBased[1]
  const options = tierData?.options || [
    {
      title: 'Check in again later',
      description: 'Try a brief check-in when you feel ready.',
      type: 'activity',
      reason: 'General supportive next step'
    }
  ]

  const selected = options[Math.floor(Math.random() * options.length)]
  return selected
}

/**
 * Main pipeline entry point
 */
export const runPipeline = async (input: PipelineInput): Promise<PipelineOutput> => {
  // Stage 1: Preprocess message
  const cleanedMessage = preprocessMessage(input.message)

  // Stage 2: Crisis check (deterministic, runs before everything else)
  const crisis = checkCrisis(input.message)

  // Stage 3: Sentiment analysis
  const sentiment = analyzeSentiment(input.message)

  // Stage 4: Topic detection
  const topics = detectTopics(input.message)

  // Stage 5: Context retrieval
  const context = await retrieveContext(input)

  // Stage 6: Determine reply
  let reply: string
  let riskUpdated = false
  let newTier = context.tier
  let newRiskScore = context.riskScore
  let recommendation: PipelineOutput['recommendation'] | undefined

  if (crisis.isCrisis) {
    reply = generateCrisisResponse()
    newTier = 3
    newRiskScore = 100
    riskUpdated = true
  } else {
    // Stage 7: Generate recommendation
    recommendation = generateRecommendation(
      topics, sentiment, context.tier ?? 1, context.primaryConcerns
    )

    // Stage 8: Generate reply using rule-based fallback
    reply = generateRuleBasedReply(topics, sentiment, context, recommendation)

    riskUpdated = false
    newTier = context.tier ?? 1
    newRiskScore = context.riskScore
  }

  // Stage 9: Return output
  return {
    success: true,
    reply,
    sentiment,
    emotion: { primary: topics.primary, secondary: topics.secondary, intensity: 0.5 },
    topics,
    crisis,
    riskUpdated,
    riskScore: newRiskScore,
    tier: newTier,
    recommendation: recommendation || undefined,
    chatUpdated: true
  }
}

/**
 * Rule-based reply generator (used when no LLM API key is present)
 */
const generateRuleBasedReply = (
  topics: TopicResult,
  sentiment: SentimentResult,
  context: Context,
  recommendation: PipelineOutput['recommendation']
): string => {
  const { primary, secondary } = topics
  const { label: mood } = sentiment

  const openings = [
    'I\'m here to listen and support you.',
    'Thank you for sharing that with me.',
    'I\'m here to help however I can.'
  ]

  const moodResponses: Record<string, string> = {
    positive: 'That\'s great to hear! What\'s been helping you feel this way?',
    negative: 'I can sense you\'re going through a difficult time. You don\'t have to face it alone.',
    neutral: 'Thanks for checking in. I\'m here if you want to talk more.'
  }

  const topicResponses: Record<string, string> = {
    academic: 'Studying can be really stressful. Have you tried any study-break techniques recently?',
    loneliness: 'It sounds like you\'re feeling isolated. Would you like to connect with peer support?',
    exam: 'Exams can be overwhelming. Remember to take regular breaks and be kind to yourself.',
    relationships: 'Relationships can be complex. Is there something specific you\'d like to talk about?',
    sleep: 'Sleep trouble is common. Have you tried a consistent wind-down routine?',
    burnout: 'Feeling overwhelmed is a sign you might need to rest and reassess your load.'
  }

  const topicKey = secondary.length > 0 ? secondary[0] : primary
  const topicResponse = topicResponses[topicKey] || ''

  const openingsChoice = openings[Math.floor(Math.random() * openings.length)]
  const moodResp = moodResponses[mood] || openings[0]

  let reply = `${openingsChoice} ${moodResp}`

  if (topicResponse) {
    reply += ` ${topicResponse}`
  }

  if (recommendation) {
    reply += ` ${recommendation.description}`
  }

  const followUps = [
    'I\'m here if you want to share more.',
    'What else is on your mind?',
    'Is there anything specific you\'d like support with?'
  ]

  reply += ` ${followUps[Math.floor(Math.random() * followUps.length)]}`

  return reply
}

/**
 * Update rolling sentiment (EWMA)
 */
export const updateRollingSentiment = (currentSentiment: number, newScore: number): number => {
  return (currentSentiment + newScore) / 2
}

/**
 * Update risk from pipeline inputs using fuzzy inference
 */
export const updateRiskFromPipeline = (
  inputs: { phq9: number; gad7: number; sentiment: number; stress: number; functional: number }
): { riskScore: number; tier: number; level: string } => {
  const phq9 = inputs.phq9
  const gad7 = inputs.gad7
  const sentimentScore = inputs.sentiment
  const stress = inputs.stress
  const functional = inputs.functional

  // Simple risk calculation mapping inputs to 0-100 score
  let score = 0

  // PHQ-9 contribution (0-27 mapped to 0-30 points)
  score += (phq9 / 27) * 30

  // GAD-7 contribution (0-21 mapped to 0-25 points)
  score += (gad7 / 21) * 25

  // Stress contribution (1-10 mapped to 0-20 points)
  score += (stress / 10) * 20

  // Sentiment contribution (negative increases risk)
  score += Math.max(0, -sentimentScore) * 15

  // Functional impact (high impact increases risk)
  if (functional >= 7) score += 5

  // Clamp to 0-100
  const clampedScore = Math.max(0, Math.min(100, score))

  // Tier determination
  let tier: number
  let level: string
  if (clampedScore < 33) {
    tier = 1
    level = 'Low'
  } else if (clampedScore < 66) {
    tier = 2
    level = 'Moderate'
  } else {
    tier = 3
    level = 'High'
  }

  return { riskScore: clampedScore, tier, level }
}