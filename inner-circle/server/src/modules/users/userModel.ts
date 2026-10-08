import { model, Schema, Types } from 'mongoose'

export type UserRole = 'student' | 'volunteer' | 'professional' | 'admin'

export interface UserRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  passwordHash: string
  studentId?: string
  college?: string
  department?: string
  year?: string
  role: UserRole
  alias: string
  failedLoginAttempts: number
  lockUntil?: Date
  createdAt: Date
}

const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  studentId: { type: String, trim: true, sparse: true },
  college: { type: String, trim: true },
  department: { type: String, trim: true },
  year: { type: String, trim: true },
  role: { type: String, enum: ['student', 'volunteer', 'professional', 'admin'], default: 'student' },
  alias: { type: String, required: true, unique: true, index: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } })

userSchema.index({ alias: 1 }, { unique: true })

export const UserModel = model('User', userSchema)
export type UserDocumentId = Types.ObjectId
