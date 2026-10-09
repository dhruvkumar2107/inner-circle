import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { checkCrisisLanguage } from '../nlp/crisis'
import { findUserById } from '../modules/auth/store'
import {
  addAudit,
  addFlag,
  addForumPost,
  findForumPost,
  listForumPosts,
  type ForumPostRecord,
} from '../modules/store'

const router = Router()

export const FORUM_ROOMS = [
  { id: 'exam-anxiety', name: 'Exam Anxiety' },
  { id: 'sleep', name: 'Sleep' },
  { id: 'loneliness', name: 'Loneliness' },
  { id: 'burnout', name: 'Burnout' },
  { id: 'relationships', name: 'Relationships' },
  { id: 'wins-gratitude', name: 'Wins & Gratitude' },
  { id: 'general', name: 'General' },
] as const

/** Public projection: peers only ever see the anonymous alias, never identifiers. */
const toPublic = (post: ForumPostRecord) => ({
  id: post.id,
  roomId: post.roomId,
  room: post.room,
  authorAlias: post.authorAlias,
  body: post.body,
  reactions: post.reactions,
  reports: post.reports,
  createdAt: post.createdAt,
})

router.get('/rooms', (_req, res) => {
  res.json({ rooms: FORUM_ROOMS })
})

router.get('/posts', (req, res) => {
  const roomId = typeof req.query.roomId === 'string' ? req.query.roomId : undefined
  const posts = listForumPosts(roomId)
    .filter(post => post.status === 'visible')
    .map(toPublic)
  res.json({ posts })
})

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  roomId: z.string().trim().min(1).max(60).default('general'),
})

router.post('/posts', requireAuth, async (req, res, next) => {
  const parsed = postSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please write a short message to share.' })
    return
  }
  try {
    const user = await findUserById(req.auth!.sub)
    if (!user) {
      res.status(404).json({ error: 'Account not found.' })
      return
    }
    const room = FORUM_ROOMS.find(item => item.id === parsed.data.roomId) ?? FORUM_ROOMS[FORUM_ROOMS.length - 1]
    const crisis = checkCrisisLanguage(parsed.data.body)

    const post = addForumPost({
      roomId: room.id,
      room: room.name,
      authorAlias: user.alias,
      authorId: user.id,
      body: parsed.data.body,
      reactions: { support: 0, relate: 0, grow: 0 },
      reports: 0,
      status: crisis.isCrisis ? 'hidden' : 'visible',
      flaggedCrisis: crisis.isCrisis,
      createdAt: new Date(),
    })

    if (crisis.isCrisis) {
      addFlag({
        userId: user.id,
        alias: user.alias,
        source: 'forum',
        severity: crisis.severity === 'high' ? 'high' : 'medium',
        summary: 'Crisis language detected in a community post; post hidden and author support offered.',
        status: 'open',
        createdAt: new Date(),
      })
      res.status(201).json({
        post: null,
        hidden: true,
        message: 'We care about you. Your post was kept private so a trained supporter can reach out with support.',
      })
      return
    }

    res.status(201).json({ post: toPublic(post), hidden: false })
  } catch (error) {
    next(error)
  }
})

const reactSchema = z.object({ type: z.enum(['support', 'relate', 'grow']) })

router.post('/posts/:id/react', requireAuth, (req, res) => {
  const parsed = reactSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Unknown reaction.' })
    return
  }
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  post.reactions[parsed.data.type] += 1
  res.json({ post: toPublic(post) })
})

router.post('/posts/:id/report', requireAuth, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  post.reports += 1
  addFlag({
    userId: post.authorId,
    alias: post.authorAlias,
    source: 'forum',
    severity: 'low',
    summary: 'A community post was reported for moderator review.',
    status: 'open',
    createdAt: new Date(),
  })
  addAudit({
    actorId: req.auth!.sub, role: req.auth!.role, action: 'forum_report',
    targetUserId: post.authorId, resource: `forum/${post.id}`, ip: req.ip,
  })
  res.json({ ok: true, message: 'Thank you. A moderator will review this post.' })
})

export default router
