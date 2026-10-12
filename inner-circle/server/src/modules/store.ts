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

export interface ForumReplyRecord {
  id: string
  authorId: string
  authorAlias: string
  body: string
  createdAt: Date
  updatedAt?: Date
}

export interface ForumCommentRecord {
  id: string
  postId: string
  authorId: string
  authorAlias: string
  body: string
  replies: ForumReplyRecord[]
  createdAt: Date
  updatedAt?: Date
}

export interface ForumPostRecord {
  id: string
  roomId: string
  room: string
  authorAlias: string
  authorId: string
  title?: string
  body: string
  reactions: { support: number; relate: number; grow: number }
  reactedBy?: Record<string, Array<'support' | 'relate' | 'grow'>>
  reports: number
  reportedBy?: string[]
  status: 'visible' | 'hidden'
  flaggedCrisis: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface SavedResourceRecord {
  userId: string
  resourceKey: string
  savedAt: Date
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

export interface ChatSessionRecord {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessageRecord {
  id: string
  sessionId: string
  userId: string
  role: 'user' | 'assistant'
  text: string
  sentiment?: number
  topic?: string
  crisis?: boolean
  suggestions?: Array<{ label: string; prompt: string }>
  provider?: 'llm' | 'rules'
  createdAt: Date
}

const assessments: AssessmentRecord[] = []
const checkins: CheckinRecord[] = []
const inferences: RiskInferenceRecord[] = []
const appointments: AppointmentRecord[] = []
export const forumComments: ForumCommentRecord[] = []
const forumPosts: ForumPostRecord[] = []
const flags: FlagRecord[] = []
const auditLogs: AuditRecord[] = []
const professionalProfiles: ProfessionalProfile[] = []
const chatSessions: ChatSessionRecord[] = []
const chatMessages: ChatMessageRecord[] = []
const savedResources: SavedResourceRecord[] = []

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

export const updateForumPost = (id: string, patch: Partial<ForumPostRecord>): ForumPostRecord | undefined => {
  const post = forumPosts.find(item => item.id === id)
  if (!post) return undefined
  Object.assign(post, patch)
  if (!post.updatedAt) post.updatedAt = new Date()
  return post
}

export const deleteForumPost = (id: string): boolean => {
  const index = forumPosts.findIndex(item => item.id === id)
  if (index === -1) return false
  forumPosts.splice(index, 1)
  for (let i = forumComments.length - 1; i >= 0; i--) {
    if (forumComments[i].postId === id) forumComments.splice(i, 1)
  }
  return true
}

export const addForumComment = (record: Omit<ForumCommentRecord, 'id' | 'replies'>): ForumCommentRecord => {
  const full: ForumCommentRecord = { ...record, id: createId(), replies: [] }
  forumComments.push(full)
  return full
}

export const listForumComments = (postId: string): ForumCommentRecord[] =>
  forumComments.filter(item => item.postId === postId).sort((a, b) => +a.createdAt - +b.createdAt)

export const findForumComment = (id: string): ForumCommentRecord | undefined => forumComments.find(item => item.id === id)

export const updateForumComment = (id: string, patch: Partial<ForumCommentRecord>): ForumCommentRecord | undefined => {
  const comment = forumComments.find(item => item.id === id)
  if (!comment) return undefined
  Object.assign(comment, patch)
  comment.updatedAt = new Date()
  return comment
}

/**
 * Delete a comment. If the comment itself is a reply target it is removed;
 * removing a comment also removes its nested replies.
 */
export const deleteForumComment = (id: string): boolean => {
  const index = forumComments.findIndex(item => item.id === id)
  if (index === -1) return false
  forumComments.splice(index, 1)
  return true
}

export const addForumReply = (
  commentId: string,
  reply: Omit<ForumReplyRecord, 'id'>
): ForumReplyRecord | undefined => {
  const comment = forumComments.find(item => item.id === commentId)
  if (!comment) return undefined
  const full: ForumReplyRecord = { ...reply, id: createId() }
  comment.replies.push(full)
  return full
}

export const findForumReply = (id: string): ForumReplyRecord | undefined =>
  forumComments.flatMap(comment => comment.replies).find(reply => reply.id === id)

export const deleteForumReply = (id: string): boolean => {
  for (const comment of forumComments) {
    const index = comment.replies.findIndex(reply => reply.id === id)
    if (index >= 0) {
      comment.replies.splice(index, 1)
      return true
    }
  }
  return false
}

export const countForumComments = (postId: string): number => {
  const comments = forumComments.filter(item => item.postId === postId)
  return comments.reduce((total, comment) => total + 1 + comment.replies.length, 0)
}

export const allForumPosts = (): ForumPostRecord[] => forumPosts

/* ----------------------------- saved resources -------------------------- */

export const listSavedResources = (userId: string): SavedResourceRecord[] =>
  savedResources.filter(item => item.userId === userId).sort((a, b) => +b.savedAt - +a.savedAt)

export const isSavedResource = (userId: string, resourceKey: string): boolean =>
  savedResources.some(item => item.userId === userId && item.resourceKey === resourceKey)

export const saveResource = (userId: string, resourceKey: string): SavedResourceRecord => {
  const existing = savedResources.find(item => item.userId === userId && item.resourceKey === resourceKey)
  if (existing) return existing
  const record: SavedResourceRecord = { userId, resourceKey, savedAt: new Date() }
  savedResources.push(record)
  return record
}

export const removeSavedResource = (userId: string, resourceKey: string): boolean => {
  const index = savedResources.findIndex(item => item.userId === userId && item.resourceKey === resourceKey)
  if (index === -1) return false
  savedResources.splice(index, 1)
  return true
}

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

/* ------------------------------ chat sessions --------------------------- */

export const createChatSession = (userId: string, title = 'New conversation'): ChatSessionRecord => {
  const now = new Date()
  const session: ChatSessionRecord = { id: createId(), userId, title, createdAt: now, updatedAt: now }
  chatSessions.push(session)
  return session
}

export const listChatSessions = (userId: string): ChatSessionRecord[] =>
  chatSessions.filter(item => item.userId === userId).sort((a, b) => +b.updatedAt - +a.updatedAt)

export const findChatSession = (id: string, userId?: string): ChatSessionRecord | undefined =>
  chatSessions.find(item => item.id === id && (!userId || item.userId === userId))

export const touchChatSession = (id: string, title?: string): void => {
  const session = chatSessions.find(item => item.id === id)
  if (!session) return
  session.updatedAt = new Date()
  if (title) session.title = title.slice(0, 80)
}

export const removeChatSession = (id: string, userId: string): boolean => {
  const index = chatSessions.findIndex(item => item.id === id && item.userId === userId)
  if (index === -1) return false
  chatSessions.splice(index, 1)
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    if (chatMessages[i].sessionId === id) chatMessages.splice(i, 1)
  }
  return true
}

export const addChatMessage = (record: Omit<ChatMessageRecord, 'id'>): ChatMessageRecord => {
  const full: ChatMessageRecord = { ...record, id: createId() }
  chatMessages.push(full)
  return full
}

export const listChatMessages = (sessionId: string): ChatMessageRecord[] =>
  chatMessages.filter(item => item.sessionId === sessionId).sort((a, b) => +a.createdAt - +b.createdAt)

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
  chatSessions.length = 0
  chatMessages.length = 0
  forumComments.length = 0
  savedResources.length = 0
}
