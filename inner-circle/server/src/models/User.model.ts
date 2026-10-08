import mongoose, { Document, Model } from 'mongoose'

export interface IUser extends Document {
  realName: string
  email: string
  passwordHash: string
  studentId?: string
  college?: string
  dept?: string
  year?: number
  role: 'student' | 'volunteer' | 'professional' | 'admin'
  alias: string
  aliasHistory: string[]
  language: 'en' | 'hi' | 'kn'
  consent: {
    privacy: boolean
    research: boolean
    ts: Date
  }
  // Optional: allow real name/reveal to counselor
  allowAliasRevealToCounselor: boolean
  assignedProfessionalId?: mongoose.Types.ObjectId
  streak: number
  points: number
  badges: string[]
  // Anonymous identity
  isAnonymous: boolean
  // Account security
  lockUntil?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Static methods
interface UserModel extends Model<IUser> {
  findByEmail: (email: string) => Promise<IUser | null>
  findByAlias: (alias: string) => Promise<IUser | null>
  findAdmins: () => Promise<IUser[]>
}

const UserSchema = new mongoose.Schema(
  {
    realName: {
      type: String,
      required: [true, 'Real name is required'],
      trim: true,
      maxlength: [50, 'Real name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w+$/, 'Please fill a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: [20, 'Student ID cannot exceed 20 characters'],
    },
    college: {
      type: String,
      trim: true,
      maxlength: [50, 'College name cannot exceed 50 characters'],
    },
    dept: {
      type: String,
      trim: true,
      maxlength: [50, 'Department name cannot exceed 50 characters'],
    },
    year: {
      type: Number,
      min: [1, 'Year must be at least 1'],
      max: [6, 'Year must be at most 6'],
    },
    role: {
      type: String,
      enum: ['student', 'volunteer', 'professional', 'admin'],
      default: 'student',
    },
    alias: {
      type: String,
      required: [true, 'Alias is required'],
      unique: true,
      match: [/^[A-Za-z\s]+$/, 'Alias must contain only letters and spaces'],
    },
    aliasHistory: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'kn'],
      default: 'en',
    },
    consent: {
      privacy: {
        type: Boolean,
        default: false,
      },
      research: {
        type: Boolean,
        default: false,
      },
      ts: {
        type: Date,
        default: Date.now,
      },
    },
    allowAliasRevealToCounselor: {
      type: Boolean,
      default: false,
    },
    assignedProfessionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    streak: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance and uniqueness
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ alias: 1 }, { unique: true })
UserSchema.index({ role: 1 })
UserSchema.index({ createdAt: -1 })

// Static method: find user by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.trim().toLowerCase() })
}

// Static method: find user by alias
UserSchema.statics.findByAlias = function (alias: string) {
  return this.findOne({ alias: alias.trim() })
}

// Static method: find all admins
UserSchema.statics.findAdmins = function () {
  return this.find({ role: 'admin' })
}

export default mongoose.model<IUser, UserModel>('User', UserSchema)