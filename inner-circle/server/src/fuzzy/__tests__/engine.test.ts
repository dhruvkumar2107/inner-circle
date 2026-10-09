import { inferRisk, verifySmoothness } from '../engine'
import { validateDemoCase } from '../explain'

describe('fuzzy logic-based risk stratification engine', () => {
  it('places a low-risk profile in tier 1', () => {
    const output = inferRisk({ phq9: 1, gad7: 1, sentiment: 0.8, stress: 2, functional: 1 })
    expect(output.tier).toBe(1)
    expect(output.riskScore).toBeLessThan(33)
  })

  it('places a high-risk profile in tier 3', () => {
    const output = inferRisk({ phq9: 25, gad7: 19, sentiment: -0.9, stress: 10, functional: 9 })
    expect(output.tier).toBe(3)
    expect(output.riskScore).toBeGreaterThanOrEqual(67)
  })

  it('never lowers the tier when a safety override is present', () => {
    const output = inferRisk({ phq9: 0, gad7: 0, sentiment: 1, stress: 1, functional: 0, safetyOverride: true })
    expect(output.tier).toBe(3)
    expect(output.safetyOverride).toBe(true)
  })

  it('passes the documented reference demo case', () => {
    const result = validateDemoCase()
    expect(result.passed).toBe(true)
    expect(result.actual.tier).toBe(result.expectedTier)
  })

  it('rises monotonically as PHQ-9 increases', () => {
    const { scoreA, scoreB, diff } = verifySmoothness(5, 20)
    expect(scoreB).toBeGreaterThan(scoreA)
    expect(diff).toBeGreaterThan(0)
  })

  it('exposes fired rules and a plain-language narrative', () => {
    const output = inferRisk({ phq9: 14, gad7: 12, sentiment: -0.4, stress: 7, functional: 6 })
    expect(output.firedRules.length).toBeGreaterThan(0)
    expect(output.narrative.length).toBeGreaterThan(0)
    expect(output.memberships).toBeDefined()
    expect(output.level).toMatch(/^(Low|Moderate|Elevated|High)$/)
  })
})
