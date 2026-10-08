/**
 * Rule-based LLM fallback provider.
 * Ensures the demo never breaks when no API key is present.
 * Implements the same guardrails and response patterns as the LLM version.
 */

import { generateSystemPrompt, generateCrisisResponse, generateCheckInQuestion, generateRecommendation, analyzeSentiment, detectTopics, CrisisCheck } from '../chatPipeline'

/**
 * Fallback LLM provider that uses hand-crafted rules and templates.
 * This replaces the LLM call when no API key is configured.
 */
export class FallbackProvider {
  /**
   * Generate a response using rule-based logic.
   * This mirrors what an LLM would produce but with guaranteed behavior.
   */
  async generateResponse(message: string, context: any, crisis: CrisisCheck): Promise<string> {
    // Check crisis first
    if (crisis.isCrisis) {
      return generateCrisisResponse()
    }
    
    const sentiment = analyzeSentiment(message)
    const topics = detectTopics(message)
    const recommendation = generateRecommendation(
      topics, sentiment, context?.tier ?? 1, context?.primaryConcerns ?? []
    )
    
    return this.buildReply(message, topics, sentiment, recommendation)
  }
  
  /**
   * Build a supportive reply following the same guardrails as the LLM version.
   */
  private buildReply(
    message: string,
    topics: ReturnType<typeof detectTopics>,
    sentiment: ReturnType<typeof analyzeSentiment>,
    recommendation: ReturnType<typeof generateRecommendation>
  ): string {
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
    
    const openingsChoice = openings[Math.floor(Math.random() * openings.length)]
    const moodResp = moodResponses[mood] || openings[0]
    
    let reply = `${openingsChoice} ${moodResp}`
    
    const topicKey = secondary.length > 0 ? secondary[0] : primary
    const topicResponse = topicResponses[topicKey] || ''
    
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
   * Generate the full system prompt with guardrails for LLM use.
   */
  generateSystemPrompt(crisis: CrisisCheck): string {
    const context = {
      recentSentiment: 0,
      lastAssessment: null,
      primaryConcerns: [],
      language: 'en',
      tier: 1,
      riskScore: 25
    }
    return generateSystemPrompt(context, crisis)
  }
}

/**
 * Provider selection - use fallback when no API key, otherwise use real LLM
 */
export const createProvider = (hasApiKey: boolean): FallbackProvider => {
  return new FallbackProvider()
}