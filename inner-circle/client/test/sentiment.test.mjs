import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  analyze,
  checkCrisis,
  emotionLabelKey,
  topicKey,
  sentimentLabelKey,
} from '../src/lib/sentiment.js'

test('the source file is valid UTF-8 with real Devanagari and Kannada text', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/lib/sentiment.js', import.meta.url)), 'utf8')
  assert.ok(!source.includes('\uFFFD'), 'no replacement characters (encoding must not be corrupted)')
  assert.match(source, /[\u0900-\u097F]/, 'Devanagari crisis phrases must be present')
  assert.match(source, /[\u0C80-\u0CFF]/, 'Kannada crisis phrases must be present')
})

test('the crisis check is deterministic and never scores', () => {
  const hit = checkCrisis('I just want to die')
  assert.equal(hit.isCrisis, true)
  assert.equal(hit.severity, 'high')
  assert.ok(hit.phrase, 'the matched phrase is returned')

  const miss = checkCrisis('I am a bit tired today')
  assert.equal(miss.isCrisis, false)
  assert.equal(miss.severity, 'none')
  assert.equal(miss.phrase, null)
})

test('crisis detection covers English, romanised, Hindi and Kannada phrasing', () => {
  for (const text of [
    'I want to kill myself',
    'khudkushi',
    'मैं मरना चाहता हूँ',
    'आत्महत्या',
    'ನನ್ನನ್ನು ಕೊಲ್ಲ',
    'ಸಾವು ಬೇಕು',
  ]) {
    assert.equal(checkCrisis(text).isCrisis, true, `"${text}" must be detected as crisis language`)
  }
})

test('crisis detection is robust to surrounding punctuation and mixed scripts', () => {
  assert.equal(checkCrisis('!!!  मैं खुदकुशी  ...  ???').isCrisis, true)
  assert.equal(checkCrisis('').isCrisis, false)
  assert.equal(checkCrisis(null).isCrisis, false)
})

test('sentiment polarity responds to clearly positive and negative text', () => {
  const positive = analyze('I am so happy and excited today, everything feels great')
  assert.equal(positive.sentiment.label, 'Positive')
  assert.ok(positive.sentiment.score > 0, `expected a positive score, got ${positive.sentiment.score}`)
  assert.ok(positive.sentiment.confidence > 0 && positive.sentiment.confidence <= 0.95)

  const negative = analyze('I feel terrible and hopeless and I hate everything')
  assert.equal(negative.sentiment.label, 'Negative')
  assert.ok(negative.sentiment.score < 0, `expected a negative score, got ${negative.sentiment.score}`)
})

test('negation flips positive words so distress phrasing reads Negative (IC-01)', () => {
  for (const text of [
    'i am not feeling good',
    "i don't feel okay",
    'i don’t feel ok',
    'I am not well',
  ]) {
    const { sentiment } = analyze(text)
    assert.equal(sentiment.label, 'Negative', `"${text}" must be labelled Negative, got ${sentiment.label}`)
    assert.ok(sentiment.score < 0, `"${text}" must have a negative score, got ${sentiment.score}`)
  }

  const plain = analyze('I am feeling good today')
  assert.equal(plain.sentiment.label, 'Positive', 'unnegated positive wording must stay Positive')
})

test('analysis handles emoji, punctuation and unknown scripts without throwing', () => {
  for (const text of ['😀💯', '— ; DROP TABLE students; --', 'ನಮಸ್ಕಾರ', '你好世界', '']) {
    const result = analyze(text)
    assert.ok(result && typeof result === 'object')
    assert.ok(Number.isFinite(result.sentiment.score))
    assert.ok(result.emotion.primary)
    assert.ok(result.topics.primary)
    assert.equal(typeof result.crisis.isCrisis, 'boolean')
  }
})

test('emotion, topic and sentiment label helpers always return a translation key', () => {
  assert.equal(emotionLabelKey('neutral'), 'common.emotions.neutral')
  assert.match(emotionLabelKey('anything-unknown'), /^common\.emotions\./)
  assert.match(topicKey('Academic pressure'), /^common\.topics\./)
  assert.match(topicKey('nonsense'), /^common\.topics\./)
  assert.equal(topicKey('nonsense'), 'common.topics.general', 'unknown topics fall back to general')
  assert.equal(sentimentLabelKey('Positive'), 'common.sentiment.positive')
  assert.equal(sentimentLabelKey('Negative'), 'common.sentiment.negative')
  assert.equal(sentimentLabelKey('Neutral'), 'common.sentiment.neutral')
})

test('the analysis bundle exposes the documented shape', () => {
  const result = analyze('I am stressed about my exams')
  assert.ok(result.sentiment && 'score' in result.sentiment && 'label' in result.sentiment && 'confidence' in result.sentiment)
  assert.ok('primary' in result.emotion && Array.isArray(result.emotion.secondary))
  assert.ok('primary' in result.topics)
  assert.ok('isCrisis' in result.crisis)
})
