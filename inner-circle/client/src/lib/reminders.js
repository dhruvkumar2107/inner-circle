import { load, save } from './storage.js'

/**
 * Tiny, dependency-free helpers for the optional daily mood check-in reminder.
 *
 * There is no service worker or push, so a reminder can only appear while this
 * browser tab is open. These helpers stay honest about that: nothing is
 * scheduled by the OS and nothing runs once the browser is closed.
 */

export const REMINDER_LAST_KEY = 'ic.reminder.lastFired'

/** Browser notifications are only available when the API exists. */
export const canNotify = () => typeof window !== 'undefined' && 'Notification' in window

/** Current permission: 'granted' | 'denied' | 'default' | 'unsupported'. */
export const permission = () => (canNotify() ? Notification.permission : 'unsupported')

/**
 * Ask the browser for notification permission. Safe when unsupported — it
 * resolves to 'unsupported' rather than throwing.
 */
export const ensurePermission = async () => {
  if (!canNotify()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return permission()
  }
}

/**
 * Show a browser notification, but only when permission is granted AND the tab
 * is hidden — so we never double up with the in-app toast while the user is
 * looking at the app. Returns whether a notification was shown.
 */
export const notify = (title, body) => {
  if (!canNotify() || Notification.permission !== 'granted') return false
  if (typeof document !== 'undefined' && !document.hidden) return false
  try {
    new Notification(title, { body })
    return true
  } catch {
    return false
  }
}

/** Whether an 'HH:MM' time has already passed at `now` on the same day. */
export const isPast = (timeStr, now = new Date()) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(timeStr || ''))
  if (!match) return false
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return false
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes
}

/** Read the date key ('YYYY-MM-DD') of the last fired reminder, if any. */
export const getLastFired = () => load(REMINDER_LAST_KEY, null)

/** Persist the date key of the last fired reminder. */
export const setLastFired = (dateKey) => save(REMINDER_LAST_KEY, dateKey)
