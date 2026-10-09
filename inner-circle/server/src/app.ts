import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRoutes from './modules/auth/routes'
import riskRoutes from './routes/risk.routes'
import checkinRoutes from './routes/checkins.routes'
import chatRoutes from './routes/chat.routes'
import appointmentRoutes from './routes/appointments.routes'
import forumRoutes from './routes/forum.routes'
import resourceRoutes from './routes/resources.routes'
import professionalRoutes from './routes/professionals.routes'
import proRoutes from './routes/pro.routes'
import adminRoutes from './routes/admin.routes'
import safetyRoutes from './routes/safety.routes'
import { ensureSeeded } from './seed/demo'

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
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))

// Seed demo personas on first request (idempotent).
app.use(async (_req, _res, next) => {
  try {
    await ensureSeeded()
  } catch {
    /* the seed is best-effort; the API still serves an empty demo */
  }
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', persistence: process.env.MONGO_URI ? 'mongodb-configured' : 'local-demo-memory' })
})

app.use('/api/auth', authRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/checkins', checkinRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/forum', forumRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/professionals', professionalRoutes)
app.use('/api/pro', proRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/safety', safetyRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'test') console.error(error.message)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

export default app
