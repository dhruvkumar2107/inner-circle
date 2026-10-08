# Fuzzy Logic-Based Risk Stratification Module

The implementation in `server/src/fuzzy/engine.ts` is a hand-written Mamdani inference system. It is deterministic and returns membership values, fired rules, normalized contributors, a score, tier, narrative, and safety-override status.

## Inputs and membership sets

| Input | Range | Low / negative | Middle | High / positive |
| --- | --- | --- | --- | --- |
| PHQ-9 | 0–27 | Low `trap(0,0,4,8)` | Moderate `tri(5,10,16)` | High `trap(13,18,27,27)` |
| GAD-7 | 0–21 | Low `trap(0,0,4,7)` | Moderate `tri(4,9,15)` | High `trap(10,15,21,21)` |
| Sentiment | -1…+1 | Negative `trap(-1,-1,-0.5,-0.1)` | Neutral `tri(-0.4,0,0.4)` | Positive `trap(0.1,0.5,1,1)` |
| Stress | 1–10 | Low `trap(1,1,3,5)` | Medium `tri(3,5.5,8)` | High `trap(6,8,10,10)` |
| Functional impact | 0–10 | Low `trap(0,0,2,4)` | Moderate `tri(3,5,7)` | High `trap(6,8,10,10)` |

`tri(a,b,c)` is zero outside `[a,c]`, one at `b`, and linear on each side. `trap(a,b,c,d)` rises linearly from `a` to `b`, plateaus from `b` to `c`, and falls to `d`.

## Output, operators, and rules

Output sets are Low `trap(0,0,15,35)`, Moderate `tri(25,45,65)`, Elevated `tri(50,67,82)`, and High `trap(70,85,100,100)`. AND is minimum, OR is maximum, implication clips with minimum, aggregation is maximum, and centroid defuzzification samples integer scores 0 through 100.

The 14 rules are exported from the engine for inspection: low inputs/low stress → Low; low PHQ/GAD with positive sentiment → Low; moderate PHQ or GAD with medium stress → Moderate; both moderate → Moderate; both moderate with high stress → Elevated; high PHQ or GAD → High; negative sentiment and high functional impact → Elevated; moderate PHQ and high impact → Elevated; moderate GAD, high stress, negative sentiment → Elevated; high PHQ and high impact → High; high stress, high impact, negative sentiment → High; low PHQ/GAD with high stress → Moderate; neutral sentiment, low PHQ, moderate GAD → Moderate; positive sentiment, low impact, low stress → Low.

If no rule fires, the engine returns the centroid of the Moderate set and a warning. Tier mapping is `<33` Tier 1, `33–<67` Tier 2, and `≥67` Tier 3. A separate safety override always forces Tier 3 without changing the underlying fuzzy score.

## Worked demo case

Input: PHQ-9 `8`, GAD-7 `6`, sentiment `-0.4`, stress `7`, functional impact `5`. The unit test asserts that this stays in the Moderate / Tier 2 band and that the firing rules and contributor weights are returned. Run `npm test --workspace server -- --testPathPattern fuzzy` for the focused tests.

## Limitations

Membership parameters are expert-defined demonstration values and need clinical calibration and institutional approval. A fuzzy score is not a diagnosis, prognosis, or clinical decision. The safety override and all professional escalations must be independently tested and human-reviewed.
