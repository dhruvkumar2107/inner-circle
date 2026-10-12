export const tokenKey = 'inner-circle-access'
export const aliasKey = 'inner-circle-alias'
export const roleKey = 'inner-circle-role'
export const riskKey = 'inner-circle-risk'

const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : ''

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const api = async (path, options = {}) => {
  const token = localStorage.getItem(tokenKey)
  let response
  try {
    response = await fetch(`${apiBase}/api${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('We could not reach Inner Circle. Please check your connection and try again.', 0)
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data.error || 'We could not complete that request. Please try again.', response.status)
  return data
}

export const getAlias = () => localStorage.getItem(aliasKey) || 'Gentle Friend'
export const getRole = () => localStorage.getItem(roleKey) || 'student'

export const setSession = ({ accessToken, user }) => {
  if (accessToken) localStorage.setItem(tokenKey, accessToken)
  if (user?.alias) localStorage.setItem(aliasKey, user.alias)
  if (user?.role) localStorage.setItem(roleKey, user.role)
}

export const clearSession = () => {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(aliasKey)
  localStorage.removeItem(roleKey)
  localStorage.removeItem(riskKey)
}

export const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatRelative = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

export const initials = (name) => (name || 'Friend').trim().slice(0, 1).toUpperCase()
