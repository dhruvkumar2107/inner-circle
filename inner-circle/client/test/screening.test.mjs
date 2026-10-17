import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PHQ9_ITEMS,
  GAD7_ITEMS,
  RESPONSES,
  DIFFICULTY_RESPONSES,
  PHQ9_MAX,
  GAD7_MAX,
  PHQ9_SAFETY_INDEX,
  scoreOf,
  phq9Severity,
  gad7Severity,
  severityFor,
  difficultyToFunctional,
} from '../src/lib/screening.js'

test('the instruments have the correct number of items and maxima', () => {
  assert.equal(PHQ9_ITEMS.length, 9)
  assert.equal(GAD7_ITEMS.length, 7)
  assert.equal(PHQ9_MAX, 27, '9 items x 3 = 27')
  assert.equal(GAD7_MAX, 21, '7 items x 3 = 21')
  assert.equal(PHQ9_SAFETY_INDEX, 8, 'PHQ-9 item 9 is the safety item (zero-based index 8)')
})

test('answer scales are translated-able (every option carries a labelKey)', () => {
  assert.equal(RESPONSES.length, 4, 'PHQ-9/GAD-7 use the standard 0-3 anchor scale')
  assert.equal(DIFFICULTY_RESPONSES.length, 4)
  for (const option of [...RESPONSES, ...DIFFICULTY_RESPONSES]) {
    assert.ok(option.labelKey, 'each answer option must have a labelKey')
    assert.equal(typeof option.value, 'number', 'each answer option must have a numeric value')
  }
})

test('scoreOf sums answers defensively', () => {
  assert.equal(scoreOf([]), 0)
  assert.equal(scoreOf([0, 1, 2, 3]), 6)
  assert.equal(scoreOf(['2', '3']), 5, 'numeric strings are coerced')
  assert.equal(scoreOf([null, undefined, 3]), 3, 'missing values count as zero')
})

test('PHQ-9 severity follows the published bands', () => {
  const bands = [
    [0, 'minimal'],
    [4, 'minimal'],
    [5, 'mild'],
    [9, 'mild'],
    [10, 'moderate'],
    [14, 'moderate'],
    [15, 'moderatelySevere'],
    [19, 'moderatelySevere'],
    [20, 'severe'],
    [27, 'severe'],
  ]
  for (const [score, level] of bands) {
    const result = phq9Severity(score)
    assert.equal(result.level, level, `PHQ-9 ${score} should be ${level}`)
    assert.equal(result.labelKey, `screening.severity.${level}.label`)
    assert.equal(result.shortKey, `screening.severity.${level}.short`)
    assert.ok(['low', 'mid', 'high'].includes(result.tone))
  }
})

test('GAD-7 severity follows the published bands', () => {
  const bands = [
    [0, 'minimal'],
    [4, 'minimal'],
    [5, 'mild'],
    [9, 'mild'],
    [10, 'moderate'],
    [14, 'moderate'],
    [15, 'severe'],
    [21, 'severe'],
  ]
  for (const [score, level] of bands) {
    assert.equal(gad7Severity(score).level, level, `GAD-7 ${score} should be ${level}`)
  }
})

test('severityFor dispatches on instrument type', () => {
  assert.equal(severityFor('phq9', 20).level, 'severe')
  assert.equal(severityFor('gad7', 20).level, 'severe')
  assert.equal(severityFor('phq9', 20).level, phq9Severity(20).level)
  assert.equal(severityFor('gad7', 3).level, gad7Severity(3).level)
})

test('the difficulty item maps onto the fuzzy functional-input scale', () => {
  assert.deepEqual([0, 1, 2, 3].map(difficultyToFunctional), [0, 3, 7, 10])
  assert.equal(difficultyToFunctional(), 0, 'a missing difficulty defaults to no impact')
  assert.equal(difficultyToFunctional(3), 10)
})
