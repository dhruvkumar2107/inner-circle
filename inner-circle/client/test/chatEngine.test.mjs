import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateReply, QUICK_PROMPTS } from '../src/lib/chatEngine.js'
import { analyze } from '../src/lib/sentiment.js'

const LANGS = ['en', 'hi', 'kn']
const locales = Object.fromEntries(
  LANGS.map((lang) => {
    const read = (ns) =>
      JSON.parse(readFileSync(fileURLToPath(new URL(`../src/i18n/locales/${lang}/${ns}.json`, import.meta.url)), 'utf8'))
    return [lang, { companion: read('companion'), common: read('common') }]
  }),
)

/** Resolves a translation key such as `companion.replies.anxious.0` in a language. */
const resolve = (lang, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), locales[lang])

/** Collects a reply and every key it references, then checks them in all languages. */
function checkReply(label, reply, sink) {
  assert.ok(reply.key, `${label} must return a reply key`)
  sink.push({ where: label, key: reply.key })
  for (const prompt of reply.prompts ?? []) sink.push({ where: `${label} prompt`, key: prompt.labelKey })
  if (reply.suggestion) sink.push({ where: `${label} suggestion`, key: reply.suggestion.labelKey })
}

test('crisis language always short-circuits to the urgent-support reply', () => {
  for (const text of ['I want to die', 'khudkushi', 'मैं खुदकुशी', 'ನನ್ನನ್ನು ಕೊಲ್ಲ']) {
    const reply = generateReply({ text })
    assert.equal(reply.crisis, true, `crisis text "${text}" must set crisis`)
    assert.equal(reply.intent, 'crisis')
    assert.equal(reply.key, 'companion.crisis.text')
    assert.match(reply.suggestion.to, /^\/professional/, 'crisis must route to professional support')
    assert.ok((reply.prompts ?? []).length > 0, 'crisis must still offer choices')
  }
})

test('every key the engine emits exists in all three languages', () => {
  const sink = []

  const batteries = [
    'I feel really anxious about everything',
    'my exams and assignments are piling up',
    'I am so overwhelmed right now',
    'I feel lonely and have no friends',
    'I cannot sleep at night',
    'hello there, how are you?',
    'something completely unrelated to anything',
    'just a plain sentence with no intent',
  ]

  for (const text of batteries) {
    for (const historyLength of [0, 1, 2, 3]) {
      const history = Array.from({ length: historyLength }, (_, i) => ({
        role: 'user',
        text: i % 2 === 0 ? 'I am stressed about my exams' : 'other',
      }))
      checkReply(`"${text}" (history ${historyLength})`, generateReply({ text, history }), sink)
    }
  }

  // Negative follow-up that should reuse the earlier topic.
  const topicReply = generateReply({
    text: 'I feel awful today',
    history: [{ role: 'user', text: 'I am stressed about my exams' }],
  })
  checkReply('topic follow-up', topicReply, sink)
  assert.match(topicReply.key, /^companion\.fallbacks\.topic\./, 'a topic fallback is expected')

  for (const prompt of QUICK_PROMPTS) sink.push({ where: 'quick prompt', key: prompt.labelKey })

  assert.ok(sink.length > 50, `expected a wide battery of keys, got ${sink.length}`)

  for (const { where, key } of sink) {
    for (const lang of LANGS) {
      const value = resolve(lang, key)
      assert.equal(typeof value, 'string', `${where}: ${lang} is missing "${key}"`)
      assert.ok(value.trim().length > 0, `${where}: ${lang} has an empty "${key}"`)
    }
  }
})

test('non-crisis messages are never flagged as crisis', () => {
  for (const text of ['I feel a bit anxious about my exams', 'I am doing fine today', 'hello']) {
    const reply = generateReply({ text })
    assert.equal(reply.crisis, false, `"${text}" must not be treated as crisis`)
    assert.notEqual(reply.intent, 'crisis')
  }
})

test('the reply cycles through alternatives as the conversation grows', () => {
  const history = Array.from({ length: 4 }, () => ({ role: 'user', text: 'other' }))
  const keys = new Set()
  for (const message of ['I was saying something else entirely', 'nothing here matches']) {
    for (let seed = 0; seed < 4; seed += 1) {
      keys.add(generateReply({ text: message, history: history.slice(0, seed) }).key)
    }
  }
  assert.ok(keys.size >= 4, `replies should vary with conversation length, saw ${keys.size} distinct keys`)
})

test('every suggestion and prompt points at a real in-app route', () => {
  const seen = new Set()
  for (const text of ['I feel anxious', 'my exams', 'I am overwhelmed', 'I feel lonely', 'I need to calm down']) {
    const reply = generateReply({ text })
    if (reply.suggestion) seen.add(reply.suggestion.to)
    for (const prompt of reply.prompts ?? []) seen.add(prompt.seed)
  }
  assert.ok(seen.size > 0)
  for (const route of seen) {
    if (route.startsWith('/')) {
      assert.match(route, /^\/[a-z]/, `route "${route}" must look like an app path`)
    }
  }
})

test('QUICK_PROMPTS carry a label and a resolvable seed', () => {
  assert.ok(QUICK_PROMPTS.length >= 5)
  for (const prompt of QUICK_PROMPTS) {
    assert.match(prompt.labelKey, /^companion\.quick\./)
    assert.equal(typeof prompt.seed, 'string')
    assert.ok(prompt.seed.trim().length > 0)
    // Each prompt seed must itself come back as a usable reply.
    const reply = generateReply({ text: prompt.seed })
    assert.ok(reply.key, `seed "${prompt.seed}" must produce a reply`)
    assert.equal(reply.crisis, false)
  }
})

test('negated or distressed wording never selects a cheerful positive reply (IC-01)', () => {
  const distressed = [
    'i am not feeling good',
    "i don't feel okay",
    'I feel sad',
    'not feeling well today',
    'I feel hopeless',
  ]
  for (const text of distressed) {
    const reply = generateReply({ text })
    assert.notEqual(reply.intent, 'positive', `"${text}" must not get the positive intent`)
    assert.notEqual(reply.key, 'companion.replies.positive.1', `"${text}" must not get the cheerful reply`)
    assert.equal(reply.crisis, false, `"${text}" is not crisis language`)
  }

  // The exact report case: label, score and reply must agree.
  const report = generateReply({ text: 'i am not feeling good' })
  assert.equal(report.intent, 'low', 'the report case must route to the empathetic low-mood intent')
  const { sentiment } = analyze('i am not feeling good')
  assert.equal(sentiment.label, 'Negative', 'the report case must read as Negative, not Neutral')

  // Genuine positives still get the positive intent.
  const positive = generateReply({ text: 'I am feeling good today, everything went well' })
  assert.equal(positive.intent, 'positive', 'a genuinely positive message must keep the positive intent')
})
