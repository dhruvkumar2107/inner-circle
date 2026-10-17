import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const localesDir = fileURLToPath(new URL('../src/i18n/locales/', import.meta.url))
const LANGS = ['en', 'hi', 'kn']

const EXPECTED_NAMESPACES = [
  'nav', 'common', 'moods', 'screening', 'home', 'companion', 'mood', 'assessments',
  'how', 'play', 'breathe', 'puzzles', 'chess', 'professional', 'settings', 'register',
]

const read = (lang, ns) => JSON.parse(readFileSync(join(localesDir, lang, `${ns}.json`), 'utf8'))

/** Flattens nested dictionaries and arrays into dotted keys -> leaf value. */
function flatten(value, prefix = '', out = {}) {
  if (Array.isArray(value)) {
    return value.reduce((acc, entry, index) => flatten(entry, `${prefix}.${index}`, acc), out)
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      flatten(entry, prefix ? `${prefix}.${key}` : key, out)
    }
    return out
  }
  out[prefix] = value
  return out
}

/** Collects the {{variable}} placeholders used inside a string. */
const vars = (text) => [...String(text).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]).sort()

test('every language directory exists and holds exactly the expected namespaces', () => {
  for (const lang of LANGS) {
    const files = readdirSync(join(localesDir, lang))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort()
    assert.deepEqual(files, [...EXPECTED_NAMESPACES].sort(), `${lang} namespaces must match the expected set`)
  }
})

test('every namespace has identical keys across all three languages', () => {
  for (const ns of EXPECTED_NAMESPACES) {
    const [base, ...rest] = LANGS.map((lang) => flatten(read(lang, ns)))
    const baseKeys = Object.keys(base).sort()
    assert.ok(baseKeys.length > 0, `${ns} must not be empty`)
    for (const [index, other] of rest.entries()) {
      const otherKeys = Object.keys(other).sort()
      const missing = baseKeys.filter((k) => !(k in other))
      const extra = otherKeys.filter((k) => !(k in base))
      assert.deepEqual(
        missing,
        [],
        `${ns}/${LANGS[index + 1]} is missing keys present in ${LANGS[0]}`,
      )
      assert.deepEqual(
        extra,
        [],
        `${ns}/${LANGS[index + 1]} has keys not present in ${LANGS[0]}`,
      )
    }
  }
})

test('all translation leaves are non-empty strings', () => {
  for (const lang of LANGS) {
    for (const ns of EXPECTED_NAMESPACES) {
      const flat = flatten(read(lang, ns))
      for (const [key, value] of Object.entries(flat)) {
        assert.equal(typeof value, 'string', `${lang}/${ns}.${key} must be a string`)
        assert.ok(value.trim().length > 0, `${lang}/${ns}.${key} must not be empty`)
      }
    }
  }
})

test('interpolation placeholders match across languages for every key', () => {
  for (const ns of EXPECTED_NAMESPACES) {
    const dictionaries = LANGS.map((lang) => flatten(read(lang, ns)))
    for (const key of Object.keys(dictionaries[0])) {
      const expected = vars(dictionaries[0][key])
      for (const [index, dict] of dictionaries.entries()) {
        if (index === 0) continue
        assert.deepEqual(
          vars(dict[key]),
          expected,
          `${ns}.${key}: ${LANGS[index]} has different {{placeholders}} than ${LANGS[0]}`,
        )
      }
    }
  }
})
