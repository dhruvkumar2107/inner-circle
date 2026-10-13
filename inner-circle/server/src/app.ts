import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
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
import { hydrateDomainStore, persistDomainDiff } from './modules/domainPersistence'
import { exportDomainState, type DomainState } from './modules/store'

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

// Allow the deployment's own origin when hosted (e.g. Vercel preview/production)
// so same-origin API calls keep working without an explicit CORS_ORIGIN.
if (process.env.VERCEL_URL) allowedOrigins.push(`https://${process.env.VERCEL_URL}`)

app.disable('x-powered-by')
// Behind Vercel/most proxies the client IP arrives via X-Forwarded-For; this is
// required for express-rate-limit to read it correctly instead of erroring.
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    // Never throw on an unknown origin: same-origin requests still work and
    // disallowed cross-origin callers simply get no CORS headers.
    callback(null, false)
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

// Serialize requests per instance so the hydrate -> handle -> persist cycle is
// atomic. The domain store is a shared in-memory working set, so letting two
// requests interleave would let one request's hydration wipe another's writes.
let domainLock: Promise<void> = Promise.resolve()
const acquireDomainLock = (): Promise<() => void> => {
  let release!: () => void
  const next = new Promise<void>(resolve => { release = resolve })
  const wait = domainLock
  domainLock = next
  return wait.then(() => release)
}

// Load the persisted domain store, seed demo data on first boot, then persist
// whatever changed before the response is sent. Requests are serialized so the
// shared in-memory store stays consistent within a single instance.
app.use(async (req, res, next) => {
  if (req.path === '/api/health') {
    next()
    return
  }

  const release = await acquireDomainLock()
  let released = false
  const finish = () => {
    if (!released) {
      released = true
      release()
    }
  }

  res.on('close', finish)

  let baseline: DomainState
  try {
    await hydrateDomainStore()
    baseline = exportDomainState()
    await ensureSeeded()
  } catch (error) {
    finish()
    next(error)
    return
  }

  const originalJson = res.json.bind(res)
  let started = false
  res.json = ((body?: unknown) => {
    if (started) return res
    started = true
    void (async () => {
      try {
        await persistDomainDiff(baseline)
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') console.error('Domain persistence failed:', error instanceof Error ? error.message : error)
      }
      originalJson(body)
      finish()
    })()
    return res
  }) as express.Response['json']

  next()
})

app.get('/api/health', (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1
  res.json({
    status: 'ok',
    persistence: mongoReady ? 'mongodb' : 'local-demo-store',
    mongoConfigured: Boolean(process.env.MONGO_URI),
  })
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
