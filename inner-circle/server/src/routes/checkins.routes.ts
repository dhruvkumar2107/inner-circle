import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { inferRisk } from '../fuzzy/engine'
import { analyzeSentiment } from '../nlp/sentiment'
import {
  addCheckin,
  addFlag,
  addInference,
  computeTrend,
  listAssessments,
  listCheckins,
  listInferences,
} from '../modules/store'

const router = Router()

const checkinSchema = z.object({
  mood: z.enum(['Good', 'Okay', 'Stressed', 'Low', 'Overwhelmed']),
  stress: z.number().min(1).max(10),
  functionalImpact: z.number().min(0).max(10),
  note: z.string().max(500).optional(),
  sentiment: z.number().min(-1).max(1).optional(),
})

/** POST /api/checkins — light monitoring check-in, feeds the fuzzy risk module. */
router.post('/', requireAuth, (req, res) => {
  const parsed = checkinSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide a valid check-in.' })
    return
  }
  const userId = req.auth!.sub
  const noteSentiment = parsed.data.note ? analyzeSentiment(parsed.data.note).score : 0
  const sentiment = parsed.data.sentiment ?? noteSentiment

  const checkin = addCheckin({
    userId,
    mood: parsed.data.mood,
    stress: parsed.data.stress,
    functionalImpact: parsed.data.functionalImpact,
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
    sentiment,
    takenAt: new Date(),
  })

  const assessments = listAssessments(userId)
  const lastPhq = assessments.find(item => item.type === 'PHQ9')?.total ?? 0
  const lastGad = assessments.find(item => item.type === 'GAD7')?.total ?? 0

  const result = inferRisk({
    phq9: lastPhq,
    gad7: lastGad,
    sentiment,
    stress: parsed.data.stress,
    functional: parsed.data.functionalImpact,
    safetyOverride: false,
  })
  const priorScores = listInferences(userId).map(item => item.riskScore)
  const trend = computeTrend([...priorScores, result.riskScore].reverse())

  addInference({
    userId,
    inputs: { phq9: lastPhq, gad7: lastGad, sentiment, stress: parsed.data.stress, functional: parsed.data.functionalImpact },
    memberships: result.memberships,
    firedRules: result.firedRules,
    contributors: result.contributors,
    narrative: result.narrative,
    riskScore: result.riskScore,
    tier: result.tier,
    level: result.level,
    safetyOverride: false,
    trend,
    createdAt: new Date(),
  })

  const recent = listInferences(userId)
  const worsening = recent.slice(0, 3).every(item => item.trend === 'Worsening')
  if (worsening) {
    addFlag({
      userId,
      alias: 'student',
      source: 'checkin',
      severity: 'medium',
      summary: 'Stress indicators have increased across the last three check-ins.',
      status: 'open',
      createdAt: new Date(),
    })
  }

  res.status(201).json({
    checkin,
    risk: result,
    trend,
    worsening,
    message: 'Check-in saved.',
  })
})

/** GET /api/checkins — check-in history. */
router.get('/', requireAuth, (req, res) => {
  res.json({ checkins: listCheckins(req.auth!.sub) })
})

export default router
