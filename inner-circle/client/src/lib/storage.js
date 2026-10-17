/** Tiny helpers for the demo's browser storage. Nothing sensitive leaves the device. */

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage may be full or blocked — the demo continues in memory */
  }
}

export const remove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export const todayKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Date-only strings ("2026-10-17") are read as local midnight, not UTC. */
const toDate = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

export const shortDate = (value) =>
  toDate(value).toLocaleDateString([], { day: 'numeric', month: 'short' })

export const longDate = (value) =>
  toDate(value).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

export const timeOf = (value) =>
  new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** Last `n` days, oldest first. */
export const lastDays = (n) => {
  const out = []
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d)
  }
  return out
}
