import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth'
import { findUserById, listUsers } from '../modules/auth/store'
import {
  addAudit,
  flagsForUser,
  findFlag,
  latestInference,
  listFlags,
  listInferences,
} from '../modules/store'

const router = Router()

/** Every professional/admin read of a student-linked record is audit-logged. */
const auditRead = (req: Parameters<typeof requireAuth>[0], resource: string, targetUserId?: string): void => {
  addAudit({
    actorId: req.auth?.sub ?? 'unknown',
    role: req.auth?.role ?? 'unknown',
    action: 'read',
    ...(targetUserId ? { targetUserId } : {}),
    resource,
    ip: req.ip,
  })
}

/**
 * GET /api/pro/students — students assigned for support (alias + minimal ID only).
 * Real identity is never returned here.
 */
router.get('/students', requireAuth, requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const users = await listUsers()
    const students = users
      .filter(user => user.role === 'student')
      .map(user => {
        const latest = latestInference(user.id)
        return {
          id: user.id,
          alias: user.alias,
          tier: latest?.tier ?? null,
          level: latest?.level ?? 'Not assessed',
          riskScore: latest?.riskScore ?? null,
          trend: latest?.trend ?? 'Stable',
          flagged: flagsForUser(user.id).some(flag => flag.status === 'open'),
        }
      })
    auditRead(req as never, 'pro/students')
    res.json({ students })
  } catch (error) {
    next(error)
  }
})

/** GET /api/pro/review-queue — open human-in-the-loop reviews. */
router.get('/review-queue', requireAuth, requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const users = await listUsers()
    const aliasById = new Map(users.map(user => [user.id, user.alias]))
    const queue = listFlags()
      .filter(flag => flag.status === 'open')
      .map(flag => ({
        id: flag.id,
        studentId: flag.userId,
        alias: aliasById.get(flag.userId) ?? flag.alias,
        source: flag.source,
        severity: flag.severity,
        summary: flag.summary,
        createdAt: flag.createdAt,
      }))
    auditRead(req as never, 'pro/review-queue')
    res.json({ queue })
  } catch (error) {
    next(error)
  }
})

const reviewSchema = z.object({
  decision: z.enum(['confirmed', 'adjusted', 'dismissed']),
  note: z.string().max(500).optional(),
})

/** POST /api/pro/review/:id — confirm, adjust or dismiss an AI-suggested review. */
router.post('/review/:id', requireAuth, requireRole('professional', 'admin'), async (req, res, next) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please choose a review decision.' })
    return
  }
  const flag = findFlag(String(req.params.id))
  if (!flag) {
    res.status(404).json({ error: 'Review item not found.' })
    return
  }
  flag.status = parsed.data.decision
  flag.reviewedBy = req.auth!.sub
  flag.decision = parsed.data.decision
  if (parsed.data.note) flag.note = parsed.data.note
  addAudit({
    actorId: req.auth!.sub,
    role: req.auth!.role,
    action: `review_${parsed.data.decision}`,
    targetUserId: flag.userId,
    resource: `pro/review/${flag.id}`,
    ip: req.ip,
    meta: { note: parsed.data.note },
  })
  res.json({ flag })
})

/** GET /api/pro/students/:id/trend — fired-rule trace and trend for one student. */
router.get('/students/:id/trend', requireAuth, requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const user = await findUserById(String(req.params.id))
    if (!user) {
      res.status(404).json({ error: 'Student not found.' })
      return
    }
    const points = listInferences(user.id)
      .slice()
      .reverse()
      .map(item => ({
        date: item.createdAt,
        phq9: item.inputs.phq9,
        gad7: item.inputs.gad7,
        stress: item.inputs.stress,
        riskScore: item.riskScore,
        tier: item.tier,
        level: item.level,
        trend: item.trend ?? 'Stable',
      }))
    const latest = latestInference(user.id)
    auditRead(req as never, `pro/students/${user.id}/trend`, user.id)
    res.json({
      student: { id: user.id, alias: user.alias },
      points,
      latest,
      firedRules: latest?.firedRules ?? [],
      narrative: latest?.narrative ?? [],
    })
  } catch (error) {
    next(error)
  }
})

export default router
