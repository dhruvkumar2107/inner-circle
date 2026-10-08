/**
 * Membership function definitions for the FIS inputs
 * These are the hand-written trapezoidal and triangular functions
 * that make the fuzzy logic inspectable for the research paper.
 */

// PHQ-9 total: 0-27
export const PHQ9_LOW = { type: 'trap', a: 0, b: 0, c: 4, d: 8 }
export const PHQ9_MODERATE = { type: 'tri', a: 5, b: 10, c: 16 }
export const PHQ9_HIGH = { type: 'trap', a: 13, b: 18, c: 27, d: 27 }

// GAD-7 total: 0-21
export const GAD7_LOW = { type: 'trap', a: 0, b: 0, c: 4, d: 7 }
export const GAD7_MODERATE = { type: 'tri', a: 4, b: 9, c: 15 }
export const GAD7_HIGH = { type: 'trap', a: 10, b: 15, c: 21, d: 21 }

// Recent emotional state (sentiment): -1 to +1
export const SENTIMENT_NEGATIVE = { type: 'trap', a: -1, b: -1, c: -0.5, d: -0.1 }
export const SENTIMENT_NEUTRAL = { type: 'tri', a: -0.4, b: 0, c: 0.4 }
export const SENTIMENT_POSITIVE = { type: 'trap', a: 0.1, b: 0.5, c: 1, d: 1 }

// Stress level: 1-10
export const STRESS_LOW = { type: 'trap', a: 1, b: 1, c: 3, d: 5 }
export const STRESS_MEDIUM = { type: 'tri', a: 3, b: 5.5, c: 8 }
export const STRESS_HIGH = { type: 'trap', a: 6, b: 8, c: 10, d: 10 }

// Functional impact: 0-10
export const FUNCTIONAL_LOW = { type: 'trap', a: 0, b: 0, c: 2, d: 4 }
export const FUNCTIONAL_MODERATE = { type: 'tri', a: 3, b: 5, c: 7 }
export const FUNCTIONAL_HIGH = { type: 'trap', a: 6, b: 8, c: 10, d: 10 }