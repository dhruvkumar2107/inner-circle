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

test('the professional page uses the new care contacts module (no institution placeholder)', () => {
  assert.ok(!professionalPage.includes('institution'), 'Professional.jsx must not import or reference the removed institution placeholder config')
  assert.ok(!professionalPage.includes('INSTITUTION'), 'no INSTITUTION reference may remain')
  assert.ok(!/Doctor \d/.test(professionalPage), 'no dummy clinician names may remain')
})

test('locale files contain the new professional sections and no placeholder copy', () => {
  for (const lang of LANGS) {
    const parsed = JSON.parse(locales[lang])
    const flat = JSON.stringify(parsed)
    assert.ok(!/placeholder/i.test(flat), `${lang}/professional.json must not contain placeholder copy`)
    assert.ok(parsed.pending, `${lang} must explain that verified details are pending`)
    assert.ok(parsed.dept, `${lang} must have department contact section`)
    assert.ok(parsed.dept.demoLabel && parsed.dept.demoLabel.length > 0, `${lang} dept must have a demo label`)
    assert.ok(parsed.nearby, `${lang} must have nearby help section`)
    assert.ok(parsed.team, `${lang} must have demo clinician team section`)
    assert.ok(parsed.team.demoNotice && parsed.team.demoNotice.length > 0, `${lang} team must have a demo notice`)
    assert.ok(parsed.schedule, `${lang} must have appointment scheduling section`)
    assert.ok(parsed.appointments, `${lang} must have appointments section`)
    assert.ok(parsed.crisis, `${lang} must keep the crisis section`)
  }
})

test('the page still offers the urgent-support pathway', () => {
  assert.match(professionalPage, /openSafety\('manual'\)/, 'the urgent-support panel must stay reachable')
  assert.match(professionalPage, /CRISIS_RESOURCES/, 'verified crisis resources must remain listed')
  assert.match(professionalPage, /EMERGENCY_NUMBER/, 'emergency number must be used')
})

test('the page uses demo clinician data from careContacts', () => {
  assert.match(professionalPage, /DEMO_CLINICIANS/, 'demo clinicians data must be used')
  assert.match(professionalPage, /addAppointment/, 'appointment booking must be wired')
})