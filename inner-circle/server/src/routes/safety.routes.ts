import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { CRISIS_RESOURCES, INSTITUTION_CONTACTS } from '../modules/crisisResources'
import { addAudit, addFlag } from '../modules/store'

const router = Router()

const helpSchema = z.object({
  trigger: z.enum(['help-now-button', 'chat', 'assessment', 'journal']).default('help-now-button'),
  note: z.string().max(500).optional(),
})

/**
 * POST /api/safety/help-now
 * Deterministic safety pathway. Forces a high-priority review and returns the
 * crisis resources. The fuzzy score can never lower this tier.
 */
router.post('/help-now', requireAuth, (req, res) => {
  const parsed = helpSchema.safeParse(req.body ?? {})
  const trigger = parsed.success ? parsed.data.trigger : 'help-now-button'
  addFlag({
    userId: req.auth!.sub,
    alias: 'student',
    source: 'button',
    severity: 'high',
    summary: `"I need help now" activated (${trigger}).`,
    status: 'open',
    createdAt: new Date(),
  })
  addAudit({
    actorId: req.auth!.sub, role: req.auth!.role, action: 'help_now',
    targetUserId: req.auth!.sub, resource: 'safety/help-now', ip: req.ip, meta: { trigger },
  })
  res.json({
    safetyOverride: true,
    tier: 3,
    message: 'You are not alone. A trained supporter has been alerted and can reach out.',
    resources: CRISIS_RESOURCES,
    institution: INSTITUTION_CONTACTS,
  })
})

router.get('/resources', (_req, res) => {
  res.json({ resources: CRISIS_RESOURCES, institution: INSTITUTION_CONTACTS })
})

export default router
