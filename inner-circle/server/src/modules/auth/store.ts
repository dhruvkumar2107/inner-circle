import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { UserModel, UserRecord, UserRole } from '../users/userModel'

type NewUser = Omit<UserRecord, 'id' | 'createdAt' | 'failedLoginAttempts'>

const memoryUsers = new Map<string, UserRecord>()

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
}
