import { FISInput, FISOutput, inferRisk } from './engine'

export const getExplanation = (inputs: FISInput): FISOutput => inferRisk(inputs)

export const getFiredRulesDetails = (
  inputs: FISInput,
): Array<{ id: string; strength: number; text: string }> => inferRisk(inputs).firedRules

export const validateDemoCase = (): { passed: boolean; actual: FISOutput; expectedTier: number } => {
  const actual = inferRisk({
    phq9: 8,
    gad7: 6,
    sentiment: -0.4,
    stress: 7,
    functional: 5,
  })
  return {
    passed: actual.tier === 2 && actual.riskScore >= 33 && actual.riskScore <= 70,
    actual,
    expectedTier: 2,
  }
}
