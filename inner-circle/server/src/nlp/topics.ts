/**
 * Topic detection - identifies key concerns from text.
 * Used in the chatbot pipeline to tailor responses and recommendations.
 */

export const detectTopics = (text: string): { primary: string; secondary: string[]; confidence: number } => {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalized.split(/\s+/)
  
  // Concern categories and their keywords
  const concernCategories = {
    academic: ['academic', 'study', 'exam', 'pressure', 'grades', 'coursework', 'university', 'school', 'homework'],
    loneliness: ['lonely', 'alone', 'isolation', 'no friends', 'social', 'isolated', 'left out'],
    exam: ['exam', 'test', 'assessment', 'evaluation', 'quiz', 'midterm', 'final'],
    relationships: ['relationship', 'partner', 'boyfriend', 'girlfriend', 'breakup', 'dating', 'married'],
    sleep: ['sleep', 'insomnia', 'tired', 'rest', 'bedtime', 'exhausted', 'can\'t sleep', 'wide awake'],
    burnout: ['burnout', 'exhausted', 'overwhelmed', 'too much', 'breaking point', 'crushing', 'drained'],
    anxiety: ['anxiety', 'nervous', 'worry', 'panic', 'nervousness', 'on edge', 'stressful'],
    depression: ['depressed', 'hopeless', 'sad', 'hopeless', 'no point', 'worthless', 'giving up']
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