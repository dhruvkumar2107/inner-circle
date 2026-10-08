import { Request, Response, NextFunction } from 'express'
import User from '../../models/User.model'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// JWT verification middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'inner-circle-jwt-secret-change-in-production')
    ;(req as any).user = decoded
    next()
  } catch (error: any) {
    return res.status(403).json({ error: 'Invalid or expired token.' })
  }
}

// Get current user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await User.findById(userId).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, user })
  } catch (error: any) {
    next(error)
  }
}

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updates = { ...req.body }
    // Remove sensitive fields
    delete updates.password
    delete updates.passwordHash

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, user })
  } catch (error: any) {
    next(error)
  }
}

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash!)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)
    user.passwordHash = hashedNewPassword
    await user.save()

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error: any) {
    next(error)
  }
}

// Delete account
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await User.findByIdAndDelete(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, message: 'Account deleted successfully' })
  } catch (error: any) {
    next(error)
  }
}

// Verify alias availability
export const verifyAlias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alias } = req.params
    const existingUser = await User.findByAlias(alias as string)
    res.json({ success: true, available: !existingUser })
  } catch (error: any) {
    next(error)
  }
}

// Helper functions
const hashPassword = async (password: string) => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (candidate: string, hash: string) => {
  return bcrypt.compare(candidate, hash)
}

export default {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  verifyAlias,
}