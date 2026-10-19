/**
 * Verified and demo institutional contact data for the professional support page.
 * All phone numbers and details MUST be verified with the university/local providers
 * before any real deployment. Demo clinician profiles are explicitly fictional.
 */

export const DEPARTMENT = {
  name: 'Department of Psychiatry, Dayananda Sagar University',
  phone: '+91 80 0000 0000',
  email: 'psychiatry@dsu.example.edu',
  address: 'DSU Health Sciences Campus, Kumaraswamy Layout, Bengaluru 560078',
  hours: 'Mon–Fri, 9:00 am – 4:30 pm',
  demo: true,
}

export const NEARBY_CARE = [
  {
    key: 'ambulance',
    number: '108',
    labelKey: 'professional.nearby.ambulanceLabel',
    detailKey: 'professional.nearby.ambulanceDetail',
  },
  {
    key: 'hospital',
    phone: '+91 80 0000 0001',
    labelKey: 'professional.nearby.hospitalLabel',
    detailKey: 'professional.nearby.hospitalDetail',
  },
]

export const EMERGENCY_NUMBER = '112'

/** Demo clinician profiles — explicitly fictional, for prototype only. */
export const DEMO_CLINICIANS = [
  {
    id: 'clin-1',
    name: 'Dr. A. Example',
    title: 'Demo Psychiatrist',
    qualification: 'MD Psychiatry',
    experienceYears: 12,
    supportAreas: ['anxiety', 'depression', 'academicStress'],
    slots: [
      '2026-10-21T10:00:00',
      '2026-10-21T11:30:00',
      '2026-10-22T14:00:00',
      '2026-10-23T10:00:00',
    ],
  },
  {
    id: 'clin-2',
    name: 'Dr. B. Sample',
    title: 'Demo Clinical Psychologist',
    qualification: 'MPhil Clinical Psychology',
    experienceYears: 8,
    supportAreas: ['stress', 'sleep', 'relationships'],
    slots: [
      '2026-10-21T09:30:00',
      '2026-10-22T15:00:00',
      '2026-10-24T11:00:00',
    ],
  },
  {
    id: 'clin-3',
    name: 'Dr. C. Placeholder',
    title: 'Demo Counsellor',
    qualification: 'MA Counselling Psychology',
    experienceYears: 5,
    supportAreas: ['loneliness', 'motivation', 'generalWellbeing'],
    slots: [
      '2026-10-21T16:00:00',
      '2026-10-22T10:30:00',
      '2026-10-23T15:30:00',
      '2026-10-24T09:00:00',
    ],
  },
]