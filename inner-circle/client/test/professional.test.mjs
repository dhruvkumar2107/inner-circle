import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const LANGS = ['en', 'hi', 'kn']

const readSource = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

const professionalPage = readSource('../src/pages/Professional.jsx')
const locales = Object.fromEntries(
  LANGS.map((lang) => [lang, readSource(`../src/i18n/locales/${lang}/professional.json`)]),
)

test('the professional page carries no placeholder institution config', () => {
  assert.ok(
    !professionalPage.includes('institution'),
    'Professional.jsx must not import or reference the removed institution placeholder config',
  )
  assert.ok(!professionalPage.includes('INSTITUTION'), 'no INSTITUTION reference may remain')
  assert.ok(!/Doctor \d/.test(professionalPage), 'no dummy clinician names may remain')
  assert.ok(!/placeholder/i.test(professionalPage), 'no placeholder copy may remain in the page source')
})

test('no locale file still advertises placeholder department, university or clinicians', () => {
  for (const lang of LANGS) {
    const parsed = JSON.parse(locales[lang])
    const flat = JSON.stringify(parsed)
    assert.ok(!/placeholder/i.test(flat), `${lang}/professional.json must not contain placeholder copy`)
    assert.equal(parsed.hero, undefined, `${lang} must not carry the placeholder hero section`)
    assert.equal(parsed.team, undefined, `${lang} must not carry the placeholder clinician team`)
    assert.equal(parsed.modal, undefined, `${lang} must not carry the appointment modal`)
    assert.equal(parsed.appts, undefined, `${lang} must not carry the appointment list`)
    assert.ok(parsed.pending, `${lang} must explain that verified details are pending`)
    assert.ok(parsed.crisis, `${lang} must keep the crisis section`)
  }
})

test('the page still offers the urgent-support pathway', () => {
  assert.match(professionalPage, /openSafety\('manual'\)/, 'the urgent-support panel must stay reachable')
  assert.match(professionalPage, /CRISIS_RESOURCES/, 'verified crisis resources must remain listed')
})
