export interface CrisisResource {
  name: string
  number: string
  note: string
}

/** India crisis resources. Verify every number before launch. */
export const CRISIS_RESOURCES: CrisisResource[] = [
  { name: 'Tele-MANAS', number: '14416', note: 'National mental-health support (or 1800-891-4416)' },
  { name: 'KIRAN', number: '1800-599-0019', note: '24x7 psychological helpline' },
  { name: 'Emergency services', number: '112', note: 'For immediate danger' },
]

/** Institutional contacts are configurable by the admin. */
export const INSTITUTION_CONTACTS = {
  counselling: process.env.CAMPUS_COUNSELLING_NUMBER ?? 'Verify campus counselling number',
  security: process.env.CAMPUS_SECURITY_NUMBER ?? 'Verify campus security number',
}
