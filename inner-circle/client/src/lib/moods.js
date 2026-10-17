/**
 * Mood options for the daily check-in and the gentle, optional suggestions that follow.
 *
 * Every user-visible string is a translation key (namespace `moods`) so the UI can
 * render in any supported language; emoji and routing stay language-independent.
 */

export const MOODS = [
  { key: 'happy', emoji: '😊', labelKey: 'moods.happy' },
  { key: 'calm', emoji: '🌿', labelKey: 'moods.calm' },
  { key: 'okay', emoji: '😐', labelKey: 'moods.okay' },
  { key: 'stressed', emoji: '😣', labelKey: 'moods.stressed' },
  { key: 'anxious', emoji: '😰', labelKey: 'moods.anxious' },
  { key: 'sad', emoji: '😞', labelKey: 'moods.sad' },
  { key: 'overwhelmed', emoji: '🥺', labelKey: 'moods.overwhelmed' },
]

export const moodMeta = (key) => MOODS.find((m) => m.key === key) || null

export const MOOD_SUGGESTIONS = {
  stressed: {
    titleKey: 'moods.suggestions.stressed.title',
    bodyKey: 'moods.suggestions.stressed.body',
    cta: { labelKey: 'moods.suggestions.stressed.cta', to: '/breathe?ex=minute' },
    alt: { labelKey: 'moods.suggestions.stressed.alt', to: '/companion' },
  },
  anxious: {
    titleKey: 'moods.suggestions.anxious.title',
    bodyKey: 'moods.suggestions.anxious.body',
    cta: { labelKey: 'moods.suggestions.anxious.cta', to: '/companion' },
    alt: { labelKey: 'moods.suggestions.anxious.alt', to: '/breathe?ex=grounding' },
  },
  sad: {
    titleKey: 'moods.suggestions.sad.title',
    bodyKey: 'moods.suggestions.sad.body',
    cta: { labelKey: 'moods.suggestions.sad.cta', to: '/companion' },
    alt: { labelKey: 'moods.suggestions.sad.alt', to: '/play' },
  },
  overwhelmed: {
    titleKey: 'moods.suggestions.overwhelmed.title',
    bodyKey: 'moods.suggestions.overwhelmed.body',
    cta: { labelKey: 'moods.suggestions.overwhelmed.cta', to: '/breathe?ex=minute' },
    alt: { labelKey: 'moods.suggestions.overwhelmed.alt', to: '/play' },
  },
  calm: {
    titleKey: 'moods.suggestions.calm.title',
    bodyKey: 'moods.suggestions.calm.body',
    cta: { labelKey: 'moods.suggestions.calm.cta', to: '/play' },
    alt: { labelKey: 'moods.suggestions.calm.alt', to: '#dismiss' },
  },
  happy: {
    titleKey: 'moods.suggestions.happy.title',
    bodyKey: 'moods.suggestions.happy.body',
    cta: { labelKey: 'moods.suggestions.happy.cta', to: '/mood?wins=1' },
    alt: { labelKey: 'moods.suggestions.happy.alt', to: '#dismiss' },
  },
  okay: {
    titleKey: 'moods.suggestions.okay.title',
    bodyKey: 'moods.suggestions.okay.body',
    cta: { labelKey: 'moods.suggestions.okay.cta', to: '/play' },
    alt: { labelKey: 'moods.suggestions.okay.alt', to: '#dismiss' },
  },
}

/** The "What would help right now?" choices — the user tells the app, not the other way round. */
export const NEED_CHOICES = [
  { key: 'talk', labelKey: 'moods.needs.talk', to: '/companion' },
  { key: 'calm', labelKey: 'moods.needs.calm', to: '/breathe' },
  { key: 'distraction', labelKey: 'moods.needs.distraction', to: '/play' },
  { key: 'understand', labelKey: 'moods.needs.understand', to: '/mood' },
  { key: 'professional', labelKey: 'moods.needs.professional', to: '/professional' },
]
