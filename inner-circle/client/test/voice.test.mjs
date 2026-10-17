import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SPEECH_LOCALES, VOICE_ERROR_KEYS, STT_UNAVAILABLE_KEY, speechSupport } from '../src/lib/voice.js'

const LANGS = ['en', 'hi', 'kn']
const common = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    {
      common: JSON.parse(
        readFileSync(fileURLToPath(new URL(`../src/i18n/locales/${lang}/common.json`, import.meta.url)), 'utf8'),
      ),
    },
  ]),
)

const resolve = (lang, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), common[lang])

test('every app language has a speech locale', () => {
  for (const lang of LANGS) {
    assert.ok(SPEECH_LOCALES[lang], `SPEECH_LOCALES must cover ${lang}`)
    assert.match(SPEECH_LOCALES[lang], /^[a-z]{2}-IN$/, `${lang} should use an Indian locale`)
  }
})

test('the voice messaging keys exist in all three languages', () => {
  const keys = [STT_UNAVAILABLE_KEY, ...Object.values(VOICE_ERROR_KEYS)]
  assert.ok(keys.length >= 3)
  for (const key of keys) {
    for (const lang of LANGS) {
      const value = resolve(lang, key)
      assert.equal(typeof value, 'string', `${lang} is missing "${key}"`)
      assert.ok(value.trim().length > 0, `${lang} has an empty "${key}"`)
    }
  }
})

test('speechSupport reports capabilities without touching browser globals', () => {
  const support = speechSupport()
  assert.equal(typeof support, 'object')
  for (const value of Object.values(support)) assert.equal(typeof value, 'boolean')
})
