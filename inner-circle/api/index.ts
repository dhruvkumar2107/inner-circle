/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app so it runs as a serverless function on Vercel.
 * All requests to /api/* are routed here via vercel.json.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import app from '../server/src/app'

let mongoConnected = false

const connectMongo = async () => {
  if (mongoConnected || mongoose.connection.readyState === 1) return
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.info('No MONGO_URI set — using in-memory demo store')
    return
  }
  try {
    await mongoose.connect(uri)
    mongoConnected = true
    console.info('MongoDB connected')
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message?.substring(0, 200))
  }
}

export default async function handler(req: any, res: any) {
  await connectMongo()
  return app(req, res)
}
