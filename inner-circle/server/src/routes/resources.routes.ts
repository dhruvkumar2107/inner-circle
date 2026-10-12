import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import {
  getResourcesByConcern,
  ALL_RESOURCES,
  getRecommendations,
} from '../modules/resources/resources'
import { listSavedResources, removeSavedResource, saveResource } from '../modules/store'

const router = Router()

/** GET /api/resources — all resources, optionally filtered by concern/tier/language. */
router.get('/', (req: Request, res: Response) => {
  const { concern, tier, language } = req.query
  const results = concern
    ? getResourcesByConcern(concern as string, (tier as string) || 'Low', (language as string) || 'en')
    : [...ALL_RESOURCES]
  res.json({ resources: results })
})

/** GET /api/resources/recommended — personalised recommendations with reasons. */
router.get('/recommended', (req: Request, res: Response) => {
  const { concerns, tier, language, saved } = req.query
  const studentConcerns = concerns ? (concerns as string).split(',').filter(Boolean) : ['general']
  const studentTier = (tier as string) || 'Moderate'
  const studentLanguage = (language as string) || 'en'
  const recentlyUsed = saved ? (saved as string).split(',').filter(Boolean) : []
  res.json({ recommendations: getRecommendations(studentConcerns, studentTier, studentLanguage, recentlyUsed) })
})

/** GET /api/resources/saved — the signed-in student's bookmarks. */
router.get('/saved', requireAuth, (req: Request, res: Response) => {
  const saved = listSavedResources(req.auth!.sub).map(item => item.resourceKey)
  res.json({ saved })
})

const saveSchema = z.object({ resourceKey: z.string().trim().min(1).max(200) })

/** POST /api/resources/saved — bookmark a resource. */
router.post('/saved', requireAuth, (req: Request, res: Response) => {
  const parsed = saveSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A valid resource is required.' })
    return
  }
  saveResource(req.auth!.sub, parsed.data.resourceKey)
  res.status(201).json({ saved: listSavedResources(req.auth!.sub).map(item => item.resourceKey) })
})

/** DELETE /api/resources/saved/:key — remove a bookmark. */
router.delete('/saved/:key', requireAuth, (req: Request, res: Response) => {
  removeSavedResource(req.auth!.sub, decodeURIComponent(String(req.params.key)))
  res.json({ saved: listSavedResources(req.auth!.sub).map(item => item.resourceKey) })
})

export default router
