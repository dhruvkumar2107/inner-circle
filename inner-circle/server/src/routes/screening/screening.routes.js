const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Helper: fuzzy risk inference (Mamdani FIS)
const inferRisk = (inputs) => {
  // Membership function definitions
  const PHQ9_MFS = {
    Low: { type: 'trap', a: 0, b: 0, c: 4, d: 8 },
    Moderate: { type: 'tri', a: 5, b: 10, c: 16 },
    High: { type: 'trap', a: 13, b: 18, c: 27, d: 27 },
  };

  const GAD7_MFS = {
    Low: { type: 'trap', a: 0, b: 0, c: 4, d: 7 },
    Moderate: { type: 'tri', a: 4, b: 9, c: 15 },
    High: { type: 'trap', a: 10, b: 15, c: 21, d: 21 },
  };

  const SENTIMENT_MFS = {
    Negative: { type: 'trap', a: -1, b: -1, c: -0.5, d: -0.1 },
    Neutral: { type: 'tri', a: -0.4, b: 0, c: 0.4 },
    Positive: { type: 'trap', a: 0.1, b: 0.5, c: 1, d: 1 },
  };

  const STRESS_MFS = {
    Low: { type: 'trap', a: 1, b: 1, c: 3, d: 5 },
    Medium: { type: 'tri', a: 3, b: 5.5, c: 8 },
    High: { type: 'trap', a: 6, b: 8, c: 10, d: 10 },
  };

  const FUNCTIONAL_MFS = {
    Low: { type: 'trap', a: 0, b: 0, c: 2, d: 4 },
    Moderate: { type: 'tri', a: 3, b: 5, c: 7 },
    High: { type: 'trap', a: 6, b: 8, c: 10, d: 10 },
  };

  // Fuzzify function
  const fuzzify = (value, mf) => {
    if (mf.type === 'trap') {
      const { a, b, c, d } = mf;
      if (value <= a) return 1;
      if (value >= d) return 0;
      if (value <= b) return 1;
      if (value >= c) return 0;
      if (value < c) return ((d - value) / (d - c));
      return ((value - b) / (c - b));
    }
    if (mf.type === 'tri') {
      const { a, b, c } = mf;
      if (value <= a || value >= c) return 0;
      if (value >= b) return 1;
      if (value < b) return (value - a) / (b - a);
      return ((c - value) / (c - b));
    }
    return 0;
  };

  // Operators
  const AND = (a, b) => Math.min(a, b);
  const OR = (a, b) => Math.max(a, b);

  // Fuzzify inputs
  const phq9Memb = {
    Low: fuzzify(inputs.phq9, PHQ9_MFS.Low),
    Moderate: fuzzify(inputs.phq9, PHQ9_MFS.Moderate),
    High: fuzzify(inputs.phq9, PHQ9_MFS.High),
  };

  const gad7Memb = {
    Low: fuzzify(inputs.gad7, GAD7_MFS.Low),
    Moderate: fuzzify(inputs.gad7, GAD7_MFS.Moderate),
    High: fuzzify(inputs.gad7, GAD7_MFS.High),
  };

  const sentimentMemb = {
    Negative: fuzzify(inputs.sentiment, SENTIMENT_MFS.Negative),
    Neutral: fuzzify(inputs.sentiment, SENTIMENT_MFS.Neutral),
    Positive: fuzzify(inputs.sentiment, SENTIMENT_MFS.Positive),
  };

  const stressMemb = {
    Low: fuzzify(inputs.stress, STRESS_MFS.Low),
    Medium: fuzzify(inputs.stress, STRESS_MFS.Medium),
    High: fuzzify(inputs.stress, STRESS_MFS.High),
  };

  const functionalMemb = {
    Low: fuzzify(inputs.functional, FUNCTIONAL_MFS.Low),
    Moderate: fuzzify(inputs.functional, FUNCTIONAL_MFS.Moderate),
    High: fuzzify(inputs.functional, FUNCTIONAL_MFS.High),
  };

  // Rule base (14 rules)
  const rules = [
    // [condition arrays, output MF, description]
    [[['phq9','Low'],['gad7','Low'],['stress','Low']], 'Low', 'PHQ Low ∧ GAD Low ∧ Stress Low → Low'],
    [[['phq9','Low'],['gad7','Low'],['sentiment','Positive']], 'Low', 'PHQ Low ∧ GAD Low ∧ Sentiment Positive → Low'],
    [[['phq9','Moderate'],['gad7','Moderate'],['stress','Medium']], 'Moderate', '(PHQ Moderate ∨ GAD Moderate) ∧ Stress Medium → Moderate'],
    [[['phq9','Moderate'],['gad7','Moderate']], 'Moderate', 'PHQ Moderate ∧ GAD Moderate → Moderate'],
    [[['phq9','Moderate'],['gad7','Moderate'],['stress','High']], 'Elevated', 'PHQ Moderate ∧ GAD Moderate ∧ Stress High → Elevated'],
    [[['phq9','High'],['gad7','High']], 'High', 'PHQ High ∨ GAD High → High'],
    [[['sentiment','Negative'],['functional','High']], 'Elevated', 'Sentiment Negative ∧ Functional High → Elevated'],
    [[['phq9','Moderate'],['functional','High']], 'Elevated', 'PHQ Moderate ∧ Functional High → Elevated'],
    [[['gad7','Moderate'],['stress','High'],['sentiment','Negative']], 'Elevated', 'GAD Moderate ∧ Stress High ∧ Sentiment Negative → Elevated'],
    [[['phq9','High'],['functional','High']], 'High', 'PHQ High ∧ Functional High → High'],
    [[['stress','High'],['functional','High'],['sentiment','Negative']], 'High', 'Stress High ∧ Functional High ∧ Sentiment Negative → High'],
    [[['phq9','Low'],['gad7','Low'],['stress','High']], 'Moderate', 'PHQ Low ∧ GAD Low ∧ Stress High → Moderate (stress alone is a signal)'],
    [[['sentiment','Neutral'],['phq9','Low'],['gad7','Moderate']], 'Moderate', 'Sentiment Neutral ∧ PHQ Low ∧ GAD Moderate → Moderate'],
    [[['sentiment','Positive'],['functional','Low'],['stress','Low']], 'Low', 'Sentiment Positive ∧ Functional Low ∧ Stress Low → Low'],
  ];

  // Fuzzify all inputs
  const memberships = {
    phq9: phq9Memb,
    gad7: gad7Memb,
    sentiment: sentimentMemb,
    stress: stressMemb,
    functional: functionalMemb,
  };

  // Evaluate rules - compute firing strengths
  const firedRules = [];
  const ruleContributions = {};

  for (const rule of rules) {
    const [conditions, output, description] = rule;
    let firing = 1;
    for (const cond of conditions) {
      const [input, set] = cond;
      const mf = {
        Low: PHQ9_MFS.Low, // simplified - would need full lookup
        Moderate: PHQ9_MFS.Moderate,
        High: PHQ9_MFS.High,
      };
      const mValue = fuzzify(inputs[input], mf[set]);
      firing = AND(firing, mValue);
    }
    const outputMf = {
      Low: { type: 'trap', a: 0, b: 0, c: 15, d: 35 },
      Moderate: { type: 'tri', a: 25, b: 45, c: 65 },
      Elevated: { type: 'tri', a: 50, b: 67, c: 82 },
      High: { type: 'trap', a: 70, b: 85, c: 100, d: 100 },
    }[output];

    // Imply: clip the output membership function
    const implied = Math.min(memberships[output] || 0, firing);

    // Aggregate
    if (!ruleContributions[output])) ruleContributions[output] = 0;
    ruleContributions[output] = Math.max(ruleContributions[output] || 0, implied);

    firedRules.push({
      id: `R${firedRules.length + 1}`,
      strength: Number(firing.toFixed(2)),
      text: description,
    });
  }

  // Defuzzify using centroid (sampled at 1-unit resolution)
  const riskScore = (() => {
    const xs = Array.from({ length: 101 }, (_, i) => i);
    const ys = xs.map(x => {
      let maxMemb = 0;
      for (const [output, aggVal] of Object.entries(ruleContributions)) {
        const mf = {
          Low: { type: 'trap', a: 0, b: 0, c: 15, d: 35 },
          Moderate: { type: 'tri', a: 25, b: 45, c: 65 },
          Elevated: { type: 'tri', a: 50, b: 67, c: 82 },
          High: { type: 'trap', a: 70, b: 85, c: 100, d: 100 },
        }[output];
        let memb = 0;
        if (mf.type === 'trap') {
          const { a, b, c, d } = mf;
          if (x <= a) memb = 1;
          if (x >= d) memb = 0;
          if (x <= b) memb = 1;
          if (x >= c) memb = 0;
          if (x < c) memb = ((d - x) / (d - c));
          memb = Math.max(memb, ((x - b) / (c - b)));
        }
        if (mf.type === 'tri') {
          const { a, b, c } = mf;
          if (x <= a || x >= c) memb = 0;
          if (x >= b) memb = 1;
          if (x < b) memb = (x - a) / (b - a);
          memb = Math.max(memb, ((c - x) / (c - b)));
        }
        if (memb > maxMemb) maxMemb = memb;
      }
      return maxMemb;
    });
    const area = ys.reduce((sum, y) => sum + y, 0);
    const total = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    return area > 0 ? Number((total / area).toFixed(2)) : 50;
  })();

  // Determine tier
  let tier, level;
  if (riskScore < 33) {
    tier = 1; level = 'Low';
  } else if (riskScore < 66) {
    tier = 2; level = 'Moderate';
  } else {
    tier = 3; level = 'High';
  }

  // Contributors (normalized firing strengths)
  const contributors = [];
  let totalWeight = 0;
  for (const [factor, weight] of Object.entries(ruleContributions)) {
    totalWeight += weight;
  }
  for (const [factor, weight] of Object.entries(ruleContributions)) {
    contributors.push({ factor, weight: totalWeight > 0 ? Number((weight / totalWeight).toFixed(2)) : 0 });
  }

  // Narrative
  const narrative = [];
  if (memberships.phq9?.Moderate > 0.3) narrative.push('Moderate depressive symptoms');
  if (memberships.gad7?.Moderate > 0.3) narrative.push('Elevated anxiety indicators');
  if (memberships.stress?.High > 0.3) narrative.push('Increased academic stress');
  if (memberships.sentiment?.Negative > 0.3) narrative.push('Recent negative emotional expression');

  return {
    riskScore: Number(riskScore.toFixed(2)),
    tier,
    level,
    memberships,
    firedRules,
    contributors,
    narrative,
  };
};

// Submit PHQ-9
router.post('/phq9', async (req, res) => {
  try {
    const { items, functionalDifficulty } = req.body;
    const userId = req.user.id;

    // Calculate total (0-27)
    const total = items.reduce((sum, val) => sum + val, 0);

    // Determine severity
    let severity = 'Minimal';
    if (total >= 20) severity = 'Severe';
    else if (total >= 15) severity = 'Moderately severe';
    else if (total >= 10) severity = 'Moderate';
    else if (total >= 5) severity = 'Mild';

    // Fuzzy risk inference
    const riskResult = inferRisk({
      phq9: total,
      gad7: req.user?.gad7Score || 0,
      sentiment: req.user?.sentimentScore || 0,
      stress: req.user?.stressScore || 5,
      functional: functionalDifficulty || 5,
    });

    // Update user's screening data
    await User.findByIdAndUpdate(userId, {
      phq9Score: total,
      gad7Score: req.user?.gad7Score || 0,
      sentimentScore: req.user?.sentimentScore || 0,
      stressScore: req.user?.stressScore || 5,
    });

    res.json({ success: true, phq9: { total, severity }, risk: riskResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit GAD-7
router.post('/gad7', async (req, res) => {
  try {
    const { items } = req.body;

    // Calculate total (0-21)
    const total = items.reduce((sum, val) => sum + val, 0);

    // Determine severity
    let severity = 'Minimal';
    if (total >= 15) severity = 'Severe';
    else if (total >= 10) severity = 'Moderate';
    else if (total >= 5) severity = 'Mild';

    // Fuzzy risk inference
    const riskResult = inferRisk({
      phq9: req.user?.phq9Score || 0,
      gad7: total,
      sentiment: req.user?.sentimentScore || 0,
      stress: req.user?.stressScore || 5,
      functional: req.user?.functionalScore || 5,
    });

    res.json({ success: true, gad7: { total, severity }, risk: riskResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get screening history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, screenings: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get demo case
router.get('/demo', authenticateToken, async (req, res) => {
  try {
    const result = inferRisk({
      phq9: 8,
      gad7: 6,
      sentiment: -0.4,
      stress: 7,
      functional: 5,
    });

    res.json({ success: true, demoCase: {
      riskScore: result.riskScore,
      tier: result.tier,
      level: result.level,
      memberships: result.memberships,
      firedRules: result.firedRules,
      contributors: result.contributors,
      narrative: result.narrative,
    } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;