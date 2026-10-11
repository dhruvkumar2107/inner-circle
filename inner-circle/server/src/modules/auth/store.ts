import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import mongoose from 'mongoose'
import { UserModel, UserRecord, UserRole } from '../users/userModel'

type NewUser = Omit<UserRecord, 'id' | 'createdAt' | 'failedLoginAttempts'>

const memoryUsers = new Map<string, UserRecord>()

/**
 * When MongoDB is not configured/reachable the API keeps users in memory. To
 * make registration and login survive process restarts (and warm serverless
 * instances) we mirror that memory to a small JSON file. Tests stay purely
 * in-memory so suites remain hermetic.
 */
const persistenceEnabled = process.env.NODE_ENV !== 'test'

const storeFile = (): string => {
  if (process.env.AUTH_STORE_PATH) return process.env.AUTH_STORE_PATH
  if (process.env.VERCEL) return path.join(os.tmpdir(), 'inner-circle-auth.json')
  return path.resolve(__dirname, '../../../.data/auth-users.json')
}

const persistMemoryUsers = (): void => {
  if (!persistenceEnabled || isMongoReady()) return
  try {
    const file = storeFile()
    mkdirSync(path.dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    writeFileSync(tmp, JSON.stringify([...memoryUsers.values()]), 'utf8')
    renameSync(tmp, file)
  } catch {
    /* read-only filesystem: keep working from memory only */
  }
}

const hydrateMemoryUsers = (): void => {
  if (!persistenceEnabled) return
  try {
    const file = storeFile()
    if (!existsSync(file)) return
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (!Array.isArray(parsed)) return
    for (const record of parsed as Array<Record<string, unknown>>) {
      if (typeof record?.id !== 'string' || typeof record?.email !== 'string') continue
      memoryUsers.set(record.id, {
        ...(record as unknown as UserRecord),
        createdAt: record.createdAt ? new Date(record.createdAt as string) : new Date(),
        lockUntil: record.lockUntil ? new Date(record.lockUntil as string) : undefined,
      })
    }
  } catch {
    /* corrupt or unreadable store: start fresh */
  }
}

hydrateMemoryUsers()

const fromDocument = (document: Record<string, unknown>): UserRecord => ({
  id: String(document._id),
  firstName: String(document.firstName),
  lastName: String(document.lastName),
  email: String(document.email),
  passwordHash: String(document.passwordHash),
  ...(typeof document.studentId === 'string' ? { studentId: document.studentId } : {}),
  ...(typeof document.college === 'string' ? { college: document.college } : {}),
  ...(typeof document.department === 'string' ? { department: document.department } : {}),
  ...(typeof document.year === 'string' ? { year: document.year } : {}),
  role: document.role as UserRole,
  alias: String(document.alias),
  failedLoginAttempts: Number(document.failedLoginAttempts ?? 0),
  ...(document.lockUntil instanceof Date ? { lockUntil: document.lockUntil } : {}),
  createdAt: document.createdAt instanceof Date ? document.createdAt : new Date(),
})

export const isMongoReady = (): boolean => mongoose.connection.readyState === 1

export const findUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  if (isMongoReady()) {
    const document = await UserModel.findOne({ email }).select('+passwordHash').lean()
    return document ? fromDocument(document as unknown as Record<string, unknown>) : undefined
  }
  return [...memoryUsers.values()].find(user => user.email === email)
}

export const isAliasTaken = async (alias: string): Promise<boolean> => {
  if (isMongoReady()) return Boolean(await UserModel.exists({ alias }))
  return [...memoryUsers.values()].some(user => user.alias === alias)
}

export const insertUser = async (user: NewUser): Promise<UserRecord> => {
  if (isMongoReady()) {
    const document = await UserModel.create(user)
    return fromDocument(document.toObject() as unknown as Record<string, unknown>)
  }
  const record: UserRecord = {
    ...user,
    id: randomUUID(),
    failedLoginAttempts: 0,
    createdAt: new Date(),
  }
  memoryUsers.set(record.id, record)
  persistMemoryUsers()
  return record
}

export const updateUser = async (user: UserRecord): Promise<void> => {
  if (isMongoReady()) {
    await UserModel.findByIdAndUpdate(user.id, {
      failedLoginAttempts: user.failedLoginAttempts,
      lockUntil: user.lockUntil,
    })
    return
  }
  memoryUsers.set(user.id, user)
  persistMemoryUsers()
}

export const findUserById = async (id: string): Promise<UserRecord | undefined> => {
  if (isMongoReady()) {
    const document = await UserModel.findById(id).select('+passwordHash').lean()
    return document ? fromDocument(document as unknown as Record<string, unknown>) : undefined
  }
  return memoryUsers.get(id)
}

export const listUsers = async (): Promise<UserRecord[]> => {
  if (isMongoReady()) {
    const documents = await UserModel.find().select('+passwordHash').lean()
    return documents.map(document => fromDocument(document as unknown as Record<string, unknown>))
  }
  return [...memoryUsers.values()]
}

export const countUsers = async (): Promise<number> => {
  if (isMongoReady()) return UserModel.countDocuments()
  return memoryUsers.size
}

export const resetMemoryUsers = (): void => {
  memoryUsers.clear()
  persistMemoryUsers()
}
