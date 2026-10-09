/**
 * Lightweight in-memory domain store for demo/research data.
 *
 * Users live in the auth store (Memory or MongoDB). Everything else here is
 * kept in-process so the research prototype runs with zero external services.
 * Data is seeded at boot (see seed/demo.ts) and intentionally resets on restart
 * unless a MongoDB URI is configured for the users collection.
 */
import { randomUUID } from 'node:crypto'

export type Mood = 'Good' | 'Okay' | 'Stressed' | 'Low' | 'Overwhelmed'

export interface AssessmentRecord {
  id: string
  userId: string
  type: 'PHQ9' | 'GAD7'
  answers: number[]
  total: number
  severity: string
  item9Flag: boolean
  functionalDifficulty?: number
  takenAt: Date
}

export interface CheckinRecord {
  id: string
  userId: string
  mood: Mood
  stress: number
  functionalImpact: number
  note?: string
  sentiment?: number
  takenAt: Date
}

export interface RiskInputs {
  phq9: number
  gad7: number
  sentiment: number
  stress: number
  functional: number
}

export interface RiskInferenceRecord {
  id: string
  userId: string
  inputs: RiskInputs
  memberships: Record<string, Record<string, number>>
  firedRules: Array<{ id: string; strength: number; text: string }>
  contributors: Array<{ factor: string; weight: number }>
  narrative: string[]
  riskScore: number
  tier: number
  level: string
  safetyOverride: boolean
  trend?: 'Improving' | 'Stable' | 'Worsening'
  createdAt: Date
}

export interface AppointmentRecord {
  id: string
  userId: string
  professionalId: string
  professionalName: string
  date: string
  time: string
  durationMin: number
  type: string
  mode: 'Online' | 'In-person'
  location: string
  status: 'confirmed' | 'scheduled' | 'cancelled' | 'completed'
  notes?: string
  priority: 'normal' | 'emergency'
  history: Array<{ action: string; at: Date; note?: string }>
}

export interface ForumPostRecord {
  id: string
  roomId: string
  room: string
  authorAlias: string
  authorId: string
  body: string
  reactions: { support: number; relate: number; grow: number }
  reports: number
  status: 'visible' | 'hidden'
  flaggedCrisis: boolean
  createdAt: Date
}

export interface FlagRecord {
  id: string
  userId: string
  alias: string
  source: 'assessment' | 'chat' | 'forum' | 'journal' | 'button' | 'checkin'
  severity: 'low' | 'medium' | 'high'
  summary: string
  status: 'open' | 'confirmed' | 'adjusted' | 'dismissed'
  reviewedBy?: string
  decision?: string
  note?: string
  createdAt: Date
}

export interface AuditRecord {
  id: string
  actorId: string
  role: string
  action: string
  targetUserId?: string
  resource: string
  ip?: string
  meta?: Record<string, unknown>
  ts: Date
}

export interface ProfessionalProfile {
  id: string
  userId?: string
  name: string
  title: string
  specialization: string[]
  languages: string[]
  modes: Array<'Online' | 'In-person'>
  availability: string[]
}

const assessments: AssessmentRecord[] = []
const checkins: CheckinRecord[] = []
const inferences: RiskInferenceRecord[] = []
const appointments: AppointmentRecord[] = []
const forumPosts: ForumPostRecord[] = []
const flags: FlagRecord[] = []
const auditLogs: AuditRecord[] = []
const professionalProfiles: ProfessionalProfile[] = []

export const createId = (): string => randomUUID()

/* ----------------------------- assessments ------------------------------ */

export const addAssessment = (record: Omit<AssessmentRecord, 'id'>): AssessmentRecord => {
  const full: AssessmentRecord = { ...record, id: createId() }
  assessments.push(full)
  return full
}

export const listAssessments = (userId: string): AssessmentRecord[] =>
  assessments.filter(item => item.userId === userId).sort((a, b) => +b.takenAt - +a.takenAt)

export const allAssessments = (): AssessmentRecord[] => assessments

/* -------------------------------- check-ins ----------------------------- */

export const addCheckin = (record: Omit<CheckinRecord, 'id'>): CheckinRecord => {
  const full: CheckinRecord = { ...record, id: createId() }
  checkins.push(full)
  return full
}

export const listCheckins = (userId: string): CheckinRecord[] =>
  checkins.filter(item => item.userId === userId).sort((a, b) => +b.takenAt - +a.takenAt)

export const allCheckins = (): CheckinRecord[] => checkins

/* ---------------------------- risk inferences --------------------------- */

export const addInference = (record: Omit<RiskInferenceRecord, 'id'>): RiskInferenceRecord => {
  const full: RiskInferenceRecord = { ...record, id: createId() }
  inferences.push(full)
  return full
}

export const listInferences = (userId: string): RiskInferenceRecord[] =>
  inferences.filter(item => item.userId === userId).sort((a, b) => +b.createdAt - +a.createdAt)

export const latestInference = (userId: string): RiskInferenceRecord | undefined =>
  listInferences(userId)[0]

export const allInferences = (): RiskInferenceRecord[] => inferences

/* ------------------------------ appointments ---------------------------- */

export const addAppointment = (record: Omit<AppointmentRecord, 'id'>): AppointmentRecord => {
  const full: AppointmentRecord = { ...record, id: createId() }
  appointments.push(full)
  return full
}

export const listAppointments = (userId: string): AppointmentRecord[] =>
  appointments.filter(item => item.userId === userId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

export const allAppointments = (): AppointmentRecord[] => appointments

export const findAppointment = (id: string): AppointmentRecord | undefined =>
  appointments.find(item => item.id === id)

export const findAppointmentForSlot = (professionalId: string, date: string, time: string): AppointmentRecord | undefined =>
  appointments.find(item => item.professionalId === professionalId && item.date === date && item.time === time && item.status !== 'cancelled')

/* --------------------------------- forum -------------------------------- */

export const addForumPost = (record: Omit<ForumPostRecord, 'id'>): ForumPostRecord => {
  const full: ForumPostRecord = { ...record, id: createId() }
  forumPosts.push(full)
  return full
}

export const listForumPosts = (roomId?: string): ForumPostRecord[] =>
  forumPosts
    .filter(item => (roomId ? item.roomId === roomId : true))
    .sort((a, b) => +b.createdAt - +a.createdAt)

export const findForumPost = (id: string): ForumPostRecord | undefined =>
  forumPosts.find(item => item.id === id)

export const allForumPosts = (): ForumPostRecord[] => forumPosts

/* --------------------------------- flags -------------------------------- */

export const addFlag = (record: Omit<FlagRecord, 'id'>): FlagRecord => {
  const full: FlagRecord = { ...record, id: createId() }
  flags.push(full)
  return full
}

export const listFlags = (): FlagRecord[] => [...flags].sort((a, b) => +b.createdAt - +a.createdAt)

export const findFlag = (id: string): FlagRecord | undefined => flags.find(item => item.id === id)

export const flagsForUser = (userId: string): FlagRecord[] => flags.filter(item => item.userId === userId)

/* --------------------------------- audit -------------------------------- */

export const addAudit = (record: Omit<AuditRecord, 'id' | 'ts'> & { ts?: Date }): AuditRecord => {
  const full: AuditRecord = { ...record, id: createId(), ts: record.ts ?? new Date() }
  auditLogs.push(full)
  return full
}

export const listAudit = (limit = 100): AuditRecord[] =>
  [...auditLogs].sort((a, b) => +b.ts - +a.ts).slice(0, limit)

export const allAudit = (): AuditRecord[] => auditLogs

/* ----------------------------- professionals ---------------------------- */

export const addProfessional = (record: ProfessionalProfile): ProfessionalProfile => {
  professionalProfiles.push(record)
  return record
}

export const listProfessionals = (): ProfessionalProfile[] => [...professionalProfiles]

export const findProfessional = (id: string): ProfessionalProfile | undefined =>
  professionalProfiles.find(item => item.id === id)

/* --------------------------------- trend -------------------------------- */

export const computeTrend = (scores: number[]): 'Improving' | 'Stable' | 'Worsening' => {
  if (scores.length < 3) return 'Stable'
  const recent = scores.slice(0, Math.min(6, scores.length)).reverse()
  const n = recent.length
  const meanX = (n - 1) / 2
  const meanY = recent.reduce((sum, value) => sum + value, 0) / n
  let numerator = 0
  let denominator = 0
  recent.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY)
    denominator += (index - meanX) ** 2
  })
  const slope = denominator === 0 ? 0 : numerator / denominator
  if (slope <= -2) return 'Improving'
  if (slope >= 2) return 'Worsening'
  return 'Stable'
}

/* ------------------------------- reset (test) --------------------------- */

export const resetDomainStore = (): void => {
  assessments.length = 0
  checkins.length = 0
  inferences.length = 0
  appointments.length = 0
  forumPosts.length = 0
  flags.length = 0
  auditLogs.length = 0
  professionalProfiles.length = 0
}
