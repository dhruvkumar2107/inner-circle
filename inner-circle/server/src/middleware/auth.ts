import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserRecord, UserRole } from '../modules/users/userModel'
import { findUserById } from '../modules/auth/store'

export interface AccessClaims {
  sub: string
  role: UserRole
  kind: 'access' | 'refresh'
}

declare global {
  namespace Express {
    interface Request {
      auth?: AccessClaims
      user?: UserRecord
    }
  }
}

export const jwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production')
  return 'local-demo-secret-change-before-deployment'
}

export const createToken = (claims: AccessClaims, expiresIn: '15m' | '7d'): string =>
  jwt.sign(claims, jwtSecret(), { expiresIn })

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined
  if (!token) {
    res.status(401).json({ error: 'Please sign in to continue.' })
    return
  }
  try {
    const claims = jwt.verify(token, jwtSecret()) as AccessClaims
    if (claims.kind !== 'access') {
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
      return
    }
    req.auth = claims
    next()
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}

/** Populates req.auth when a valid access token is present; never rejects. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined
  if (token) {
    try {
      const claims = jwt.verify(token, jwtSecret()) as AccessClaims
      if (claims.kind === 'access') req.auth = claims
    } catch {
      /* ignore invalid token: treat as anonymous */
    }
  }
  next()
}

/**
 * Resolves the signed-in user record (including the anonymous alias) onto the
 * request. Run this after requireAuth for routes that need the user's alias,
 * ownership checks, or role. The real name/email are never sent to peers.
 */
export const requireUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.auth) {
    res.status(401).json({ error: 'Please sign in to continue.' })
    return
  }
  try {
    const user = await findUserById(req.auth.sub)
    if (!user) {
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
      return
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export const requireRole = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'You do not have permission to access this resource.' })
      return
    }
    next()
  }
