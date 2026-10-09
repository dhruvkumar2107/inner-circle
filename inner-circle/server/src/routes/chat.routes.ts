import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { runPipeline } from '../ai/chatPipeline'
import { addFlag, addAudit, latestInference } from '../modules/store'

const router = Router()

const messageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'hi', 'kn']).optional(),
})

/**
 * POST /api/chat — run the multi-stage supportive chat pipeline.
 * Works without any LLM key (rule-based fallback). Crisis language always
 * switches to the crisis-safe template and creates a review flag.
 */
router.post('/', requireAuth, async (req, res, next) => {
  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please type a message to continue.' })
    return
  }
  const userId = req.auth!.sub
  try {
    const latest = latestInference(userId)
    const output = await runPipeline({
      message: parsed.data.message,
      userId,
      language: parsed.data.language ?? 'en',
      tier: latest?.tier ?? 1,
      lastRiskScore: latest?.riskScore,
    })

    if (output.crisis.isCrisis) {
      addFlag({
        userId,
        alias: 'student',
        source: 'chat',
        severity: output.crisis.severity === 'high' ? 'high' : 'medium',
        summary: `Crisis language detected in chat (${output.crisis.language}).`,
        status: 'open',
        createdAt: new Date(),
      })
      addAudit({
        actorId: userId,
        role: req.auth!.role,
        action: 'crisis_detected',
        targetUserId: userId,
        resource: 'chat',
        ip: req.ip,
        meta: { phrase: output.crisis.detectedPhrase },
      })
    }

    res.json({
      reply: output.reply,
      sentiment: output.sentiment,
      emotion: output.emotion,
      topics: output.topics,
      crisis: output.crisis,
      recommendation: output.recommendation ?? null,
      riskScore: output.riskScore,
      tier: output.tier,
    })
  } catch (error) {
    next(error)
  }
})

export default router
