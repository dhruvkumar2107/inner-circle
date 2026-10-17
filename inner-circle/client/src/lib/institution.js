/**
 * ============================================================================
 *  PLACEHOLDER INSTITUTION CONFIG — NOTHING IN THIS FILE IS REAL
 * ============================================================================
 *
 *  The university MUST replace every placeholder below before launch:
 *  the department name, the university name, the counselling office timings,
 *  and — for each doctor — the display name, availability and every contact
 *  detail (phone and email).
 *
 *  Rules for this file:
 *  - Never add a real person's name, phone number, email address or URL here.
 *    Only the university may fill in verified, official details.
 *  - Role labels are shown to users, so they are translated through the
 *    `professional` namespace using `roleKey`; the `role` field keeps a plain
 *    English label for non-translated consumers.
 *  - Contact values must stay obvious placeholders until the university
 *    supplies verified details, in keeping with the app's "verify before
 *    launch" note.
 *
 *  This object mirrors no real institution and no real clinicians.
 * ============================================================================
 */

export const INSTITUTION = {
  departmentName: 'Department Name (placeholder)',
  universityName: 'University Name (placeholder)',
  counsellingOffice: {
    timings: 'Counselling office timings placeholder — to be confirmed by the university',
  },
  doctors: [
    {
      id: 'doctor-1',
      role: 'Consultant Psychiatrist (placeholder role label)',
      roleKey: 'professional.roles.consultant',
      displayName: 'Doctor 1',
      availability: 'Availability placeholder — to be confirmed',
      contact: {
        phone: '[phone number to be added]',
        email: '[email address to be added]',
      },
    },
    {
      id: 'doctor-2',
      role: 'Counselling Psychologist (placeholder role label)',
      roleKey: 'professional.roles.counselling',
      displayName: 'Doctor 2',
      availability: 'Availability placeholder — to be confirmed',
      contact: {
        phone: '[phone number to be added]',
        email: '[email address to be added]',
      },
    },
    {
      id: 'doctor-3',
      role: 'Clinical Psychologist (placeholder role label)',
      roleKey: 'professional.roles.clinical',
      displayName: 'Doctor 3',
      availability: 'Availability placeholder — to be confirmed',
      contact: {
        phone: '[phone number to be added]',
        email: '[email address to be added]',
      },
    },
  ],
}
