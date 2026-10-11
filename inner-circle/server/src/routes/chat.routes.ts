import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { runPipeline } from '../ai/chatPipeline'
import {
  addFlag,
  addAudit,
  latestInference,
  createChatSession,
  listChatSessions,
  findChatSession,
  listChatMessages,
  addChatMessage,
  touchChatSession,
  removeChatSession,
} from '../modules/store'

const router = Router()

const messageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'hi', 'kn']).optional(),
  sessionId: z.string().uuid().optional(),
})

const sessionSchema = z.object({ title: z.string().trim().max(80).optional() })

const STARTER_SUGGESTIONS = [
  { label: "I'm stressed about exams", prompt: "I'm really stressed about my exams." },
  { label: "I can't concentrate", prompt: "I can't concentrate when I study." },
  { label: "I feel lonely", prompt: 'I feel really lonely lately.' },
  { label: "I can't sleep", prompt: "I'm having trouble sleeping." },
  { label: 'Give me a breathing exercise', prompt: 'Can you guide me through a breathing exercise?' },
]

/** GET /api/chat/suggestions — starter prompts for an empty conversation. */
router.get('/suggestions', requireAuth, (_req, res) => {
  res.json({ suggestions: STARTER_SUGGESTIONS })
})

/** GET /api/chat/sessions — list the current user's conversations. */
router.get('/sessions', requireAuth, (req, res) => {
  res.json({ sessions: listChatSessions(req.auth!.sub) })
})

/** POST /api/chat/sessions — start a new conversation. */
router.post('/sessions', requireAuth, (req, res) => {
  const parsed = sessionSchema.safeParse(req.body ?? {})
  const session = createChatSession(req.auth!.sub, parsed.success && parsed.data.title ? parsed.data.title : 'New conversation')
  res.status(201).json({ session })
})

/** GET /api/chat/sessions/:id — a conversation with its messages. */
router.get('/sessions/:id', requireAuth, (req, res) => {
  const session = findChatSession(String(req.params.id), req.auth!.sub)
  if (!session) {
    res.status(404).json({ error: 'Conversation not found.' })
    return
  }
  res.json({ session, messages: listChatMessages(session.id) })
})

/** DELETE /api/chat/sessions/:id — remove a conversation. */
router.delete('/sessions/:id', requireAuth, (req, res) => {
  const removed = removeChatSession(String(req.params.id), req.auth!.sub)
  if (!removed) {
    res.status(404).json({ error: 'Conversation not found.' })
    return
  }
  res.json({ ok: true })
})

/**
 * POST /api/chat — run the multi-stage supportive chat pipeline.
 * Conversations are persisted per user so the assistant keeps context.
 * Crisis language always switches to the crisis-safe template and creates a
 * review flag. When an LLM key is configured it is used; otherwise the
 * context-aware rule engine runs (reported as `provider`).
 */
router.post('/', requireAuth, async (req, res, next) => {
  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please type a message to continue.' })
    return
  }
  const userId = req.auth!.sub
  try {
    let session = parsed.data.sessionId ? findChatSession(parsed.data.sessionId, userId) : undefined
    if (parsed.data.sessionId && !session) {
      res.status(404).json({ error: 'Conversation not found.' })
      return
    }
    if (!session) session = createChatSession(userId, 'New conversation')

    const history = listChatMessages(session.id).map(item => ({ role: item.role, text: item.text, at: item.createdAt.toISOString() }))
    const latest = latestInference(userId)

    const output = await runPipeline({
      message: parsed.data.message,
      userId,
      language: parsed.data.language ?? 'en',
      tier: latest?.tier ?? 1,
      lastRiskScore: latest?.riskScore,
      history,
    })

    const userMessage = addChatMessage({
      sessionId: session.id,
      userId,
      role: 'user',
      text: parsed.data.message,
      sentiment: output.sentiment.score,
      topic: output.topics.primary,
      crisis: output.crisis.isCrisis,
      createdAt: new Date(),
    })

    const assistantMessage = addChatMessage({
      sessionId: session.id,
      userId,
      role: 'assistant',
      text: output.reply,
      sentiment: output.sentiment.score,
      topic: output.topics.primary,
      suggestions: output.suggestions,
      provider: output.provider,
      createdAt: new Date(),
    })

    const isFirst = listChatMessages(session.id).filter(item => item.role === 'user').length === 1
    touchChatSession(session.id, isFirst ? parsed.data.message : undefined)

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
      sessionId: session.id,
      userMessage,
      message: assistantMessage,
      reply: output.reply,
      suggestions: output.suggestions,
      provider: output.provider,
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
