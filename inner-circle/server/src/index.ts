/**
 * Inner Circle API bootstrap.
 * Connects to MongoDB when MONGO_URI is set (otherwise uses the in-memory demo
 * store), seeds demo personas, and starts the Express app.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app'
import { ensureSeeded } from './seed/demo'

const port = Number(process.env.PORT ?? 4000)

const start = async (): Promise<void> => {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI)
      console.info('Connected to MongoDB')
    } catch (error) {
      console.error('MongoDB connection error:', (error as Error).message.substring(0, 200))
      console.warn('Falling back to the in-memory demo store.')
    }
  } else {
    console.info('No MONGO_URI set — using the in-memory demo store (seeded).')
  }

  const { users } = await ensureSeeded()
  console.info(`Demo seed ready: ${users} users`)

  app.listen(port, () => console.info(`Inner Circle API listening on http://localhost:${port}`))
}

void start()

export default app
