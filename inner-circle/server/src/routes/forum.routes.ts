import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import {
  addForumPost,
  listForumPosts,
  findForumPost,
  updateForumPost,
  deleteForumPost,
  addForumComment,
  listForumComments,
  findForumComment,
  addForumReply,
  type ForumCommentRecord,
} from '../modules/store'

const router = Router()

const postSchema = z.object({
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
]

const isModerator = (req: any): boolean => ['admin', 'professional'].includes(req.auth?.role)

router.get('/rooms', (_req, res) => {
  res.json({ rooms: FORUM_ROOMS })
})

router.get('/posts', (req, res) => {
  const { roomId, q, sort = 'newest', limit = '20', offset = '0' } = req.query
  let posts = listForumPosts(roomId ? String(roomId) : undefined).filter(p => p.status !== 'hidden')
  const term = typeof q === 'string' ? q.trim().toLowerCase() : ''
  if (term) {
    posts = posts.filter(p => p.body.toLowerCase().includes(term))
  }
  posts.sort((a, b) => {
    if (sort === 'oldest') return +a.createdAt - +b.createdAt
    if (sort === 'reports') return b.reports - a.reports
    return +b.createdAt - +a.createdAt
  })
  const lim = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20))
  const off = Math.max(0, parseInt(String(offset), 10) || 0)
  const total = posts.length
  posts = posts.slice(off, off + lim)
  res.json({ posts, total, limit: lim, offset: off })
})

router.get('/posts/:id', (req, res) => {
  const post = findForumPost(req.params.id)
  if (!post || post.status === 'hidden') {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  res.json({ post, comments: listForumComments(post.id) })
})

router.post('/posts', requireAuth, (req, res) => {
  const parsed = postSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please share a valid post (5-2000 characters).' })
    return
  }
  const user = (req as any).user
  const alias = user?.alias || req.auth!.role
  const room = FORUM_ROOMS.find(r => r.id === parsed.data.roomId) || FORUM_ROOMS[0]
  const post = addForumPost({
    roomId: room.id,
    room: room.name,
    authorAlias: alias,
    authorId: req.auth!.sub,
    body: parsed.data.body,
    reactions: { support: 0, relate: 0, grow: 0 },
    reports: 0,
    status: 'visible',
    flaggedCrisis: false,
    createdAt: new Date(),
  })
  res.status(201).json({ post })
})

router.put('/posts/:id', requireAuth, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  const canEdit = post.authorId === req.auth!.sub || isModerator(req)
  if (!canEdit) {
    res.status(403).json({ error: 'You cannot edit this post.' })
    return
  }
  const parsed = postSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid update.' })
    return
  }
  const updated = updateForumPost(post.id, { ...parsed.data, updatedAt: new Date() } as any)
  res.json({ post: updated })
})

router.delete('/posts/:id', requireAuth, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  const canDelete = post.authorId === req.auth!.sub || isModerator(req)
  if (!canDelete) {
    res.status(403).json({ error: 'You cannot delete this post.' })
    return
  }
  deleteForumPost(post.id)
  res.json({ ok: true })
})

router.post('/posts/:id/react', requireAuth, (req, res) => {
  const schema = z.object({ type: z.enum(['support', 'relate', 'grow']) })
  const parsed = schema.safeParse(req.body)
  const post = findForumPost(String(req.params.id))
  if (!post || !parsed.success) {
    res.status(400).json({ error: 'Invalid reaction.' })
    return
  }
  const uid = req.auth!.sub
  ;(post as any).reactedBy = (post as any).reactedBy || {}
  const reactedBy = (post as any).reactedBy
  reactedBy[uid] = reactedBy[uid] || []
  const list = reactedBy[uid] as string[]
  if (list.includes(parsed.data.type)) {
    post.reactions[parsed.data.type] = Math.max(0, post.reactions[parsed.data.type] - 1)
    reactedBy[uid] = list.filter(t => t !== parsed.data.type)
  } else {
    post.reactions[parsed.data.type] = (post.reactions[parsed.data.type] || 0) + 1
    reactedBy[uid] = [...list, parsed.data.type]
  }
  res.json({ post })
})

router.post('/posts/:id/report', requireAuth, (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  post.reports = (post.reports || 0) + 1
  if (post.reports >= 5) post.status = 'hidden'
  res.json({ ok: true, reports: post.reports })
})

router.post('/posts/:id/comments', requireAuth, (req, res) => {
  const parsed = commentSchema.safeParse(req.body)
  const post = findForumPost(String(req.params.id))
  if (!post || !parsed.success) {
    res.status(400).json({ error: 'Invalid comment.' })
    return
  }
  const comment = addForumComment({
    postId: post.id,
    authorId: req.auth!.sub,
    authorAlias: (req as any).user?.alias || req.auth!.role,
    body: parsed.data.body,
    createdAt: new Date(),
  })
  res.status(201).json({ comment })
})

router.get('/posts/:id/comments', (req, res) => {
  const post = findForumPost(String(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found.' })
    return
  }
  res.json({ comments: listForumComments(post.id) })
})

router.post('/comments/:id/replies', requireAuth, (req, res) => {
  const parsed = replySchema.safeParse(req.body)
  const comment = findForumComment(String(req.params.id))
  if (!comment || !parsed.success) {
    res.status(400).json({ error: 'Invalid reply.' })
    return
  }
  const reply = addForumReply(comment.id, {
    authorId: req.auth!.sub,
    authorAlias: (req as any).user?.alias || req.auth!.role,
    body: parsed.data.body,
    createdAt: new Date(),
  })
  res.status(201).json({ reply })
})

router.delete('/comments/:id', requireAuth, (req, res) => {
  const comment = findForumComment(String(req.params.id))
  if (!comment) {
    res.status(404).json({ error: 'Comment not found.' })
    return
  }
  const post = findForumPost(comment.postId)
  const canDelete = comment.authorId === req.auth!.sub || isModerator(req) || (post && post.authorId === req.auth!.sub)
  if (!canDelete) {
    res.status(403).json({ error: 'You cannot delete this comment.' })
    return
  }
  const list = require('../modules/store') as any
  const idx = list.forumComments?.findIndex?.((c: any) => c.id === comment.id)
  if (typeof idx === 'number' && idx >= 0 && list.forumComments) list.forumComments.splice(idx, 1)
  res.json({ ok: true })
})

export default router
export { FORUM_ROOMS }

