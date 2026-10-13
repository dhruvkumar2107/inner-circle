/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app so it runs as a serverless function on Vercel.
 * All requests to /api/* are routed here via vercel.json.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import app from '../server/src/app'

/**
 * The connection promise is cached for the lifetime of the (warm) instance so
 * concurrent invocations share a single connection instead of racing.
 */
let connection: Promise<typeof mongoose> | null = null

const connectMongo = async (): Promise<void> => {
  const uri = process.env.MONGO_URI
  if (!uri) return
  if (mongoose.connection.readyState === 1) return
  if (!connection) {
    connection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
    })
  }
  try {
    await connection
  } catch (error) {
    // Reset so the next invocation can retry a fresh connection.
    connection = null
    throw error
  }
}

// Kick off the connection as soon as the module is loaded (i.e. during the
// serverless cold start) so the first real request usually finds it ready.
if (process.env.MONGO_URI) {
  connectMongo().catch(error => {
    console.error('MongoDB eager connection error:', (error as Error)?.message?.substring(0, 200))
  })
}

export default async function handler(req: any, res: any) {
  if (process.env.MONGO_URI) {
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectMongo()
      } catch (error: any) {
        console.error('MongoDB connection error:', error?.message?.substring(0, 200))
      }
    }
    // Never serve from the in-memory fallback when a real database is
    // configured: doing so silently loses registrations and returns false
    // "invalid credentials" while the database is still warming up.
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: 'Service is warming up. Please try again in a moment.' })
      return
    }
  } else {
    console.info('No MONGO_URI set — using in-memory demo store')
  }
  return app(req, res)
}
