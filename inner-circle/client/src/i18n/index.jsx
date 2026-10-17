import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { load, save } from '../lib/storage'

/**
 * Tiny, dependency-free i18n layer.
 *
 * Dictionaries live in ./locales/<lang>/<namespace>.json and are discovered
 * automatically, so adding a namespace file never requires editing this module.
 * Keys are written as "namespace.path.to.key". English is the fallback for any
 * missing translation, and an untranslated key renders as the key itself so a
 * gap is visible rather than blank.
 */

const LANG_KEY = 'ic.lang'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

const modules = import.meta.glob('./locales/*/*.json', { eager: true })

const DICTS = {}
Object.entries(modules).forEach(([path, mod]) => {
  const parts = path.split('/')
  const lang = parts[parts.length - 2]
  const ns = parts[parts.length - 1].replace('.json', '')
  DICTS[lang] = DICTS[lang] || {}
  DICTS[lang][ns] = mod.default || mod
})

const lookup = (dict, key) =>
  key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), dict)

const interpolate = (text, vars) =>
  vars ? String(text).replace(/\{\{(\w+)\}\}/g, (match, name) => (vars[name] ?? match)) : text

const translate = (lang, key, vars) => {
  const value = lookup(DICTS[lang], key)
  if (typeof value === 'string') return interpolate(value, vars)
  const fallback = lookup(DICTS.en, key)
  return typeof fallback === 'string' ? interpolate(fallback, vars) : key
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = load(LANG_KEY, 'en')
    return LANGUAGES.some((item) => item.code === stored) ? stored : 'en'
  })

  const setLang = useCallback((code) => {
    if (!LANGUAGES.some((item) => item.code === code)) return
    save(LANG_KEY, code)
    setLangState(code)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

/** `const t = useT()` then `t('home.greeting', { name })`. */
export const useT = () => useI18n().t

/** For non-React helpers that are handed the current language. */
export const translateFor = (lang, key, vars) => translate(lang, key, vars)
