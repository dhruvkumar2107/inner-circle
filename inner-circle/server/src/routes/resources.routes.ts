import { Router, Request, Response } from 'express'
import { getResourcesByConcern, getSavedResources, ALL_RESOURCES, getRecommendations, type Recommendation } from '../modules/resources/resources'

const router = Router()

/**
 * GET /api/resources - Get all resources with optional filtering
 */
router.get('/', (req: Request, res: Response) => {
  const { concern, tier, language } = req.query
  let results = [...ALL_RESOURCES]

  if (concern) {
    results = getResourcesByConcern(
      concern as string,
      tier as string,
      language as string
    )
  }

  res.json({ resources: results })
})

/**
 * GET /api/resources/recommended - Get personalized recommendations
 */
router.get('/recommended', (req: Request, res: Response) => {
  const { concerns, tier, language, saved } = req.query
  
  // Student concerns (from recent check-ins, topics, etc.)
  const studentConcerns = concerns ? (concerns as string).split(',') : ['general']
  const studentTier = tier as string || 'Moderate'
  const studentLanguage = language as string || 'en'
  const recentlyUsed = saved ? (saved as string).split(',') : []

  const recommendations = getRecommendations(
    studentConcerns,
    studentTier,
    studentLanguage,
    recentlyUsed
  )

  res.json({ recommendations })
})

/**
 * GET /api/resources/saved - Get saved resources for user
 */
router.get('/saved', (req: Request, res: Response) => {
  const { userId, saved } = req.query
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' })
  }

  const resources = getSavedResources(userId as string, (req.query.saved as any)?.split(',').filter((s: string) => s.trim().length > 0) || [])
  res.json({ resources })
})

export default router