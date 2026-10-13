/**
 * Demo seed data for the Inner Circle research prototype.
 *
 * Creates one account per research persona plus volunteers, professionals and an
 * admin, then back-dates assessments, check-ins, risk inferences, appointments
 * and forum posts so trends and dashboards have data on first boot.
 *
 * Demo-only credentials (password for every account: DemoPass123). Never use
 * these in production.
 */
import bcrypt from 'bcryptjs'
import { findUserByEmail, insertUser, isAliasTaken, listUsers } from '../modules/auth/store'
import { generateUniqueAlias } from '../modules/auth/alias'
import type { UserRecord } from '../modules/users/userModel'
import { inferRisk } from '../fuzzy/engine'
import {
  addAppointment,
  addAssessment,
  addCheckin,
  addForumPost,
  addInference,
  addProfessional,
  allInferences,
  computeTrend,
  listProfessionals,
} from '../modules/store'

export const DEMO_PASSWORD = 'DemoPass123'

export const DEMO_ACCOUNTS = [
  { role: 'student', email: 'low@demo.innercircle.test', name: 'Aarav Low', alias: 'Serene Meadow' },
  { role: 'student', email: 'moderate@demo.innercircle.test', name: 'Mira Moderate', alias: 'Steady Lantern' },
  { role: 'student', email: 'high@demo.innercircle.test', name: 'Rohan High', alias: 'Gentle Harbor' },
  { role: 'student', email: 'worsening@demo.innercircle.test', name: 'Sana Worsening', alias: 'Quiet Willow' },
  { role: 'student', email: 'crisis@demo.innercircle.test', name: 'Dev Crisis', alias: 'Hopeful Aurora' },
  { role: 'volunteer', email: 'volunteer@demo.innercircle.test', name: 'Priya Volunteer', alias: 'Radiant Finch' },
  { role: 'professional', email: 'sarah@demo.innercircle.test', name: 'Sarah Johnson', alias: 'Dr. Sarah Johnson' },
  { role: 'professional', email: 'michael@demo.innercircle.test', name: 'Michael Chen', alias: 'Dr. Michael Chen' },
  { role: 'professional', email: 'intern@demo.innercircle.test', name: 'Ira Intern', alias: 'Dr. Ira Mehta' },
  { role: 'admin', email: 'admin@demo.innercircle.test', name: 'Asha Admin', alias: 'Calm Horizon' },
] as const

const daysAgo = (days: number, hour = 10): Date => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date
}

const daysAhead = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const severityFor = (total: number, isPhq: boolean): string => {
  if (total <= 4) return 'Minimal'
  if (total <= 9) return 'Mild'
  if (total <= 14) return 'Moderate'
  if (isPhq && total <= 19) return 'Moderately severe'
  return 'Severe'
}

interface Persona {
  email: string
  phq9: number[]
  gad7: number[]
  stress: number[]
  sentiment: number[]
  functional: number
  baseAnswers: { phq9: number[]; gad7: number[] }
}

const personaBackData: Persona[] = [
  {
    email: 'low@demo.innercircle.test',
    phq9: [4, 3, 2], gad7: [3, 2, 2], stress: [3, 3, 2], sentiment: [0.2, 0.3, 0.4],
    functional: 2,
    baseAnswers: { phq9: [1, 0, 1, 1, 0, 0, 0, 1, 0], gad7: [1, 0, 1, 1, 0, 0, 0] },
  },
  {
    email: 'moderate@demo.innercircle.test',
    phq9: [9, 8, 8], gad7: [7, 6, 6], stress: [6, 6, 7], sentiment: [-0.2, -0.3, -0.4],
    functional: 5,
    baseAnswers: { phq9: [1, 1, 1, 1, 1, 1, 1, 1, 0], gad7: [1, 1, 1, 1, 1, 1, 1] },
  },
  {
    email: 'high@demo.innercircle.test',
    phq9: [18, 19, 20], gad7: [15, 16, 16], stress: [8, 9, 9], sentiment: [-0.5, -0.6, -0.6],
    functional: 8,
    baseAnswers: { phq9: [2, 2, 2, 2, 2, 2, 2, 2, 0], gad7: [2, 2, 2, 2, 2, 2, 2] },
  },
  {
    email: 'worsening@demo.innercircle.test',
    phq9: [8, 11, 15], gad7: [7, 10, 13], stress: [5, 7, 9], sentiment: [-0.2, -0.4, -0.6],
    functional: 7,
    baseAnswers: { phq9: [1, 1, 1, 2, 1, 1, 1, 2, 0], gad7: [1, 1, 2, 2, 1, 1, 1] },
  },
  {
    email: 'crisis@demo.innercircle.test',
    phq9: [21, 22, 23], gad7: [17, 18, 18], stress: [9, 10, 10], sentiment: [-0.7, -0.7, -0.8],
    functional: 9,
    baseAnswers: { phq9: [2, 2, 2, 2, 2, 2, 2, 2, 1], gad7: [2, 2, 2, 2, 2, 2, 2] },
  },
]

const moodFor = (stress: number): 'Good' | 'Okay' | 'Stressed' | 'Low' | 'Overwhelmed' => {
  if (stress <= 2) return 'Good'
  if (stress <= 4) return 'Okay'
  if (stress <= 6) return 'Stressed'
  if (stress <= 8) return 'Low'
  return 'Overwhelmed'
}

const ensureUser = async (
  account: (typeof DEMO_ACCOUNTS)[number],
  passwordHash: string,
  index: number,
) => {
  const existing = await findUserByEmail(account.email)
  if (existing) return existing
  const [firstName, ...rest] = account.name.split(' ')
  try {
    return await insertUser({
      firstName,
      lastName: rest.join(' ') || 'Demo',
      email: account.email,
      passwordHash,
      role: account.role,
      alias: account.alias,
      college: 'Demo Institute of Technology',
      department: index % 2 === 0 ? 'Computer Science' : 'Psychology',
      year: `${(index % 4) + 1}`,
    })
  } catch (error) {
    // Two cold serverless instances can seed concurrently; the loser hits the
    // unique index. Re-read the winning record instead of aborting the seed.
    const duplicate = typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000
    if (duplicate) {
      const raced = await findUserByEmail(account.email)
      if (raced) return raced
    }
    throw error
  }
}

/**
 * Create a seed user idempotently. Tolerates two cold instances seeding at the
 * same time: a duplicate email resolves to the winning record, and a duplicate
 * alias retries with a freshly generated one.
 */
const createSeedUser = async (fields: Parameters<typeof insertUser>[0]): Promise<UserRecord> => {
  const existing = await findUserByEmail(fields.email)
  if (existing) return existing
  let candidate = fields
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await insertUser(candidate)
    } catch (error) {
      const duplicate =
        typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000
      if (!duplicate) throw error
      const raced = await findUserByEmail(fields.email)
      if (raced) return raced
      candidate = { ...candidate, alias: await generateUniqueAlias(isAliasTaken) }
    }
  }
  throw new Error(`Could not create seed user ${fields.email}`)
}

export const seedDemoData = async (): Promise<{ seeded: boolean; users: number }> => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const byEmail = new Map<string, string>()

  for (let index = 0; index < DEMO_ACCOUNTS.length; index += 1) {
    const account = DEMO_ACCOUNTS[index]
    const user = await ensureUser(account, passwordHash, index)
    byEmail.set(account.email, user.id)
  }

  const userId = (email: string): string => byEmail.get(email)!

  // Professional directory (seeded once per process)
  if (listProfessionals().length === 0) {
    addProfessional({
      id: 'prof-sarah',
      userId: userId('sarah@demo.innercircle.test'),
      name: 'Dr. Sarah Johnson',
      title: 'Clinical Psychologist',
      specialization: ['Anxiety', 'Depression', 'CBT'],
      languages: ['English', 'Hindi'],
      modes: ['Online', 'In-person'],
      availability: ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
    })
    addProfessional({
      id: 'prof-michael',
      userId: userId('michael@demo.innercircle.test'),
      name: 'Dr. Michael Chen',
      title: 'Counseling Psychologist',
      specialization: ['Stress', 'Academic pressure', 'Mindfulness'],
      languages: ['English', 'Kannada'],
      modes: ['Online', 'In-person'],
      availability: ['09:30 AM', '01:00 PM', '03:00 PM', '05:00 PM'],
    })
    addProfessional({
      id: 'prof-ira',
      userId: userId('intern@demo.innercircle.test'),
      name: 'Dr. Ira Mehta',
      title: 'Psychiatry Intern (supervised intervention — subject to institutional approval)',
      specialization: ['Mood', 'Sleep'],
      languages: ['English', 'Hindi'],
      modes: ['In-person'],
      availability: ['11:00 AM', '03:30 PM'],
    })
  }

  const professionals = listProfessionals()

  // Back-date persona history only if the domain store is empty
  if (allInferences().length === 0) {
    for (const persona of personaBackData) {
      const id = userId(persona.email)
      const personaKey = persona.email.split('@')[0]
      for (let step = 0; step < persona.phq9.length; step += 1) {
        const phq9 = persona.phq9[step]
        const gad7 = persona.gad7[step]
        const stress = persona.stress[step]
        const sentiment = persona.sentiment[step]
        const offset = (persona.phq9.length - 1 - step) * 14
        const takenAt = daysAgo(offset + 1)

        addAssessment({
          id: `seed-${personaKey}-${step}-phq9`,
          userId: id, type: 'PHQ9', answers: persona.baseAnswers.phq9, total: phq9,
          severity: severityFor(phq9, true), item9Flag: persona.baseAnswers.phq9[8] > 0, takenAt,
        })
        addAssessment({
          id: `seed-${personaKey}-${step}-gad7`,
          userId: id, type: 'GAD7', answers: persona.baseAnswers.gad7, total: gad7,
          severity: severityFor(gad7, false), item9Flag: false, takenAt,
        })

        const result = inferRisk({ phq9, gad7, sentiment, stress, functional: persona.functional, safetyOverride: false })
        const scores = allInferences().filter(item => item.userId === id).map(item => item.riskScore)
        addInference({
          id: `seed-${personaKey}-${step}-inference`,
          userId: id,
          inputs: { phq9, gad7, sentiment, stress, functional: persona.functional },
          memberships: result.memberships,
          firedRules: result.firedRules,
          contributors: result.contributors,
          narrative: result.narrative,
          riskScore: result.riskScore,
          tier: result.tier,
          level: result.level,
          safetyOverride: false,
          trend: computeTrend([...scores, result.riskScore].reverse()),
          createdAt: takenAt,
        })

        addCheckin({
          id: `seed-${personaKey}-${step}-checkin`,
          userId: id, mood: moodFor(stress), stress, functionalImpact: persona.functional,
          note: `Weekly check-in (${step + 1})`, sentiment, takenAt: daysAgo(offset + 2),
        })
      }
    }

    // Crisis persona: an explicit safety-flagged, item-9 positive inference
    const crisisId = userId('crisis@demo.innercircle.test')
    const crisisResult = inferRisk({ phq9: 23, gad7: 18, sentiment: -0.8, stress: 10, functional: 9, safetyOverride: true })
    addInference({
      id: 'seed-crisis-inference',
      userId: crisisId,
      inputs: { phq9: 23, gad7: 18, sentiment: -0.8, stress: 10, functional: 9 },
      memberships: crisisResult.memberships,
      firedRules: crisisResult.firedRules,
      contributors: crisisResult.contributors,
      narrative: crisisResult.narrative,
      riskScore: crisisResult.riskScore,
      tier: 3,
      level: 'High',
      safetyOverride: true,
      trend: 'Worsening',
      createdAt: daysAgo(0, 9),
    })

    // Additional anonymized students so aggregate analytics have cells >= 5
    const analyticsBands = [
      { band: 'Low', phq9: [3, 4, 4], gad7: [2, 3, 3], stress: [3, 4, 3], sentiment: [0.4, 0.3, 0.5], functional: 2 },
      { band: 'Moderate', phq9: [8, 9, 10], gad7: [6, 7, 8], stress: [6, 7, 6], sentiment: [-0.3, -0.4, -0.3], functional: 5 },
      { band: 'High', phq9: [18, 20, 19], gad7: [15, 16, 16], stress: [9, 9, 10], sentiment: [-0.6, -0.7, -0.6], functional: 8 },
    ]
    for (const group of analyticsBands) {
      for (let index = 0; index < 6; index += 1) {
        const email = `analytics-${group.band.toLowerCase()}-${index}@demo.innercircle.test`
        const created = await createSeedUser({
          firstName: group.band,
          lastName: `Student ${index + 1}`,
          email,
          passwordHash,
          role: 'student',
          alias: await generateUniqueAlias(isAliasTaken),
          college: 'Demo Institute of Technology',
        })
        const phq9 = group.phq9[index % group.phq9.length]
        const gad7 = group.gad7[index % group.gad7.length]
        const stress = group.stress[index % group.stress.length]
        const sentiment = group.sentiment[index % group.sentiment.length]
        const takenAt = daysAgo(2 + index)
        const analyticsKey = `analytics-${group.band.toLowerCase()}-${index}`
        addAssessment({
          id: `seed-${analyticsKey}-phq9`,
          userId: created.id, type: 'PHQ9', answers: Array(9).fill(Math.min(3, Math.round(phq9 / 9))),
          total: phq9, severity: severityFor(phq9, true), item9Flag: false, takenAt,
        })
        addAssessment({
          id: `seed-${analyticsKey}-gad7`,
          userId: created.id, type: 'GAD7', answers: Array(7).fill(Math.min(3, Math.round(gad7 / 7))),
          total: gad7, severity: severityFor(gad7, false), item9Flag: false, takenAt,
        })
        const result = inferRisk({ phq9, gad7, sentiment, stress, functional: group.functional, safetyOverride: false })
        addInference({
          id: `seed-${analyticsKey}-inference`,
          userId: created.id,
          inputs: { phq9, gad7, sentiment, stress, functional: group.functional },
          memberships: result.memberships,
          firedRules: result.firedRules,
          contributors: result.contributors,
          narrative: result.narrative,
          riskScore: result.riskScore,
          tier: result.tier,
          level: result.level,
          safetyOverride: false,
          trend: 'Stable',
          createdAt: takenAt,
        })
      }
    }

    // Appointments relative to today
    const moderateId = userId('moderate@demo.innercircle.test')
    const highId = userId('high@demo.innercircle.test')
    const [sarah, michael] = professionals
    addAppointment({
      id: 'seed-appt-moderate-sarah',
      userId: moderateId, professionalId: sarah.id, professionalName: sarah.name,
      date: daysAhead(3), time: '11:30 AM', durationMin: 60, type: 'Individual',
      mode: 'Online', location: 'Online', status: 'confirmed', priority: 'normal',
      notes: 'Would like to talk about exam stress.', history: [{ action: 'booked', at: daysAgo(2) }],
    })
    addAppointment({
      id: 'seed-appt-moderate-michael',
      userId: moderateId, professionalId: michael.id, professionalName: michael.name,
      date: daysAhead(-10), time: '01:00 PM', durationMin: 45, type: 'Follow-up',
      mode: 'In-person', location: 'Office', status: 'completed', priority: 'normal',
      history: [{ action: 'completed', at: daysAgo(10) }],
    })
    addAppointment({
      id: 'seed-appt-high-sarah',
      userId: highId, professionalId: sarah.id, professionalName: sarah.name,
      date: daysAhead(1), time: '04:30 PM', durationMin: 60, type: 'Emergency-priority',
      mode: 'Online', location: 'Online', status: 'confirmed', priority: 'emergency',
      notes: 'Priority review requested from recent check-ins.', history: [{ action: 'booked', at: daysAgo(0) }],
    })

    // Anonymous community board
    const roomSeed: Array<{ roomId: string; room: string; alias: string; body: string; days: number }> = [
      { roomId: 'exam-anxiety', room: 'Exam Anxiety', alias: 'Steady Lantern', body: 'How do you deal with exam anxiety? Every time a paper comes close, my mind goes blank.', days: 1 },
      { roomId: 'exam-anxiety', room: 'Exam Anxiety', alias: 'Radiant Finch', body: 'I break study into 25-minute blocks and do one box-breathing round between them. It genuinely helps.', days: 1 },
      { roomId: 'sleep', room: 'Sleep', alias: 'Quiet Willow', body: 'I keep a wind-down playlist and leave my phone across the room. Small change, big difference.', days: 2 },
      { roomId: 'loneliness', room: 'Loneliness', alias: 'Serene Meadow', body: 'Joined a study group this week. It felt awkward at first but it was worth it.', days: 3 },
      { roomId: 'burnout', room: 'Burnout', alias: 'Gentle Harbor', body: 'I asked for an extension instead of pushing through. Rest is not laziness.', days: 4 },
      { roomId: 'wins-gratitude', room: 'Wins & Gratitude', alias: 'Calm Horizon', body: 'Small win: I went for a walk every day this week. It helped me feel more grounded.', days: 5 },
      { roomId: 'general', room: 'General', alias: 'Hopeful Aurora', body: 'Reminder: taking a pause is also progress.', days: 6 },
      { roomId: 'relationships', room: 'Relationships', alias: 'Radiant Meadow', body: 'Learning to set boundaries with a friend. It is uncomfortable but necessary.', days: 7 },
    ]
    for (let i = 0; i < 30; i += 1) {
      const seed = roomSeed[i % roomSeed.length]
      addForumPost({
        id: `seed-post-${i}`,
        roomId: seed.roomId, room: seed.room, authorAlias: seed.alias, authorId: 'seed-hidden-author',
        body: seed.body, reactions: { support: (i % 5) + 2, relate: (i % 4) + 1, grow: (i % 3) },
        reports: 0, status: 'visible', flaggedCrisis: false, createdAt: daysAgo(seed.days + i),
      })
    }
  }

  return { seeded: true, users: (await listUsers()).length }
}

let seedPromise: Promise<{ seeded: boolean; users: number }> | null = null

/** Run the demo seed once per process (idempotent for MongoDB users). */
export const ensureSeeded = (): Promise<{ seeded: boolean; users: number }> => {
  if (!seedPromise) {
    seedPromise = seedDemoData().catch(error => {
      console.error('Demo seed failed:', error instanceof Error ? error.message : error)
      return { seeded: false, users: 0 }
    })
  }
  return seedPromise
}