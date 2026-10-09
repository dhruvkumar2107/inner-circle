import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { listUsers } from '../modules/auth/store'
import {
  addAudit,
  allAppointments,
  allAssessments,
  allCheckins,
  allForumPosts,
  allInferences,
  listAudit,
  listFlags,
} from '../modules/store'

const router = Router()

const MIN_CELL = Number(process.env.ANALYTICS_MIN_CELL ?? 5)

/** k-anonymity: suppress any non-empty cell smaller than MIN_CELL. */
const cell = (count: number): { count: number | null; suppressed: boolean } =>
  count > 0 && count < MIN_CELL ? { count: null, suppressed: true } : { count, suppressed: false }

const normalizeLevel = (level?: string): 'Low' | 'Moderate' | 'High' => {
  if (level === 'High') return 'High'
  if (level === 'Moderate' || level === 'Elevated') return 'Moderate'
  return 'Low'
}

/** GET /api/admin/analytics — aggregated, anonymized platform analytics. */
router.get('/analytics', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await listUsers()
    const students = users.filter(user => user.role === 'student')
    const inferences = allInferences()
    const latestByStudent = new Map<string, (typeof inferences)[number]>()
    for (const item of inferences) latestByStudent.set(item.userId, item)

    const buckets = { Low: 0, Moderate: 0, High: 0 }
    for (const student of students) {
      buckets[normalizeLevel(latestByStudent.get(student.id)?.level)] += 1
    }
    const totalAssessed = buckets.Low + buckets.Moderate + buckets.High

    const since = new Date()
    since.setDate(since.getDate() - 28)
    const weeks: Array<{ label: string; assessments: number; checkIns: number; avgRisk: number }> = []
    for (let week = 3; week >= 0; week -= 1) {
      const end = new Date()
      end.setDate(end.getDate() - week * 7)
      const start = new Date(end)
      start.setDate(end.getDate() - 7)
      const inRange = (value: Date) => value >= start && value < end
      const weekInferences = inferences.filter(item => inRange(new Date(item.createdAt)))
      const avgRisk = weekInferences.length
        ? Math.round(weekInferences.reduce((sum, item) => sum + item.riskScore, 0) / weekInferences.length)
        : 0
      weeks.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        assessments: allAssessments().filter(item => inRange(new Date(item.takenAt))).length,
        checkIns: allCheckins().filter(item => inRange(new Date(item.takenAt))).length,
        avgRisk,
      })
    }

    const appointments = allAppointments()
    const posts = allForumPosts()
    const roomCounts = new Map<string, number>()
    for (const post of posts) roomCounts.set(post.room, (roomCounts.get(post.room) ?? 0) + 1)
    const commonConcerns = [...roomCounts.entries()]
      .map(([concern, count]) => ({ concern, channel: cell(count) }))
      .sort((a, b) => (b.channel.count ?? 0) - (a.channel.count ?? 0))

    addAudit({
      actorId: req.auth!.sub, role: req.auth!.role, action: 'admin_analytics_read',
      resource: 'admin/analytics', ip: req.ip,
    })

    res.json({
      generatedAt: new Date(),
      minCellSize: MIN_CELL,
      totals: {
        registeredStudents: students.length,
        registeredUsers: users.length,
        assessmentsCompleted: allAssessments().length,
        checkInsCompleted: allCheckins().length,
        riskInferences: inferences.length,
        openReviews: listFlags().filter(flag => flag.status === 'open').length,
      },
      riskDistribution: (['Low', 'Moderate', 'High'] as const).map(level => ({
        level,
        ...cell(buckets[level]),
        percent: totalAssessed ? Math.round((buckets[level] / totalAssessed) * 100) : 0,
      })),
      weeklyTrend: weeks,
      appointmentStats: {
        total: appointments.length,
        upcoming: appointments.filter(item => item.status === 'confirmed').length,
        completed: appointments.filter(item => item.status === 'completed').length,
        cancelled: appointments.filter(item => item.status === 'cancelled').length,
        online: appointments.filter(item => item.mode === 'Online').length,
      },
      peerSupport: {
        posts: posts.length,
        reactions: posts.reduce((sum, post) => sum + post.reactions.support + post.reactions.relate + post.reactions.grow, 0),
        hiddenForSafety: posts.filter(post => post.status === 'hidden').length,
      },
      commonConcerns,
    })
  } catch (error) {
    next(error)
  }
})

/** GET /api/admin/users — role management list (no PII beyond first name/email for admin). */
router.get('/users', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await listUsers()
    addAudit({ actorId: req.auth!.sub, role: req.auth!.role, action: 'admin_users_read', resource: 'admin/users', ip: req.ip })
    res.json({
      users: users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        alias: user.alias,
        role: user.role,
        createdAt: user.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

/** GET /api/admin/audit — audit-log viewer with optional filters. */
router.get('/audit', requireAuth, requireRole('admin'), (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500)
  const action = typeof req.query.action === 'string' ? req.query.action : undefined
  let records = listAudit(limit)
  if (action) records = records.filter(record => record.action.includes(action))
  res.json({ audit: records })
})

/** GET /api/admin/flags — moderation / safety flags. */
router.get('/flags', requireAuth, requireRole('admin', 'professional'), (_req, res) => {
  res.json({ flags: listFlags() })
})

export default router
