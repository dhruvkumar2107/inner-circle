import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, ShieldAlert, Sparkles, Waves } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, Note, PageHeader, SectionTitle } from '../components/ui'
import { INPUT_META, RULES, inferSupport, smoothnessDemo } from '../lib/fuzzy'
import { useT } from '../i18n'
import { analyze, emotionLabelKey, topicKey, sentimentLabelKey } from '../lib/sentiment'

const PIPELINE = [
  { title: 'You choose what to share', body: 'Mood check-ins, conversations, screening answers — every part is optional and nothing is scheduled for you.' },
  { title: 'Language is read, not judged', body: 'A rule-based sentiment and emotion analysis runs in your browser and is always labelled as simulated in the interface.' },
  { title: 'Screening scores where you took one', body: 'PHQ-9 and GAD-7 answers become standard-band scores. They describe reported symptoms, never a condition.' },
  { title: '14 transparent fuzzy rules', body: 'Overlapping membership functions turn those signals into a support level — no cliff edges between “fine” and “not fine”.' },
  { title: 'Support suggestions come first', body: 'The result is a suggestion: talk, breathe, re-check, or reach a professional. Crisis language and the PHQ-9 safety question bypass all of it.' },
]

const SLIDER_DEFAULTS = { phq9: 6, gad7: 7, sentiment: -0.2, stress: 6, functional: 4, safetyOverride: false }

export default function SupportInsights() {
  const { assessments, recentSentiment } = useApp()
  const t = useT()
  const [inputs, setInputs] = useState(SLIDER_DEFAULTS)
  const [demoText, setDemoText] = useState('I have two deadlines this week and I can barely sleep.')

  const result = useMemo(() => inferSupport(inputs), [inputs])
  const smooth = useMemo(() => smoothnessDemo({ ...inputs, phq9: 9 }), [inputs])
  const demo = useMemo(() => analyze(demoText), [demoText])

  const set = (key, value) => setInputs((prev) => ({ ...prev, [key]: value }))

  const useMyData = () => {
    const latest = [...assessments].reverse()
    const phq = latest.find((a) => a.type === 'phq9')
    const gad = latest.find((a) => a.type === 'gad7')
    setInputs((prev) => ({
      ...prev,
      phq9: phq ? phq.score : prev.phq9,
      gad7: gad ? gad.score : prev.gad7,
      sentiment: Number(recentSentiment.toFixed(1)),
      functional: phq && phq.functional != null ? phq.functional : prev.functional,
    }))
  }

  const TONE_CLASS = { low: 'band-low', mid: 'band-mid', high: 'band-high' }

  return (
    <div className="page">
      <PageHeader
        kicker="HOW INNER CIRCLE WORKS"
        title="From what you share to the support you get"
        sub="No black box: every step below is the actual logic this prototype runs, in plain language you can poke at."
        action={<Badge tone="demo">Illustrative model</Badge>}
      />

      <div className="flow-steps">
        {PIPELINE.map((step, i) => (
          <div className="flow-step" key={step.title}>
            <span className="flow-step-num">{i + 1}</span>
            <span><b>{step.title}</b><small>{step.body}</small></span>
          </div>
        ))}
      </div>

      <SectionTitle
        title="Sentiment analysis, live"
        sub="Type anything and watch the simulated analysis respond. This runs entirely in your browser."
        action={<Badge tone="demo">Simulated</Badge>}
      />
      <section className="card card-pad">
        <div className="field">
          <span>Your words</span>
          <textarea
            value={demoText}
            onChange={(event) => setDemoText(event.target.value)}
            placeholder="e.g. The semester is getting on top of me…"
            rows={2}
          />
        </div>
        <div className="analysis-strip" style={{ marginBottom: '0.8rem' }}>
          <b>Sentiment</b>
          <span className={`meter ${demo.sentiment.score < -0.12 ? 'neg' : ''}`} aria-hidden="true">
            <i style={{ width: `${Math.round(((demo.sentiment.score + 1) / 2) * 100)}%` }} />
          </span>
          <span>{t(sentimentLabelKey(demo.sentiment.label))} ({demo.sentiment.score}) · confidence {demo.sentiment.confidence}</span>
          <span>· <b>{t(emotionLabelKey(demo.emotion.primary))}</b></span>
          {demo.topics.primary !== 'General' && <span>· topic: <b>{t(topicKey(demo.topics.primary))}</b></span>}
        </div>
        {demo.crisis.isCrisis ? (
          <Note tone="rose" icon={ShieldAlert}>
            <b>Crisis language detected (“{demo.crisis.phrase}”).</b> This bypasses scoring, mood and
            fuzzy logic entirely — urgent support opens immediately, with no delay and no interpretation.
          </Note>
        ) : (
          <p className="verify-note">
            A lexicon-based simulation, not a trained model — it demonstrates the flow a real model
            would plug into. It never determines risk on its own.
          </p>
        )}
      </section>

      <SectionTitle
        title="The fuzzy support engine"
        sub="Move any input and watch the memberships, the rules that fire, and the support category move with it — smoothly."
        action={<button className="btn btn-soft btn-sm" onClick={useMyData}>Use my latest data</button>}
      />

      <section className="grid" style={{ gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)', alignItems: 'start' }}>
        <div className="card card-pad">
          <span className="kicker">INPUTS</span>
          {Object.entries(INPUT_META).map(([key, meta]) => (
            <div className="slider-row" key={key}>
              <label htmlFor={`slider-${key}`}>{meta.label}</label>
              <input
                id={`slider-${key}`}
                type="range"
                min={meta.min}
                max={meta.max}
                step={meta.step || 1}
                value={inputs[key]}
                onChange={(event) => set(key, Number(event.target.value))}
              />
              <b>{inputs[key]}{meta.unit}</b>
            </div>
          ))}
          <div className="setting-row">
            <span>
              <b>Safety flag</b>
              <small>Shows what happens when crisis language or the PHQ-9 safety answer is present.</small>
            </span>
            <button
              type="button"
              className={`switch ${inputs.safetyOverride ? 'on' : ''}`}
              aria-pressed={inputs.safetyOverride}
              aria-label="Toggle safety flag"
              onClick={() => set('safetyOverride', !inputs.safetyOverride)}
            />
          </div>
          <p className="verify-note" style={{ marginTop: '0.7rem' }}>
            Membership functions and rules are ILLUSTRATIVE research defaults written for this
            prototype. They are not clinically calibrated and must be reviewed with qualified
            clinicians before any real use.
          </p>
        </div>

        <div className="card card-pad">
          <div className="score-block" style={{ marginBottom: '1rem' }}>
            <span className="score-ring" style={{ '--pct': result.riskScore }} aria-hidden="true">
              <span>{result.riskScore}<small>of 100</small></span>
            </span>
            <div>
              <span className={`band-pill ${TONE_CLASS[result.tone]}`}>Tier {result.tier}</span>
              <p className="lead" style={{ margin: '0.55rem 0 0.2rem' }}>{t(result.categoryLabelKey)}</p>
              <p className="small muted" style={{ margin: 0 }}>
                Driven by: {result.narrative.map((n) => t(n)).join(', ')}.
              </p>
            </div>
          </div>

          {inputs.safetyOverride && (
            <div style={{ marginBottom: '0.8rem' }}>
              <Note tone="rose" icon={ShieldAlert}>
                <b>Safety flag on.</b> The engine is bypassed in the real flow — crisis language never
                waits for a fuzzy score. Here it shows the conservative tier-3 output for demonstration.
              </Note>
            </div>
          )}

          <span className="kicker">MEMBERSHIPS — HOW “FUZZY” EACH INPUT IS</span>
          {Object.entries(result.memberships).map(([key, sets]) => (
            <div className="mf-row" key={key}>
              <span>{INPUT_META[key].label}</span>
              <span className="mf-bars">
                {Object.entries(sets).map(([setName, value]) => (
                  <span className="mf-bar" key={setName}>
                    <label>{setName}</label>
                    <span className="mf-track"><i style={{ width: `${Math.round(value * 100)}%` }} /></span>
                  </span>
                ))}
              </span>
              <span className="mf-val">{Math.round((sets.Low ?? sets.Negative ?? 0) * 100)}%+</span>
            </div>
          ))}

          <span className="kicker" style={{ marginTop: '1.1rem' }}>RULES THAT FIRED ({result.firedRules.length} of {RULES.length})</span>
          <p className="verify-note" style={{ marginTop: '-0.4rem', marginBottom: '0.6rem' }}>{t('how.rulesEnglishNote')}</p>
          {RULES.map((rule) => {
            const fired = result.firedRules.find((r) => r.id === rule.id)
            return (
              <div className={`rule-row ${fired ? 'fired' : ''}`} key={rule.id}>
                <span className="rule-id">{rule.id}</span>
                <span>{rule.description} → <b>{rule.output}</b></span>
                {fired && <span className="rule-strength">{Math.round(fired.strength * 100)}%</span>}
              </div>
            )
          })}
          {result.warning && <p className="verify-note">{result.warning}</p>}

          <span className="kicker" style={{ marginTop: '1.1rem' }}>WHAT DROVE IT</span>
          <div className="chip-row" style={{ marginBottom: '0.8rem' }}>
            {result.contributors.map((c) => (
              <span className="chip" key={c.factorKey} style={{ cursor: 'default' }}>{t(c.factorKey)} · {Math.round(c.weight * 100)}%</span>
            ))}
          </div>

          <span className="kicker">SUGGESTIONS THIS PRODUCES</span>
          <div className="flow-steps">
            {result.suggestions.map((s) => (
              <div className="flow-step" key={s.key}>
                <span className="flow-step-num"><Waves size={13} /></span>
                <span style={{ flex: 1 }}>
                  <b>{t(s.labelKey)}</b>
                  <small>{t(s.noteKey)}</small>
                </span>
                <Link className="btn btn-soft btn-sm" to={s.to}>Open <ArrowRight size={13} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionTitle title="Why fuzzy, and why safety sits outside it" />
      <div className="grid grid-2">
        <section className="card card-pad">
          <span className="kicker">NO CLIFF EDGES</span>
          <p className="small" style={{ color: 'var(--ink-2)' }}>
            A hard threshold would call a score of 10 “a problem” and 9 “not a problem”. Fuzzy logic
            grades memberships instead, so neighbouring scores give nearly identical support:
          </p>
          <div className="chip-row">
            <span className="chip" style={{ cursor: 'default' }}>PHQ-9 = 9 → <b>&nbsp;{smooth.a}</b></span>
            <span className="chip" style={{ cursor: 'default' }}>PHQ-9 = 10 → <b>&nbsp;{smooth.b}</b></span>
            <span className="chip chip-on" style={{ cursor: 'default' }}>difference: {smooth.diff}</span>
          </div>
        </section>
        <section className="card card-pad">
          <span className="kicker">SAFETY BYPASSES EVERYTHING</span>
          <p className="small" style={{ color: 'var(--ink-2)', marginBottom: '0.6rem' }}>
            Crisis wording in any message, and any answer other than “Not at all” on the PHQ-9
            self-harm question, open urgent support immediately — before any score, any rule, any
            wait.
          </p>
          <Link className="btn btn-soft btn-sm" to="/companion"><MessageCircle size={14} /> Try it in the companion</Link>
        </section>
      </div>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey" icon={Sparkles}>
          Output categories describe reported symptom severity for support suggestions only — they
          are never a diagnosis, never a prescription, and never shared with anyone but you.
        </Note>
      </div>
    </div>
  )
}
