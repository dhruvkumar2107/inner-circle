/**
 * Emotion detection using lexicon-based approach.
 * Identifies primary and secondary emotions from text.
 */

/**
 * Detect primary emotion and intensity from text.
 */
export const detectEmotion = (text: string): { primary: string; secondary: string[]; intensity: number } => {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalized.split(/\s+/)
  
  // Emotion word mappings (lexicon)
  const emotionMap: Record<string, string[]> = {
    anxiety: ['anx', 'anxiety', 'worried', 'worry', 'nervous', 'panic', 'uneasy', 'nervousness'],
    sadness: ['sad', 'depressed', 'hopeless', 'crying', 'tears', 'melancholy', 'down', 'low'],
    anger: ['angry', 'frustrated', 'irritated', 'rant', 'furious', 'annoyed', 'mad', 'upset'],
    joy: ['happy', 'joy', 'pleased', 'glad', 'excited', 'great', 'awesome', 'wonderful'],
    fatigue: ['tired', 'exhausted', 'exhaustion', 'worn out', 'drained', 'fatigued', 'worn', 'sleepy']
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