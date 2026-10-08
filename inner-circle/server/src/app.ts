import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import authRoutes from './modules/auth/routes'
import { requireAuth } from './middleware/auth'
import { inferRisk } from './fuzzy/engine'
import { toPublicForumPost } from './modules/forum/publicPost'

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '20kb' }))
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', persistence: process.env.MONGO_URI ? 'mongodb-configured' : 'local-demo-memory' })
})
app.use('/api/auth', authRoutes)

app.post('/api/risk/infer', requireAuth, (req, res) => {
  const schema = z.object({
    phq9: z.number().min(0).max(27),
    gad7: z.number().min(0).max(21),
    sentiment: z.number().min(-1).max(1),
    stress: z.number().min(1).max(10),
    functional: z.number().min(0).max(10),
    item9Flag: z.boolean().optional(),
    crisisDetected: z.boolean().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide valid assessment inputs.' })
    return
  }
  const safetyOverride = parsed.data.item9Flag === true || parsed.data.crisisDetected === true
  res.json(inferRisk({ ...parsed.data, safetyOverride }))
})

app.get('/api/forum/posts', (_req, res) => {
  const posts = [
    {
      id: 'welcome-1',
      authorAlias: 'Radiant Meadow',
      body: 'What is one small thing that helped you reset this week?',
      room: 'Wins & Gratitude',
      createdAt: new Date(),
      authorId: 'server-only-id',
      authorEmail: 'never-return-this@example.edu',
    },
    {
      id: 'welcome-2',
      authorAlias: 'Steady Lantern',
      body: 'A quiet reminder: taking a pause is also progress.',
      room: 'General',
      createdAt: new Date(),
      authorId: 'another-server-only-id',
      realName: 'Private Example Name',
    },
  ]
  res.json({ posts: posts.map(post => toPublicForumPost(post)) })
})

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'test') console.error(error.message)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

export default app
