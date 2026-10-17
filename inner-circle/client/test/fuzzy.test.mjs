import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  INPUT_MFS,
  OUTPUT_MFS,
  RULES,
  fuzzify,
  inferSupport,
  suggestionsFor,
  smoothnessDemo,
} from '../src/lib/fuzzy.js'

const moderateCase = { phq9: 8, gad7: 6, sentiment: -0.4, stress: 7, functional: 5 }

test('the documented worked example stays in the Moderate / Tier 2 band', () => {
  const result = inferSupport(moderateCase)
  assert.equal(result.tier, 2, 'the worked demo case must land on Tier 2')
  assert.ok(result.riskScore >= 33 && result.riskScore < 67, `score ${result.riskScore} must be in [33,67)`)
  assert.notEqual(result.category, 'Low')
  assert.notEqual(result.category, 'High')
  assert.equal(result.safetyOverride, false)
})

test('a safety override forces Tier 3 without changing the fuzzy score', () => {
  const plain = inferSupport(moderateCase)
  const overridden = inferSupport({ ...moderateCase, safetyOverride: true })

  assert.equal(overridden.tier, 3)
  assert.equal(overridden.category, 'High')
  assert.equal(overridden.safetyOverride, true)
  assert.equal(overridden.riskScore, plain.riskScore, 'the override must not move the underlying score')
})

test('inputs are clamped to their documented ranges', () => {
  const high = inferSupport({ phq9: 999, gad7: -40, sentiment: 7, stress: 0, functional: 500 })
  const low = inferSupport({ phq9: -5, gad7: 99, sentiment: -99, stress: 99, functional: -9 })

  assert.ok(high.memberships.phq9.High === 1, 'an out-of-range PHQ-9 must saturate the High set')
  assert.ok(low.memberships.phq9.Low === 1)
  assert.ok(low.memberships.sentiment.Negative === 1)
  for (const input of Object.keys(INPUT_MFS)) {
    for (const [set, value] of Object.entries(high.memberships[input])) {
      assert.ok(value >= 0 && value <= 1, `${input}.${set} must be a membership in [0,1], got ${value}`)
    }
  }
})

test('membership functions peak at 1 on their plateau and are 0 outside their support', () => {
  const check = (label, mf) => {
    assert.equal(fuzzify(mf.b, mf), 1, `${label} must reach 1 at b`)
    if (mf.type === 'trap') {
      assert.equal(fuzzify(mf.c, mf), 1, `${label} (trapezoid) must stay at 1 through c`)
    } else {
      assert.equal(fuzzify(mf.a, mf), 0, `${label} (triangle) must fall to 0 at a`)
      assert.equal(fuzzify(mf.c, mf), 0, `${label} (triangle) must fall to 0 at c`)
    }
    assert.equal(fuzzify(-9999, mf), 0, `${label} must be 0 far below its support`)
    assert.equal(fuzzify(9999, mf), 0, `${label} must be 0 far above its support`)
    const midLeft = (mf.a + mf.b) / 2
    const midRight = (mf.b + mf.c) / 2
    for (const v of [midLeft, midRight]) {
      assert.ok(fuzzify(v, mf) >= 0 && fuzzify(v, mf) <= 1, `${label} must stay within [0,1]`)
    }
  }

  for (const [input, sets] of Object.entries(INPUT_MFS)) {
    for (const [set, mf] of Object.entries(sets)) check(`${input}.${set}`, mf)
  }
  for (const [set, mf] of Object.entries(OUTPUT_MFS)) check(`output.${set}`, mf)

  assert.equal(fuzzify(10, INPUT_MFS.phq9.Moderate), 1, 'the PHQ-9 Moderate set peaks at 10')
  assert.equal(fuzzify(27, INPUT_MFS.phq9.High), 1, 'the PHQ-9 High set saturates at 27')
})

test('the rule base has exactly the documented 14 rules and valid outputs', () => {
  assert.equal(RULES.length, 14)
  const outputs = new Set(Object.keys(OUTPUT_MFS))
  const inputs = new Set(Object.keys(INPUT_MFS))
  RULES.forEach((rule, index) => {
    assert.ok(rule.id, `rule ${index} must have an id`)
    assert.ok(rule.description, `rule ${index} must have a description`)
    assert.ok(outputs.has(rule.output), `rule ${index} outputs an unknown category`)
    for (const condition of [...rule.conditions, ...(rule.anyOf ?? [])]) {
      assert.ok(inputs.has(condition.input), `rule ${index} uses unknown input ${condition.input}`)
      assert.ok(
        INPUT_MFS[condition.input][condition.set],
        `rule ${index} uses unknown set ${condition.input}.${condition.set}`,
      )
    }
  })
})

test('moderate inputs fire rules and produce contributors that sum to 1', () => {
  const result = inferSupport(moderateCase)
  assert.ok(result.firedRules.length > 0, 'at least one rule must fire')
  for (const rule of result.firedRules) {
    assert.ok(rule.strength > 0 && rule.strength <= 1)
    assert.ok(rule.text, 'each fired rule must expose its sentence for the explainability page')
    assert.ok(Object.keys(OUTPUT_MFS).includes(rule.output))
  }
  const total = result.contributors.reduce((sum, c) => sum + c.weight, 0)
  assert.ok(Math.abs(total - 1) < 0.01, `contributor weights must sum to 1, got ${total}`)
  assert.ok(result.contributors[0].weight >= result.contributors.at(-1).weight, 'contributors are sorted')
})

test('low inputs score Tier 1 and severe inputs score Tier 3', () => {
  const calm = inferSupport({ phq9: 1, gad7: 0, sentiment: 0.8, stress: 1, functional: 0 })
  assert.equal(calm.tier, 1)
  assert.equal(calm.category, 'Low')

  const severe = inferSupport({ phq9: 24, gad7: 20, sentiment: -0.9, stress: 10, functional: 10 })
  assert.equal(severe.tier, 3)
  assert.equal(severe.category, 'High')
  assert.ok(severe.riskScore >= 67, `severe inputs must score 67+, got ${severe.riskScore}`)
})

test('scores are finite, rounded, and every category has suggestions', () => {
  for (const raw of [
    {},
    moderateCase,
    { phq9: 27, gad7: 21, sentiment: -1, stress: 10, functional: 10 },
    { phq9: 0, gad7: 0, sentiment: 1, stress: 1, functional: 0 },
  ]) {
    const result = inferSupport(raw)
    assert.ok(Number.isFinite(result.riskScore), 'risk score must be finite')
    assert.equal(result.riskScore, Number(result.riskScore.toFixed(1)), 'risk score is rounded to one decimal')
    assert.ok(result.tier >= 1 && result.tier <= 3)
    assert.ok(Array.isArray(result.narrative) && result.narrative.length > 0, 'a narrative must be produced')
  }

  for (const category of Object.keys(OUTPUT_MFS)) {
    for (const safety of [false, true]) {
      const suggestions = suggestionsFor(category, safety)
      assert.ok(Array.isArray(suggestions) && suggestions.length > 0, `${category} needs suggestions`)
      for (const suggestion of suggestions) {
        assert.ok(typeof suggestion === 'string' ? suggestion : suggestion.labelKey || suggestion.key || suggestion.titleKey,
          'each suggestion must carry a label')
      }
    }
  }
})

test('safety suggestions never imply self-management alone', () => {
  for (const category of Object.keys(OUTPUT_MFS)) {
    const safe = suggestionsFor(category, true)
    assert.ok(safe.length >= suggestionsFor(category, false).length || safe.length > 0)
    const flat = JSON.stringify(safe).toLowerCase()
    assert.ok(!flat.includes('streak'), 'safety-mode suggestions must not use streaks')
  }
})

test('the result exposes the shape the UI needs', () => {
  const result = inferSupport(moderateCase)
  for (const field of ['inputs', 'riskScore', 'tier', 'category', 'categoryLabelKey', 'tone', 'memberships', 'firedRules', 'contributors', 'narrative', 'safetyOverride', 'suggestions']) {
    assert.ok(field in result, `result must include ${field}`)
  }
  assert.match(result.categoryLabelKey, /^how\./, 'category label must be a translation key')
  assert.ok(result.suggestions.length > 0)
  assert.equal(result.inputs.phq9, moderateCase.phq9, 'the echoed inputs reflect what was passed')
})

test('nearby PHQ-9 scores produce nearly identical outputs (smoothness demo)', () => {
  const { a, b, diff } = smoothnessDemo(moderateCase)
  assert.ok(Number.isFinite(a) && Number.isFinite(b))
  assert.ok(diff < 10, `adjacent PHQ-9 scores should not jump, got a difference of ${diff}`)
})
