/** Mood options for the daily check-in and the gentle, optional suggestions that follow. */

export const MOODS = [
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'calm', label: 'Calm', emoji: '🌿' },
  { key: 'okay', label: 'Okay', emoji: '😐' },
  { key: 'stressed', label: 'Stressed', emoji: '😣' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'sad', label: 'Sad', emoji: '😞' },
  { key: 'overwhelmed', label: 'Overwhelmed', emoji: '🥺' },
]

export const moodMeta = (key) => MOODS.find((m) => m.key === key) || null

export const MOOD_SUGGESTIONS = {
  stressed: {
    title: 'Try a one-minute breathing reset',
    body: 'A single quiet minute can soften the edges of a stressful day.',
    cta: { label: 'Start one-minute reset', to: '/breathe?ex=minute' },
    alt: { label: 'Talk it through instead', to: '/companion' },
  },
  anxious: {
    title: 'Talk to your companion, or ground yourself',
    body: 'The 5-4-3-2-1 grounding exercise is a gentle place to start.',
    cta: { label: 'Open AI companion', to: '/companion' },
    alt: { label: 'Try grounding', to: '/breathe?ex=grounding' },
  },
  sad: {
    title: 'A supportive conversation or a soft activity',
    body: 'You do not have to explain everything — a few words are enough.',
    cta: { label: 'Talk to your companion', to: '/companion' },
    alt: { label: 'Explore a relaxing activity', to: '/play' },
  },
  overwhelmed: {
    title: 'Break the day into smaller pieces',
    body: 'A short pause first, then one small step at a time.',
    cta: { label: 'Take a short pause', to: '/breathe?ex=minute' },
    alt: { label: 'Just a distraction', to: '/play' },
  },
  calm: {
    title: 'Keep the good moment going',
    body: 'Explore an activity, or simply carry on with your day.',
    cta: { label: 'Explore Play & Relax', to: '/play' },
    alt: { label: 'Continue', to: '#dismiss' },
  },
  happy: {
    title: 'Record your positive moment',
    body: 'Tiny wins add up — save this one in your mood journey.',
    cta: { label: 'Add a tiny win', to: '/mood?wins=1' },
    alt: { label: 'Continue', to: '#dismiss' },
  },
  okay: {
    title: 'Choose whatever feels right',
    body: 'A puzzle, a breathing break, or a chat — there is no wrong choice.',
    cta: { label: 'Open Play & Relax', to: '/play' },
    alt: { label: 'Continue', to: '#dismiss' },
  },
}

/** The "What would help right now?" choices — the user tells the app, not the other way round. */
export const NEED_CHOICES = [
  { key: 'talk', label: 'I want to talk', to: '/companion' },
  { key: 'calm', label: 'I want to calm down', to: '/breathe' },
  { key: 'distraction', label: 'I want a distraction', to: '/play' },
  { key: 'understand', label: 'I want to understand my feelings', to: '/mood' },
  { key: 'professional', label: 'I want professional support', to: '/professional' },
]
