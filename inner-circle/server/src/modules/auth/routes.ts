import { Response, Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createToken, jwtSecret, requireAuth } from '../../middleware/auth'
import { generateUniqueAlias } from './alias'
import { findUserByEmail, findUserById, insertUser, isAliasTaken, updateUser } from './store'
import { UserRecord } from '../users/userModel'
import jwt from 'jsonwebtoken'

const router = Router()
const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  studentId: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  year: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(128)
    .refine(value => /[A-Za-z]/.test(value) && /\d/.test(value), 'Password must include a letter and a number'),
})
const loginSchema = z.object({
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128),
})

const setRefreshCookie = (res: Response, token: string): void => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `inner_circle_refresh=${token}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=604800${secure}`)
}

const clearRefreshCookie = (res: Response): void => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `inner_circle_refresh=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0${secure}`)
}

const getCookie = (header: string | undefined, name: string): string | undefined => {
  const value = header?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))
  return value?.slice(name.length + 1)
}

const publicIdentity = (user: UserRecord) => ({ alias: user.alias, role: user.role })
const issueSession = (user: UserRecord) => ({
  accessToken: createToken({ sub: user.id, role: user.role, kind: 'access' }, '15m'),
  refreshToken: createToken({ sub: user.id, role: user.role, kind: 'refresh' }, '7d'),
})

router.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please check the information you entered.', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    if (await findUserByEmail(parsed.data.email)) {
      res.status(409).json({ error: 'Unable to create an account with those details.' })
      return
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const alias = await generateUniqueAlias(isAliasTaken)
      try {
        const user = await insertUser({
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          passwordHash,
          role: 'student',
          alias,
          ...(parsed.data.studentId ? { studentId: parsed.data.studentId } : {}),
          ...(parsed.data.college ? { college: parsed.data.college } : {}),
          ...(parsed.data.department ? { department: parsed.data.department } : {}),
          ...(parsed.data.year ? { year: parsed.data.year } : {}),
        })
        const session = issueSession(user)
        setRefreshCookie(res, session.refreshToken)
        res.status(201).json({ accessToken: session.accessToken, user: publicIdentity(user) })
        return
      } catch (error) {
        const duplicate = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000
        if (!duplicate || attempt === 4) throw error
        if (await findUserByEmail(parsed.data.email)) {
          res.status(409).json({ error: 'Unable to create an account with those details.' })
          return
        }
      }
    }
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please enter a valid email address and password.' })
    return
  }
  try {
    const user = await findUserByEmail(parsed.data.email)
    if (!user || (user.lockUntil && user.lockUntil > new Date())) {
      res.status(401).json({ error: 'Email or password is incorrect.' })
      return
    }
    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!valid) {
      user.failedLoginAttempts += 1
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        user.failedLoginAttempts = 0
      }
      await updateUser(user)
      res.status(401).json({ error: 'Email or password is incorrect.' })
      return
    }
    user.failedLoginAttempts = 0
    user.lockUntil = undefined
    await updateUser(user)
    const session = issueSession(user)
    setRefreshCookie(res, session.refreshToken)
    res.json({ accessToken: session.accessToken, user: publicIdentity(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/refresh', async (req, res) => {
  const token = getCookie(req.headers.cookie, 'inner_circle_refresh')
  if (!token) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
    return
  }
  try {
    const claims = jwt.verify(token, jwtSecret()) as { sub: string; role: UserRecord['role']; kind: string }
    if (claims.kind !== 'refresh') throw new Error('Invalid refresh token')
    const user = await findUserById(claims.sub)
    if (!user) throw new Error('Refresh user no longer exists')
    const session = issueSession(user)
    setRefreshCookie(res, session.refreshToken)
    res.json({ accessToken: session.accessToken, user: publicIdentity(user) })
  } catch {
    clearRefreshCookie(res)
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
})

router.post('/logout', (_req, res) => {
  clearRefreshCookie(res)
  res.status(204).end()
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth!.sub)
    if (!user) {
      res.status(404).json({ error: 'Account not found.' })
      return
    }
    res.json({
      user: {
        alias: user.alias,
        role: user.role,
        firstName: user.firstName,
        email: user.email,
        ...(user.college ? { college: user.college } : {}),
        ...(user.department ? { department: user.department } : {}),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
