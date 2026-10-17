import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { INSTITUTION } from '../src/lib/institution.js'

const LANGS = ['en', 'hi', 'kn']
const professional = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    {
      professional: JSON.parse(
        readFileSync(fileURLToPath(new URL(`../src/i18n/locales/${lang}/professional.json`, import.meta.url)), 'utf8'),
      ),
    },
  ]),
)

const resolve = (lang, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), professional[lang])

test('the institution config stays in placeholder form', () => {
  assert.match(INSTITUTION.departmentName, /placeholder/i, 'the department name must be marked as a placeholder')
  assert.match(INSTITUTION.universityName, /placeholder/i, 'the university name must be marked as a placeholder')
  assert.match(INSTITUTION.counsellingOffice.timings, /placeholder/i)
  assert.ok(INSTITUTION.doctors.length >= 1)
})

test('no doctor entry carries a real-looking name, phone or email', () => {
  for (const doctor of INSTITUTION.doctors) {
    assert.match(doctor.displayName, /^Doctor \d+$/, `displayName "${doctor.displayName}" must stay a placeholder`)
    assert.match(doctor.contact.phone, /^\[.*\]$/, `phone "${doctor.contact.phone}" must be a bracketed placeholder`)
    assert.match(doctor.contact.email, /^\[.*\]$/, `email "${doctor.contact.email}" must be a bracketed placeholder`)
    assert.match(doctor.availability, /placeholder/i)
    assert.ok(!/\d{10}/.test(doctor.contact.phone), 'no real phone number may be stored')
  }
})

test('doctor roles are translated through the professional namespace', () => {
  for (const doctor of INSTITUTION.doctors) {
    assert.match(doctor.roleKey, /^professional\.roles\./)
    for (const lang of LANGS) {
      const value = resolve(lang, doctor.roleKey)
      assert.equal(typeof value, 'string', `${lang} is missing "${doctor.roleKey}"`)
      assert.ok(value.trim().length > 0, `${lang} has an empty "${doctor.roleKey}"`)
    }
  }
})

test('doctor ids are unique so history can reference them safely', () => {
  const ids = INSTITUTION.doctors.map((d) => d.id)
  assert.equal(new Set(ids).size, ids.length, 'doctor ids must be unique')
})
