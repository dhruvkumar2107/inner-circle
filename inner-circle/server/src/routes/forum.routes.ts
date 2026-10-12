import { Router } from 'express'
import { z } from 'zod'
import { optionalAuth, requireAuth, requireUser } from '../middleware/auth'
import { checkCrisis } from '../ai/chatPipeline'
import {
  addAudit,
  addFlag,
  addForumComment,
  addForumPost,
  addForumReply,
  countForumComments,
  deleteForumComment,
  deleteForumPost,
  deleteForumReply,
  findForumComment,
  findForumPost,
  findForumReply,
  listForumComments,
  listForumPosts,
  updateForumComment,
  updateForumPost,
  type ForumCommentRecord,
  type ForumPostRecord,
} from '../modules/store'

const router = Router()

const postSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  body: z.string().trim().min(5).max(2000),
  roomId: z.string().optional(),
})

const commentSchema = z.object({ body: z.string().trim().min(2).max(1000) })
const replySchema = z.object({ body: z.string().trim().min(2).max(1000) })

const FORUM_ROOMS = [
  { id: 'general', name: 'General Wellbeing' },
  { id: 'exam-anxiety', name: 'Exam Anxiety' },
  { id: 'stress-management', name: 'Stress Management' },
  { id: 'peer-support', name: 'Peer Support' },
  { id: 'self-care', name: 'Self-Care & Mindfulness' },
  { id: 'relationships', name: 'Relationships' },
  { id: 'sleep', name: 'Sleep & Relaxation' },
  { id: 'loneliness', name: 'Loneliness' },
  { id: 'burnout', name: 'Burnout' },
  { id: 'wins-gratitude', name: 'Wins & Gratitude' },
]

const isModerator = (role?: string): boolean => role === 'admin' || role === 'professional'

const roomName = (roomId: string): string =>
  FORUM_ROOMS.find(room => room.id === roomId)?.name ?? 'General Wellbeing'

/** Public, PII-safe projection. Never exposes authorId/email/real name. */
const toPublicPost = (post: ForumPostRecord, viewerId?: string) => ({
  id: post.id,
  roomId: post.roomId,
  room: post.room,
  authorAlias: post.authorAlias,
  ...(post.title ? { title: post.title } : {}),
  body: post.body,
  reactions: post.reactions,
  reacted: viewerId ? post.reactedBy?.[viewerId] ?? [] : [],
  reports: post.reports,
  flaggedCrisis: post.flaggedCrisis,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt ?? post.createdAt,
  commentCount: countForumComments(post.id),
  mine: Boolean(viewerId && post.authorId === viewerId),
})

const toPublicComment = (comment: ForumCommentRecord, viewerId?: string) => ({
  id: comment.id,
  postId: comment.postId,
  authorAlias: comment.authorAlias,
  body: comment.body,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt ?? comment.createdAt,
  mine: Boolean(viewerId && comment.authorId === viewerId),
  replies: comment.replies.map(reply => ({
    id: reply.id,
    authorAlias: reply.authorAlias,
    body: reply.body,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt ?? reply.createdAt,
    mine: Boolean(viewerId && reply.authorId === viewerId),
  })),
})

router.get('/rooms', (_req, res) => {
  const posts = listForumPosts().filter(post => post.status !== 'hidden')
  res.json({
    rooms: FORUM_ROOMS.map(room => ({
      ...room,
      postCount: posts.filter(post => post.roomId === room.id).length,
    })),
  })
})

router.get('/posts', optionalAuth, (req, res) => {
  const { roomId, q, sort = 'newest', limit = '10', offset = '0' } = req.query
  let posts = listForumPosts(roomId ? String(roomId) : undefined).filter(p => p.status !== 'hidden')

  const term = typeof q === 'string' ? q.trim().toLowerCase() : ''
  if (term) {
    posts = posts.filter(p => `${p.title ?? ''} ${p.body} ${p.room}`.toLowerCase().includes(term))
  }

  const popularity = (p: ForumPostRecord): number =>
    p.reactions.support + p.reactions.relate + p.reactions.grow + countForumComments(p.id) * 2

  posts.sort((a, b) => {
    if (sort === 'oldest') return +a.createdAt - +b.createdAt
    if (sort === 'popular') return popularity(b) - popularity(a) || +b.createdAt - +a.createdAt
    return +b.createdAt - +a.createdAt
  })

  const lim = Math.max(1, Math.min(50, parseInt(String(limit), 10) || 10))
  const off = Math.max(0, parseInt(String(offset), 10) || 0)
  const total = posts.length
  const page = posts.slice(off, off + lim)
  res.json({
    posts: page.map(post => toPublicPost(post, req.auth?.sub)),
    total,
    limit: lim,
    offset: off,
    hasMore: off + page.length < total,
  })
})

router.get('/posts/:id', optionalAuth, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post || post.status === 'hidden') {
    res.status(404).json({ error: 'This discussion is no longer available.' })
    return
  }
  res.json({
    post: toPublicPost(post, req.auth?.sub),
    comments: listForumComments(post.id).map(comment => toPublicComment(comment, req.auth?.sub)),
  })
})

router.post('/posts', requireAuth, requireUser, (req, res) => {
  const parsed = postSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please share a title and a message (5-2000 characters).' })
    return
  }
  const role = req.auth!.role
  const alias = req.user?.alias || req.user?.firstName || role

  // Safety moderation: self-harm / crisis content is hidden from the feed,
  // the author gets a caring message, and a review flag is raised.
  const crisis = checkCrisis(parsed.data.body)
  const room = FORUM_ROOMS.find(r => r.id === parsed.data.roomId) || FORUM_ROOMS[0]

  const post = addForumPost({
    roomId: room.id,
    room: room.name,
    authorAlias: alias,
    authorId: req.auth!.sub,
    ...(parsed.data.title ? { title: parsed.data.title } : {}),
    body: parsed.data.body,
    reactions: { support: 0, relate: 0, grow: 0 },
    reports: 0,
    reportedBy: [],
    status: crisis.isCrisis ? 'hidden' : 'visible',
    flaggedCrisis: crisis.isCrisis,
    createdAt: new Date(),
  })

  if (crisis.isCrisis) {
    addFlag({
      userId: req.auth!.sub,
      alias,
      source: 'forum',
      severity: 'high',
      summary: 'Self-harm or crisis language detected in a community post (hidden for safety).',
      status: 'open',
      createdAt: new Date(),
    })
    addAudit({
      actorId: req.auth!.sub, role, action: 'forum_crisis_hidden', targetUserId: req.auth!.sub,
      resource: 'forum', ip: req.ip, meta: { postId: post.id },
    })
    res.status(201).json({
      post: toPublicPost(post, req.auth!.sub),
      safety: {
        hidden: true,
        message:
          "We've hidden that post to keep the community safe, and we're glad you shared how you feel. You deserve support right now — please reach out to a person who can be with you: Tele-MANAS 14416, KIRAN 1800-599-0019, or Emergency 112. You can also use the “I need help now” button.",
      },
    })
    return
  }

  res.status(201).json({ post: toPublicPost(post, req.auth!.sub) })
})

router.put('/posts/:id', requireAuth, requireUser, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  if (!(post.authorId === req.auth!.sub || isModerator(req.auth!.role))) {
    res.status(403).json({ error: 'You can only edit your own posts.' })
    return
  }
  const parsed = postSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid update.' })
    return
  }
  const patch: Partial<ForumPostRecord> = { ...parsed.data, updatedAt: new Date() }
  if (parsed.data.roomId) {
    patch.roomId = parsed.data.roomId
    patch.room = roomName(parsed.data.roomId)
  }
  const updated = updateForumPost(post.id, patch)
  res.json({ post: toPublicPost(updated!, req.auth!.sub) })
})

router.delete('/posts/:id', requireAuth, requireUser, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  if (!(post.authorId === req.auth!.sub || isModerator(req.auth!.role))) {
    res.status(403).json({ error: 'You can only delete your own posts.' })
    return
  }
  deleteForumPost(post.id)
  res.json({ ok: true })
})

router.post('/posts/:id/react', requireAuth, requireUser, (req, res) => {
  const schema = z.object({ type: z.enum(['support', 'relate', 'grow']) })
  const parsed = schema.safeParse(req.body)
  const post = findForumPost(String(req.params.id))
  if (!post || !parsed.success) {
    res.status(400).json({ error: 'Invalid reaction.' })
    return
  }
  const uid = req.auth!.sub
  post.reactedBy = post.reactedBy ?? {}
  const list = post.reactedBy[uid] ?? []
  if (list.includes(parsed.data.type)) {
    post.reactions[parsed.data.type] = Math.max(0, post.reactions[parsed.data.type] - 1)
    post.reactedBy[uid] = list.filter(t => t !== parsed.data.type)
  } else {
    post.reactions[parsed.data.type] = (post.reactions[parsed.data.type] || 0) + 1
    post.reactedBy[uid] = [...list, parsed.data.type]
  }
  res.json({ post: toPublicPost(post, uid) })
})

router.post('/posts/:id/report', requireAuth, requireUser, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  post.reportedBy = post.reportedBy ?? []
  if (post.reportedBy.includes(req.auth!.sub)) {
    res.json({ ok: true, reports: post.reports, alreadyReported: true })
    return
  }
  post.reportedBy.push(req.auth!.sub)
  post.reports = (post.reports || 0) + 1
  if (post.reports >= 5 && post.status !== 'hidden') {
    post.status = 'hidden'
    addFlag({
      userId: post.authorId,
      alias: post.authorAlias,
      source: 'forum',
      severity: 'medium',
      summary: 'A community post was hidden after multiple reports and needs moderator review.',
      status: 'open',
      createdAt: new Date(),
    })
  }
  res.json({ ok: true, reports: post.reports })
})

router.get('/posts/:id/comments', optionalAuth, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  res.json({ comments: listForumComments(post.id).map(comment => toPublicComment(comment, req.auth?.sub)) })
})

router.post('/posts/:id/comments', requireAuth, requireUser, (req, res) => {
  const parsed = commentSchema.safeParse(req.body)
  const post = findForumPost(String(req.params.id))
  if (!post || !parsed.success) {
    res.status(400).json({ error: 'Please write a comment between 2 and 1000 characters.' })
    return
  }
  const alias = req.user?.alias || req.user?.firstName || req.auth!.role
  const comment = addForumComment({
    postId: post.id,
    authorId: req.auth!.sub,
    authorAlias: alias,
    body: parsed.data.body,
    createdAt: new Date(),
  })
  res.status(201).json({ comment: toPublicComment(comment, req.auth!.sub) })
})

router.post('/comments/:id/replies', requireAuth, requireUser, (req, res) => {
  const parsed = replySchema.safeParse(req.body)
  const comment = findForumComment(String(req.params.id))
  if (!comment || !parsed.success) {
    res.status(400).json({ error: 'Please write a reply between 2 and 1000 characters.' })
    return
  }
  const alias = req.user?.alias || req.user?.firstName || req.auth!.role
  const reply = addForumReply(comment.id, {
    authorId: req.auth!.sub,
    authorAlias: alias,
    body: parsed.data.body,
    createdAt: new Date(),
  })
  res.status(201).json({
    reply: {
      id: reply!.id,
      authorAlias: reply!.authorAlias,
      body: reply!.body,
      createdAt: reply!.createdAt,
      updatedAt: reply!.createdAt,
      mine: true,
    },
  })
})

router.put('/comments/:id', requireAuth, requireUser, (req, res) => {
  const parsed = commentSchema.safeParse(req.body)
  const comment = findForumComment(String(req.params.id))
  if (!comment || !parsed.success) {
    res.status(400).json({ error: 'Invalid comment.' })
    return
  }
  if (!(comment.authorId === req.auth!.sub || isModerator(req.auth!.role))) {
    res.status(403).json({ error: 'You can only edit your own comments.' })
    return
  }
  const updated = updateForumComment(comment.id, { body: parsed.data.body })
  res.json({ comment: toPublicComment(updated!, req.auth!.sub) })
})

router.delete('/comments/:id', requireAuth, requireUser, (req, res) => {
  const comment = findForumComment(String(req.params.id))
  if (!comment) {
    res.status(404).json({ error: 'Comment not found.' })
    return
  }
  const post = findForumPost(comment.postId)
  const canDelete =
    comment.authorId === req.auth!.sub ||
    isModerator(req.auth!.role) ||
    (post && post.authorId === req.auth!.sub)
  if (!canDelete) {
    res.status(403).json({ error: 'You can only delete your own comments.' })
    return
  }
  deleteForumComment(comment.id)
  res.json({ ok: true })
})

router.delete('/replies/:id', requireAuth, requireUser, (req, res) => {
  const reply = findForumReply(String(req.params.id))
  if (!reply) {
    res.status(404).json({ error: 'Reply not found.' })
    return
  }
  if (!(reply.authorId === req.auth!.sub || isModerator(req.auth!.role))) {
    res.status(403).json({ error: 'You can only delete your own replies.' })
    return
  }
  deleteForumReply(reply.id)
  res.json({ ok: true })
})

export default router
export { FORUM_ROOMS }
