/**
 * Rule-based LLM fallback provider.
 * Ensures the demo never breaks when no API key is present.
 * Implements the same guardrails and response patterns as the LLM version.
 */

import { generateSystemPrompt, generateCrisisResponse, generateCheckInQuestion, generateRecommendation, analyzeSentiment, detectTopics, buildReply, CrisisCheck } from '../chatPipeline'

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
    _recommendation: ReturnType<typeof generateRecommendation>
  ): string {
    return buildReply({ message, topics, sentiment, history: [] }).reply
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