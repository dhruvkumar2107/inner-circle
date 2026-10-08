/**
 * Crisis language detection - deterministic, runs BEFORE fuzzy inference and LLM.
 * Triggers safety pathway for PHQ-9 item 9 > 0, crisis language, or help-now button.
 * 
 * Detects crisis phrases in English, Hindi, Kannada and common transliterations.
 */

export const CRISIS_PHRASES = {
  english: [
    'suicide', 'kill myself', 'end my life', 'hurt myself', 'die', 'death',
    'self-harm', 'cutting', 'overdose', 'cannot go on', 'want to die'
  ],
  hindi: [
    'suicide', 'marna', 'maar dena', 'atma-hatya', 'khatarnak',
    'jeene ka mann nahi karta'
  ],
  kannada: [
    'suicide', 'marana', 'ghataka', 'atma-hathya',
    'jeene illi illatha'
  ],
  transliterated: [
    'suicid', 'kill myself', 'end my life', 'hurt myself',
    'aatma hatya', 'atma hata', 'maar dena'
  ]
}

/**
 * Check if a message contains crisis language.
 * Returns detailed info about the detected crisis type and severity.
 */
export const checkCrisisLanguage = (message: string): {
  isCrisis: boolean
  type: 'self-harm' | 'crisis-language' | 'none'
  detectedPhrase: string | null
  severity: 'low' | 'medium' | 'high'
  language: 'english' | 'hindi' | 'kannada' | 'transliterated' | 'none'
} => {
  const normalized = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  
  const detected: Array<{ phrase: string; language: keyof typeof CRISIS_PHRASES }> = []
  
  // Check English phrases
  for (const phrase of CRISIS_PHRASES.english) {
    if (normalized.includes(phrase.toLowerCase())) {
      detected.push({ phrase, language: 'english' })
    }
  }
  
  // Check Hindi phrases
  for (const phrase of CRISIS_PHRASES.hindi) {
    if (normalized.includes(phrase.toLowerCase())) {
      detected.push({ phrase, language: 'hindi' })
    }
  }
  
  // Check Kannada phrases
  for (const phrase of CRISIS_PHRASES.kannada) {
    if (normalized.includes(phrase.toLowerCase())) {
      detected.push({ phrase, language: 'kannada' })
    }
  }
  
  // Check transliterated phrases
  for (const phrase of CRISIS_PHRASES.transliterated) {
    if (normalized.includes(phrase.toLowerCase())) {
      detected.push({ phrase, language: 'transliterated' })
    }
  }
  
  if (detected.length === 0) {
    return { isCrisis: false, type: 'none', detectedPhrase: null, severity: 'low', language: 'none' }
  }
  
  // Determine severity
  const highSeverityPhrases = new Set(['suicide', 'overdose', 'self-harm', 'aa aatma hatya'])
  const mediumSeverityPhrases = new Set(['cannot go on', 'marna', 'maar dena'])
  
  const hasHighSeverity = detected.some(d => highSeverityPhrases.has(d.phrase))
  const hasMediumSeverity = detected.some(d => mediumSeverityPhrases.has(d.phrase))
  
  const severity = hasHighSeverity ? 'high' : hasMediumSeverity ? 'medium' : 'low'
  const type = hasHighSeverity ? 'self-harm' : 'crisis-language'
  
  // Use the first detected phrase as the representative
  const firstDetected = detected[0]
  
  return {
    isCrisis: true,
    type,
    detectedPhrase: firstDetected?.phrase || null,
    severity,
    language: firstDetected?.language || 'none'
  }
}

/**
 * PHQ-9 item 9 check - deterministic safety trigger.
 * Item 9: "Thoughts that you would be better off dead or of hurting yourself in some way"
 * If item 9 > 0, always triggers Tier 3 + safety pathway regardless of fuzzy output.
 */
export const checkItem9 = (phq9Answers: number[]): {
  item9Flag: boolean
  item9Score: number
  safetyOverride: boolean
} => {
  // Item 9 is the last item (index 8): "Thoughts that you would be better off dead or of hurting yourself in some way"
  const item9Score = phq9Answers[8] ?? 0
  const item9Flag = item9Score > 0
  const safetyOverride = item9Flag
  
  return { item9Flag, item9Score, safetyOverride }
}