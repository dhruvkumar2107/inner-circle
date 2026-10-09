import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import {
  addAppointment,
  addAudit,
  findAppointment,
  findAppointmentForSlot,
  findProfessional,
  listAppointments,
} from '../modules/store'

const router = Router()

const bookSchema = z.object({
  professionalId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date'),
  time: z.string().min(1).max(20),
  type: z.string().min(1).max(40).default('Individual'),
  mode: z.enum(['Online', 'In-person']).default('Online'),
  notes: z.string().max(500).optional(),
  priority: z.enum(['normal', 'emergency']).default('normal'),
})

/** GET /api/appointments — the signed-in student's appointments. */
router.get('/', requireAuth, (req, res) => {
  res.json({ appointments: listAppointments(req.auth!.sub) })
})

/** POST /api/appointments — book a new appointment. */
router.post('/', requireAuth, (req, res) => {
  const parsed = bookSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please complete the booking details.' })
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  if (parsed.data.date < today) {
    res.status(400).json({ error: 'Please choose a date that is today or later.' })
    return
  }
  const professional = findProfessional(parsed.data.professionalId)
  if (!professional) {
    res.status(404).json({ error: 'That guide is not available.' })
    return
  }
  if (findAppointmentForSlot(parsed.data.professionalId, parsed.data.date, parsed.data.time)) {
    res.status(409).json({ error: 'That time is already booked with this guide. Please choose another slot.' })
    return
  }
  const appointment = addAppointment({
    userId: req.auth!.sub,
    professionalId: professional.id,
    professionalName: professional.name,
    date: parsed.data.date,
    time: parsed.data.time,
    durationMin: parsed.data.type === 'Follow-up' ? 45 : 60,
    type: parsed.data.type,
    mode: parsed.data.mode,
    location: parsed.data.mode === 'Online' ? 'Online' : 'Office',
    status: 'confirmed',
    ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
    priority: parsed.data.priority,
    history: [{ action: 'booked', at: new Date() }],
  })
  addAudit({
    actorId: req.auth!.sub, role: req.auth!.role, action: 'appointment_booked',
    targetUserId: req.auth!.sub, resource: 'appointments', ip: req.ip,
    meta: { appointmentId: appointment.id, professionalId: professional.id },
  })
  res.status(201).json({ appointment, message: 'Appointment booked' })
})

const updateSchema = z.object({
  action: z.enum(['reschedule', 'cancel']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().min(1).max(20).optional(),
  note: z.string().max(300).optional(),
})

/** PATCH /api/appointments/:id — reschedule or cancel. */
router.patch('/:id', requireAuth, (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide a valid update.' })
    return
  }
  const appointment = findAppointment(String(req.params.id))
  if (!appointment || appointment.userId !== req.auth!.sub) {
    res.status(404).json({ error: 'Appointment not found.' })
    return
  }
  if (appointment.status === 'cancelled') {
    res.status(409).json({ error: 'This appointment is already cancelled.' })
    return
  }
  if (parsed.data.action === 'cancel') {
    appointment.status = 'cancelled'
    appointment.history.push({ action: 'cancelled', at: new Date(), ...(parsed.data.note ? { note: parsed.data.note } : {}) })
    res.json({ appointment, message: 'Appointment cancelled' })
    return
  }
  if (!parsed.data.date || !parsed.data.time) {
    res.status(400).json({ error: 'Please choose a new date and time.' })
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  if (parsed.data.date < today) {
    res.status(400).json({ error: 'Please choose a date that is today or later.' })
    return
  }
  const clash = findAppointmentForSlot(appointment.professionalId, parsed.data.date, parsed.data.time)
  if (clash && clash.id !== appointment.id) {
    res.status(409).json({ error: 'That time is already booked with this guide.' })
    return
  }
  appointment.date = parsed.data.date
  appointment.time = parsed.data.time
  appointment.status = 'scheduled'
  appointment.history.push({ action: 'rescheduled', at: new Date() })
  res.json({ appointment, message: 'Appointment rescheduled' })
})

export default router
