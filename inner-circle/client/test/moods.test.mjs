import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { MOODS, moodMeta, MOOD_SUGGESTIONS, NEED_CHOICES } from '../src/lib/moods.js'

const LANGS = ['en', 'hi', 'kn']
const dictionaries = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    {
      moods: JSON.parse(
        readFileSync(fileURLToPath(new URL(`../src/i18n/locales/${lang}/moods.json`, import.meta.url)), 'utf8'),
      ),
    },
  ]),
)

const resolve = (lang, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionaries[lang])

function assertResolves(where, key) {
  for (const lang of LANGS) {
    const value = resolve(lang, key)
    assert.equal(typeof value, 'string', `${where}: ${lang} is missing "${key}"`)
    assert.ok(value.trim().length > 0, `${where}: ${lang} has an empty "${key}"`)
  }
}

test('the seven moods are defined with an emoji and a translation key', () => {
  assert.equal(MOODS.length, 7)
  for (const mood of MOODS) {
    assert.ok(mood.key, 'each mood needs a key')
    assert.ok(mood.emoji && mood.emoji.length > 0, `mood ${mood.key} needs an emoji`)
    assert.ok(mood.emoji.length <= 4, `mood ${mood.key} emoji should be a single glyph`)
    assert.match(mood.labelKey, /^moods\./)
    assertResolves(mood.key, mood.labelKey)
    assert.equal(moodMeta(mood.key), mood)
  }
  assert.equal(moodMeta('not-a-mood'), null)
})

test('every mood suggestion is complete and translatable', () => {
  const moodKeys = new Set(MOODS.map((m) => m.key))
  for (const [mood, suggestion] of Object.entries(MOOD_SUGGESTIONS)) {
    assert.ok(moodKeys.has(mood), `${mood} is not a known mood`)
    assertResolves(`${mood}.title`, suggestion.titleKey)
    assertResolves(`${mood}.body`, suggestion.bodyKey)
    for (const [name, action] of [
      ['cta', suggestion.cta],
      ['alt', suggestion.alt],
    ]) {
      assert.ok(action, `${mood} needs a ${name}`)
      assertResolves(`${mood}.${name}`, action.labelKey)
      assert.match(action.to, /^(\/|#)/, `${mood}.${name}.to must be an in-app route or a #sentinel`)
    }
  }
})

test('"what would help right now" offers five translatable choices', () => {
  assert.equal(NEED_CHOICES.length, 5)
  for (const choice of NEED_CHOICES) {
    assert.ok(choice.key)
    assertResolves(choice.key, choice.labelKey)
    assert.match(choice.to, /^\//, `${choice.key}.to must be an in-app route`)
  }
  const routes = new Set(NEED_CHOICES.map((c) => c.to))
  assert.ok(routes.size >= 4, 'the choices should offer genuinely different destinations')
})
