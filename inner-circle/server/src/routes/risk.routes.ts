import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { inferRisk } from '../fuzzy/engine'
import {
  addFlag,
  addInference,
  computeTrend,
  listInferences,
  latestInference,
} from '../modules/store'

const router = Router()

const inferSchema = z.object({
  phq9: z.number().min(0).max(27),
  gad7: z.number().min(0).max(21),
  sentiment: z.number().min(-1).max(1),
  stress: z.number().min(1).max(10),
  functional: z.number().min(0).max(10),
  item9Flag: z.boolean().optional(),
  crisisDetected: z.boolean().optional(),
  persist: z.boolean().optional(),
})

/**
 * POST /api/risk/infer
 * Runs the explainable Mamdani FIS and (when persist !== false) stores the point.
 * A deterministic safety override forces Tier 3 regardless of the fuzzy score.
 */
router.post('/infer', requireAuth, (req, res) => {
  const parsed = inferSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide valid assessment inputs.' })
    return
  }
  const userId = req.auth!.sub
  const safetyOverride = parsed.data.item9Flag === true || parsed.data.crisisDetected === true
  const result = inferRisk({
    phq9: parsed.data.phq9,
    gad7: parsed.data.gad7,
    sentiment: parsed.data.sentiment,
    stress: parsed.data.stress,
    functional: parsed.data.functional,
    safetyOverride,
  })

  if (parsed.data.persist !== false) {
    const priorScores = listInferences(userId).map(item => item.riskScore)
    const trend = computeTrend([...priorScores, result.riskScore].reverse())
    addInference({
      userId,
      inputs: {
        phq9: parsed.data.phq9,
        gad7: parsed.data.gad7,
        sentiment: parsed.data.sentiment,
        stress: parsed.data.stress,
        functional: parsed.data.functional,
      },
      memberships: result.memberships,
      firedRules: result.firedRules,
      contributors: result.contributors,
      narrative: result.narrative,
      riskScore: result.riskScore,
      tier: result.tier,
      level: result.level,
      safetyOverride,
      trend,
      createdAt: new Date(),
    })

    if (safetyOverride || result.tier === 3) {
      addFlag({
        userId,
        alias: 'student',
        source: 'assessment',
        severity: 'high',
        summary: safetyOverride
          ? 'Safety override triggered by a screening safety item or the help-now pathway.'
          : 'Risk inference reached the high tier and needs human review.',
        status: 'open',
        createdAt: new Date(),
      })
    }
  }

  res.json(result)
})

/** GET /api/risk/latest — most recent inference for the signed-in student. */
router.get('/latest', requireAuth, (req, res) => {
  res.json({ inference: latestInference(req.auth!.sub) ?? null })
})

/** GET /api/risk/trend — timeline points for charts. */
router.get('/trend', requireAuth, (req, res) => {
  const points = listInferences(req.auth!.sub)
    .slice()
    .reverse()
    .map(item => ({
      id: item.id,
      date: item.createdAt,
      phq9: item.inputs.phq9,
      gad7: item.inputs.gad7,
      stress: item.inputs.stress,
      riskScore: item.riskScore,
      tier: item.tier,
      level: item.level,
      trend: item.trend ?? 'Stable',
    }))
  const latest = points[points.length - 1]
  res.json({ points, trend: latest?.trend ?? 'Stable' })
})

/** GET /api/risk/explain/:id — full fired-rule trace. */
router.get('/explain/:id', requireAuth, (req, res) => {
  const inference = listInferences(req.auth!.sub).find(item => item.id === req.params.id)
  if (!inference) {
    res.status(404).json({ error: 'Inference not found.' })
    return
  }
  res.json({ inference })
})

export default router
