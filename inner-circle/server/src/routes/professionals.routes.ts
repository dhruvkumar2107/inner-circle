import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { findProfessional, listProfessionals } from '../modules/store'

const router = Router()

router.get('/', requireAuth, (_req, res) => {
  res.json({
    professionals: listProfessionals().map(profile => ({
      id: profile.id,
      name: profile.name,
      title: profile.title,
      specialization: profile.specialization,
      languages: profile.languages,
      modes: profile.modes,
      availability: profile.availability,
    })),
  })
})

router.get('/:id/slots', requireAuth, (req, res) => {
  const profile = findProfessional(String(req.params.id))
  if (!profile) {
    res.status(404).json({ error: 'Professional not found.' })
    return
  }
  const today = new Date()
  const slots: Array<{ date: string; times: string[] }> = []
  for (let day = 1; day <= 7; day += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + day)
    slots.push({ date: date.toISOString().slice(0, 10), times: [...profile.availability] })
  }
  res.json({ professional: profile, slots })
})

export default router
