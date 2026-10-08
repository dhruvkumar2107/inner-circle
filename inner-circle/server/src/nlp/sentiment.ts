/**
 * Lightweight lexicon-based sentiment analysis.
 * Used as the primary sentiment detector when LLM is not available,
 * and as a preprocessing step for the LLM pipeline.
 */

/**
 * Sentiment result: score from -1 (negative) to +1 (positive)
 */
export const analyzeSentiment = (text: string): { score: number; label: 'Negative' | 'Neutral' | 'Positive'; confidence: number } => {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalized.split(/\s+/)
  
  // Simple lexicon-based scoring
  const positiveSet = new Set(['good', 'great', 'fine', 'better', 'okay', 'ok', 'well', 'happy', 'joy', 'peace', 'better', 'better'])
  const negativeSet = new Set(['bad', 'terrible', 'awful', 'sad', 'depressed', 'anx', 'worried', 'angry', 'pain', 'suffer', 'worst'])
  
  let posCount = 0
  let negCount = 0
  
  for (const word of words) {
    if (positiveSet.has(word)) posCount++
    if (negativeSet.has(word)) negCount++
  }
  
  const total = Math.max(1, words.length)
  const rawScore = (posCount - negCount) / total
  
  // Clamp to -1...1
  const score = Math.max(-1, Math.min(1, rawScore))
  
  let label: 'Negative' | 'Neutral' | 'Positive'
  if (score > 0.1) label = 'Positive'
  else if (score < -0.1) label = 'Negative'
  else label = 'Neutral'
  
  const confidence = Math.min(1, Math.abs(score) * 2)
  
  return { score, label, confidence }
}

/**
 * Emotion detection - identifies primary emotions from text.
 * Uses a lightweight lexicon approach.
 */
export const detectEmotion = (text: string): { primary: string; secondary: string[]; intensity: number } => {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalized.split(/\s+/)
  
  // Emotion word mappings
  const emotionMap: Record<string, string[]> = {
    anxiety: ['anx', 'anxiety', 'worried', 'worry', 'nervous', 'panic', 'uneasy'],
    sadness: ['sad', 'depressed', 'hopeless', 'crying', 'tears', 'melancholy'],
    anger: ['angry', 'frustrated', 'irritated', 'rant', 'furious', 'annoyed'],
    joy: ['happy', 'joy', 'pleased', 'great', 'excited', 'great'],
    fatigue: ['tired', 'exhausted', 'exhaustion', 'worn out', ' drained', 'fatigued']
  }
  
  const found: Record<string, number> = {}
  
  for (const [emotion, keywords] of Object.entries(emotionMap)) {
    let count = 0
    for (const keyword of keywords) {
      if (words.includes(keyword)) count++
    }
    if (count > 0) {
      found[emotion] = count
    }
  }
  
  // Find primary emotion (most frequent)
  const entries = Object.entries(found).sort((a, b) => b[1] - a[1])
  const primary = entries.length > 0 ? entries[0][0] : 'neutral'
  const secondary = entries.length > 1 ? entries.slice(1, 3).map(e => e[0]) : []
  const intensity = entries.length > 0 ? Math.min(1, entries[0][1] / 3) : 0
  
  return { primary, secondary, intensity }
}

/**
 * Topic detection - identifies key concerns from text.
 * Used in the chatbot pipeline to tailor responses.
 */
export const detectTopics = (text: string): { primary: string; secondary: string[]; confidence: number } => {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalized.split(/\s+/)
  
  // Concern categories and their keywords
  const concernCategories = {
    academic: ['academic', 'study', 'exam', 'pressure', 'grades', 'coursework', 'university', 'school'],
    loneliness: ['lonely', 'alone', 'isolation', 'no friends', 'social', 'isolated'],
    exam: ['exam', 'test', 'assessment', 'evaluation', 'quiz'],
    relationships: ['relationship', 'partner', 'boyfriend', 'girlfriend', 'breakup', 'dating'],
    sleep: ['sleep', 'insomnia', 'tired', 'rest', 'bedtime', 'exhausted', 'can\'t sleep'],
    burnout: ['burnout', 'exhausted', 'overwhelmed', 'too much', 'breaking point'],
    anxiety: ['anxiety', 'nervous', 'worry', 'panic', 'nervousness'],
    depression: ['depressed', 'hopeless', 'sad', 'hopeless', 'no point']
  }
  
  const found: Array<{ topic: string; count: number }> = []
  
  for (const [topic, keywords] of Object.entries(concernCategories)) {
    let count = 0
    for (const keyword of keywords) {
      if (words.includes(keyword) || normalized.includes(keyword)) {
        count++
      }
    }
    if (count > 0) {
      found.push({ topic, count })
    }
  }
  
  // Sort by count (most frequent first)
  found.sort((a, b) => b.count - a.count)
  
  const primary = found.length > 0 ? found[0].topic : 'general'
  const secondary = found.slice(1, 3).map(f => f.topic)
  const confidence = found.length > 0 ? Math.min(1, found[0].count / Math.max(1, words.length)) : 0
  
  return { primary, secondary, confidence }
}