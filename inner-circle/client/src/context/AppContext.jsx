import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { load, save, remove, uid, todayKey } from '../lib/storage'

const KEYS = {
  profile: 'ic.profile',
  consents: 'ic.consents',
  settings: 'ic.settings',
  moods: 'ic.moods',
  entries: 'ic.entries',
  wins: 'ic.wins',
  assessments: 'ic.assessments',
  messages: 'ic.messages',
}

const DEFAULT_SETTINGS = {
  tts: false,
  voiceGuidance: false,
}

/**
 * All prototype state lives here: the demo profile, mood check-ins, journal
 * entries, tiny wins, screening records, the companion conversation and the
 * privacy/consent settings. Everything is stored in this browser only — no
 * real sensitive information is collected and nothing is transmitted.
 */
const AppContext = createContext(null)

/** Demo-only one-way hash so a password is never kept in plain text in storage. */
const demoHash = (value) => {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0
  return `demo$${hash.toString(36)}`
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => load(KEYS.profile, null))
  const [consents, setConsents] = useState(() => load(KEYS.consents, { terms: false, research: false, termsAt: null }))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) }))
  const [moods, setMoods] = useState(() => load(KEYS.moods, []))
  const [entries, setEntries] = useState(() => load(KEYS.entries, []))
  const [wins, setWins] = useState(() => load(KEYS.wins, []))
  const [assessments, setAssessments] = useState(() => load(KEYS.assessments, []))
  const [messages, setMessages] = useState(() => load(KEYS.messages, []))
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [safetyTrigger, setSafetyTrigger] = useState('manual')
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  useEffect(() => save(KEYS.profile, profile), [profile])
  useEffect(() => save(KEYS.consents, consents), [consents])
  useEffect(() => save(KEYS.settings, settings), [settings])
  useEffect(() => save(KEYS.moods, moods), [moods])
  useEffect(() => save(KEYS.entries, entries), [entries])
  useEffect(() => save(KEYS.wins, wins), [wins])
  useEffect(() => save(KEYS.assessments, assessments), [assessments])
  useEffect(() => save(KEYS.messages, messages.slice(-80)), [messages])

  const toast = useCallback((message, tone = 'success') => {
    const id = (toastId.current += 1)
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600)
  }, [])

  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const register = useCallback(({ name, age, university, email, password, research }) => {
    const firstName = String(name).trim().split(/\s+/)[0] || 'Friend'
    const next = {
      name: String(name).trim(),
      firstName,
      age: Number(age),
      university: String(university).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash: demoHash(String(password)),
      createdAt: new Date().toISOString(),
    }
    setProfile(next)
    setConsents({ terms: true, research: Boolean(research), termsAt: new Date().toISOString() })
    return next
  }, [])

  const signIn = useCallback(
    (email, password) => {
      if (!profile) return { ok: false, error: 'No demo account on this device yet. Please register first.' }
      if (profile.email !== String(email).trim().toLowerCase()) return { ok: false, error: 'That email is not registered on this device.' }
      if (profile.passwordHash !== demoHash(String(password))) return { ok: false, error: 'That password does not match the demo account.' }
      return { ok: true }
    },
    [profile],
  )

  const signOut = useCallback(() => {
    remove(KEYS.profile)
    setProfile(null)
  }, [])

  const resetAll = useCallback(() => {
    Object.values(KEYS).forEach(remove)
    setProfile(null)
    setConsents({ terms: false, research: false, termsAt: null })
    setSettings(DEFAULT_SETTINGS)
    setMoods([])
    setEntries([])
    setWins([])
    setAssessments([])
    setMessages([])
  }, [])

  const addMood = useCallback((mood) => {
    const date = todayKey()
    let saved = null
    setMoods((list) => {
      const rest = list.filter((m) => m.date !== date)
      saved = { id: uid(), date, mood, createdAt: new Date().toISOString() }
      return [...rest, saved]
    })
    return saved
  }, [])

  const addEntry = useCallback((text) => {
    const entry = { id: uid(), date: todayKey(), text: String(text).trim(), createdAt: new Date().toISOString() }
    setEntries((list) => [entry, ...list])
    return entry
  }, [])
  const removeEntry = useCallback((id) => setEntries((list) => list.filter((e) => e.id !== id)), [])

  const addWin = useCallback((text) => {
    const win = { id: uid(), date: todayKey(), text: String(text).trim(), createdAt: new Date().toISOString() }
    setWins((list) => [win, ...list])
    return win
  }, [])
  const removeWin = useCallback((id) => setWins((list) => list.filter((w) => w.id !== id)), [])

  const addAssessment = useCallback((record) => {
    const next = { ...record, id: uid(), takenAt: new Date().toISOString() }
    setAssessments((list) => [...list, next])
    return next
  }, [])
  const removeAssessment = useCallback((id) => setAssessments((list) => list.filter((a) => a.id !== id)), [])

  const pushMessage = useCallback((message) => {
    const next = { id: uid(), at: new Date().toISOString(), ...message }
    setMessages((list) => [...list, next])
    return next
  }, [])
  const clearMessages = useCallback(() => setMessages([]), [])

  const openSafety = useCallback((trigger = 'manual') => {
    setSafetyTrigger(trigger)
    setSafetyOpen(true)
  }, [])
  const closeSafety = useCallback(() => setSafetyOpen(false), [])

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])
  const updateConsents = useCallback((patch) => setConsents((c) => ({ ...c, ...patch })), [])

  /** Rolling sentiment of recent user messages — the fuzzy engine's sentiment input. */
  const recentSentiment = useMemo(() => {
    const own = messages.filter((m) => m.role === 'user').slice(-5)
    if (!own.length) return 0
    const sum = own.reduce((acc, m) => acc + (m.sentiment ?? 0), 0)
    return Number((sum / own.length).toFixed(2))
  }, [messages])

  const todaysMood = useMemo(() => moods.find((m) => m.date === todayKey()) || null, [moods])

  const value = {
    profile,
    consents,
    settings,
    moods,
    entries,
    wins,
    assessments,
    messages,
    todaysMood,
    recentSentiment,
    register,
    signIn,
    signOut,
    resetAll,
    addMood,
    addEntry,
    removeEntry,
    addWin,
    removeWin,
    addAssessment,
    removeAssessment,
    pushMessage,
    clearMessages,
    updateSettings,
    updateConsents,
    safetyOpen,
    safetyTrigger,
    openSafety,
    closeSafety,
    toasts,
    toast,
    dismissToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
