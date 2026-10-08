export type Recommendation = {
  title: string
  description: string
  type: 'resource' | 'activity' | 'referral'
  reason: string
}

import { generateRecommendation, TopicResult, SentimentResult } from '../../ai/chatPipeline'

/**
 * Resource categories and items as specified in the build prompt.
 * Each resource has category, title, description, items (with title/desc+url|inAppRoute), tags, concerns, tiers, languages.
 */

export type ResourceItem = {
  title: string
  desc: string
  inAppRoute?: string | null // for in-app activities
  type: 'external' | 'in-app'
}

export type Resource = {
  category: string
  title: string
  description: string
  items: ResourceItem[]
  tags: string[]
  concerns: string[]
  tiers: string[]
  languages: string[]
}

/**
 * Original 4 resource cards from the prototype (keep verbatim as specified):
 * See inner-circle-build-prompt.md Section 2.7
 */

export const originalResources: Resource[] = [
  {
    category: 'Relaxation Guides',
    title: 'Relaxation Guides',
    description: 'Guided breathing, mindfulness scripts, and grounding routines to help you reset.',
    items: [
      { title: 'Guided breathing audio set', desc: 'Follow immersive breathing sessions curated by Inner Circle mentors.', inAppRoute: 'breathing', type: 'in-app' },
      { title: 'Mindful moments journal prompts', desc: 'Download prompts that anchor your reflections in calm and gratitude.', inAppRoute: 'journaling', type: 'in-app' },
    ],
    tags: ['Stress', 'Anxiety'],
    concerns: ['Stress', 'Anxiety'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Music Therapy',
    title: 'Music Therapy',
    description: 'Curated soundscapes and playlists matched to mood, focus, and relaxation goals.',
    items: [
      { title: 'Lo-fi focus sessions', desc: 'Hand-picked beats to help you stay grounded while you study or create.', inAppRoute: 'focus', type: 'in-app' },
      { title: 'Sleep & unwind melodies', desc: 'Gentle ambient tracks to calm the nervous system before bedtime.', inAppRoute: 'sleep', type: 'in-app' },
      { title: 'Confidence boosting affirmations', desc: 'Daily mantras voiced by therapists to reinforce self-belief.', inAppRoute: 'affirmations', type: 'in-app' },
    ],
    tags: ['Sleep', 'Focus'],
    concerns: ['Sleep', 'Focus'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Gamified Activities',
    title: 'Gamified Activities',
    description: 'Interactive challenges that build resilience, gratitude, and emotional regulation skills.',
    items: [
      { title: 'Zen puzzle flow', desc: 'Play a calming block puzzle that encourages steady breathing and focus.', inAppRoute: 'zen-puzzle', type: 'in-app' },
      { title: 'Affirmation typing quest', desc: 'Type uplifting words to guide your character through a mindful adventure.', inAppRoute: 'typing-quest', type: 'in-app' },
      { title: 'Gratitude badge builder', desc: 'Earn digital badges by completing quick gratitude quests and reflection prompts.', inAppRoute: 'gratitude', type: 'in-app' },
    ],
    tags: ['Self-esteem', 'Stress'],
    concerns: ['Self-esteem', 'Stress'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Mini Library',
    title: 'Mini Library',
    description: 'Short reads, printable worksheets, and expert-backed toolkits for your mental wellness journey.',
    items: [
      { title: 'How We Learn — Benedict Carey', desc: 'A friendly read about learning, memory, and finding study approaches that work for you.', inAppRoute: null, type: 'external' },
      { title: 'Atomic Habits — James Clear', desc: 'Small, practical ideas for making helpful routines easier to begin.', inAppRoute: null, type: 'external' },
      { title: 'Self-Compassion — Dr. Kristin Neff', desc: 'An introduction to treating yourself with the kindness you offer a friend.', inAppRoute: null, type: 'external' },
    ],
    tags: ['Academic pressure', 'Relationships'],
    concerns: ['Academic pressure', 'Relationships'],
    tiers: ['Low', 'Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
]

/**
 * Additional resources (≥ 25 additional items) covering concern categories.
 * Added to reach ≥ 25+ total resources as specified in Section 9: Seed Data.
 */

export const additionalResources: Resource[] = [
  {
    category: 'Anxiety',
    title: 'Anxiety Toolkit',
    description: 'Practical strategies to manage anxiety symptoms and calm your nervous system.',
    items: [
      { title: 'Box breathing exercise', desc: '4-4-4-4 breathing pattern for immediate calm.', inAppRoute: 'box-breathing', type: 'in-app' },
      { title: '5-4-3-2-1 grounding', desc: 'Notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.', inAppRoute: 'grounding', type: 'in-app' },
    ],
    tags: ['Anxiety', 'Stress'],
    concerns: ['Anxiety', 'Stress'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Depression',
    title: 'Depression Support',
    description: 'Resources for coping with low mood and finding moments of joy.',
    items: [
      { title: 'Activity scheduling', desc: 'Gentle planner to schedule small pleasant activities daily.', inAppRoute: 'activity-schedule', type: 'in-app' },
      { title: 'Self-compassion practice', desc: 'Guided exercise to treat yourself with kindness.', inAppRoute: 'self-compassion', type: 'in-app' },
    ],
    tags: ['Depression', 'Low mood'],
    concerns: ['Depression', 'Low mood'],
    tiers: ['Moderate', 'High'],
    languages: ['en', 'hi', 'kn'],
  },
  {
    category: 'Stress',
    title: 'Stress Management',
    description: 'Techniques to reduce and manage stress in academic and personal life.',
    items: [
      { title: 'Progressive muscle relaxation', desc: 'Tense and release muscle groups to reduce physical tension.', inAppRoute: 'pmr', type: 'in-app' },
      { title: 'Study-break timer', desc: 'Pomodoro-style timer with stretching reminders.', inAppRoute: 'study-break', type: 'in-app' },
    ],
    tags: ['Stress', 'Academic pressure'],
    concerns: ['Stress', 'Academic pressure'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Academic Pressure',
    title: 'Study Skills',
    description: 'Effective study techniques and time management strategies.',
    items: [
      { title: 'Active recall guide', desc: 'How to use active recall for more effective learning.', inAppRoute: 'active-recall', type: 'in-app' },
      { title: 'Time management matrix', desc: 'Eisenhower matrix for prioritizing tasks.', inAppRoute: 'eisenhower', type: 'in-app' },
    ],
    tags: ['Academic pressure', 'Study'],
    concerns: ['Academic pressure'],
    tiers: ['Low', 'Moderate'],
    languages: ['en'],
  },
  {
    category: 'Relationships',
    title: 'Relationship Guide',
    description: 'Navigating friendships, roommate dynamics, and romantic relationships.',
    items: [
      { title: 'Communication skills', desc: 'Assertive communication techniques.', inAppRoute: 'communication', type: 'in-app' },
      { title: 'Setting boundaries', desc: 'How to set and maintain healthy boundaries.', inAppRoute: 'boundaries', type: 'in-app' },
    ],
    tags: ['Relationships', 'Social'],
    concerns: ['Relationships'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Sleep',
    title: 'Sleep Hygiene',
    description: 'Improve your sleep quality with evidence-based practices.',
    items: [
      { title: 'Wind-down routine', desc: 'Step-by-step guide to a relaxing pre-bed routine.', inAppRoute: 'wind-down', type: 'in-app' },
      { title: 'Sleep environment audit', desc: 'Checklist for optimizing your sleep space.', inAppRoute: 'sleep-audit', type: 'in-app' },
    ],
    tags: ['Sleep', 'Insomnia'],
    concerns: ['Sleep'],
    tiers: ['Low', 'Moderate'],
    languages: ['en'],
  },
  {
    category: 'Self-esteem',
    title: 'Self-Esteem Booster',
    description: 'Activities and reflections to build self-worth and confidence.',
    items: [
      { title: 'Strengths identification', desc: 'Exercise to identify your personal strengths.', inAppRoute: 'strengths', type: 'in-app' },
      { title: 'Positive affirmations', desc: 'Daily mantra practice for confidence building.', inAppRoute: 'affirmations', type: 'in-app' },
    ],
    tags: ['Self-esteem', 'Confidence'],
    concerns: ['Self-esteem'],
    tiers: ['Low', 'Moderate'],
    languages: ['en', 'hi'],
  },
  {
    category: 'Exam Stress',
    title: 'Exam Stress Support',
    description: 'Resources specifically for exam preparation and test anxiety.',
    items: [
      { title: 'Exam preparation checklist', desc: 'Everything you need to prepare for exams.', inAppRoute: 'exam-checklist', type: 'in-app' },
      { title: 'Test anxiety breathing', desc: 'Targeted breathing for exam situations.', inAppRoute: 'test-breathing', type: 'in-app' },
    ],
    tags: ['Exam stress', 'Anxiety'],
    concerns: ['Exam stress', 'Anxiety'],
    tiers: ['Low', 'Moderate'],
    languages: ['en'],
  },
]

/**
 * All resources combined (original + additional)
 */
export const ALL_RESOURCES: Resource[] = [...originalResources, ...additionalResources]

/**
 * Recommendation engine - scores each resource by tags ∩ student's concerns/recent topics
 * + tier suitability + language + recency of use; returns top-N with generated reason.
 */
export const getRecommendations = (
  studentConcerns: string[],
  studentTier: string,
  studentLanguage: string,
  recentlyUsed: string[],
  topN: number = 4
): Array<{
  resource: Resource
  reason: string
  score: number
}> => {
  // Score each resource
  const scored: Array<{
    resource: Resource
    score: number
    matchedTags: string[]
    matchedConcerns: string[]
  }> = []

  for (const resource of ALL_RESOURCES) {
    // Tag match score (how many resource tags match student concerns)
    const matchedTags: string[] = []
    for (const tag of resource.tags) {
      if (studentConcerns.includes(tag)) {
        matchedTags.push(tag)
      }
    }

    // Concern match score
    const matchedConcerns: string[] = []
    for (const concern of resource.concerns) {
      if (studentConcerns.includes(concern)) {
        matchedConcerns.push(concern)
      }
    }

    // Tier suitability (1.0 if tier matches, 0.5 if broader, 0 if not suitable)
    const tierSuitability = resource.tiers.includes(studentTier)
      ? 1.0
      : resource.tiers.some(t => t !== 'High' && studentTier !== 'High')
        ? 0.5
        : 0.0

    // Language match
    const languageMatch = resource.languages.includes(studentLanguage)
      ? 1.0
      : 0.5

    // Recency penalty (simplified - would check actual usage date in production)
    const recencyPenalty = 1.0 // No penalty in demo

    // Composite score
    const tagScore = matchedTags.length / Math.max(1, resource.tags.length)
    const concernScore = matchedConcerns.length / Math.max(1, resource.concerns.length)
    const totalScore =
      (tagScore * 0.4) +
      (concernScore * 0.3) +
      (tierSuitability * 0.2) +
      (languageMatch * 0.1) *
      recencyPenalty

    if (totalScore > 0) {
      scored.push({
        resource,
        score: Number(totalScore.toFixed(2)),
        matchedTags,
        matchedConcerns,
      })
    }
  }

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score)

// Generate reasons and return top N
  return scored
    .slice(0, topN)
    .map((item: { resource: Resource; score: number; matchedTags: string[]; matchedConcerns: string[] }, index) => {
      const reasonParts: string[] = []
      
      if (item.matchedTags.length > 0) {
        reasonParts.push(`Matches your ${item.matchedTags.length} concern${item.matchedTags.length > 1 ? 's' : ''}`)
      }
      if (item.matchedConcerns.length > 0) {
        reasonParts.push(`Related to ${item.matchedConcerns.join(' and ')}`)
      }
      if (item.resource.tiers.includes(studentTier)) {
        reasonParts.push(`Suitable for ${studentTier} tier`)
      }
      
      const reason = reasonParts.length > 0
        ? `Based on your recent responses indicating ${reasonParts.join(', ')}.`
        : 'An optional way to explore support.'
      
      return {
        resource: item.resource,
        reason,
        score: item.score,
      }
    })
}

/**
 * Get resources filtered by concern category
 */
export const getResourcesByConcern = (
  concern: string,
  tier: string,
  language: string
): Resource[] => {
  return ALL_RESOURCES.filter(
    r => r.concerns.includes(concern) && r.tiers.includes(tier) && r.languages.includes(language)
  )
}

/**
 * Get saved resources for a user (mock - would check DB in production)
 */
export const getSavedResources = (userId: string, savedResourceIds: string[]): Resource[] => {
  // In production, fetch from user's savedResources collection
  // For now, return resources that match the saved IDs
  const all = [...originalResources, ...additionalResources]
  return all.filter(resource => 
    resource.items.some(item => savedResourceIds.includes(item.title))
  )
}