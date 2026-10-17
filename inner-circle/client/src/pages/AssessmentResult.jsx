import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CalendarClock, ClipboardCheck, HeartHandshake, MessageCircle, ShieldAlert, ShieldCheck, Wind } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, CRISIS_RESOURCES, Note, PageHeader, SectionTitle } from '../components/ui'
import { DIFFICULTY_RESPONSES, DISCLAIMER, GAD7_MAX, PHQ9_MAX, severityFor } from '../lib/screening'
import { longDate, timeOf } from '../lib/storage'

const BANDS = {
  phq9: ['Minimal', 'Mild', 'Moderate', 'Moderately severe', 'Severe'],
  gad7: ['Minimal', 'Mild', 'Moderate', 'Severe'],
}

const BAND_MEANING = {
  Minimal: 'The symptoms you reported are in the lowest range.',
  Mild: 'Some symptoms are showing up — worth keeping an eye on, and easy to start with small habits.',
  Moderate: 'Reported symptoms are sitting in the middle range. Support can make a real difference here.',
  'Moderately severe': 'Reported symptoms are toward the higher end. Talking to a qualified person is a sensible next step.',
  Severe: 'You reported a high level of symptoms. A qualified professional can help you sort out what this means.',
}

export default function AssessmentResult() {
  const { type } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { assessments, openSafety } = useApp()

  if (type !== 'phq9' && type !== 'gad7') return <Navigate to="/assessments" replace />

  const record =
    (location.state?.id && assessments.find((a) => a.id === location.state.id)) ||
    [...assessments].reverse().find((a) => a.type === type)

  if (!record) return <Navigate to="/assessments" replace />

  const max = type === 'phq9' ? PHQ9_MAX : GAD7_MAX
  const pct = Math.round((record.score / max) * 100)
  const tone = record.severity?.tone || severityFor(type, record.score).tone
  const bands = BANDS[type]
  const difficultyLabel = DIFFICULTY_RESPONSES[record.difficulty]?.label || 'Not given'
  const isHigh = tone === 'high' || record.safety

  return (
    <div className="page">
      <PageHeader
        kicker={`${type === 'phq9' ? 'PHQ-9' : 'GAD-7'} · SCREENING RESULT`}
        title="Your check-in result"
        sub={`${longDate(record.takenAt)} at ${timeOf(record.takenAt)} · saved on this device only`}
        action={<Badge tone={record.safety ? 'rose' : 'mint'}>{record.safety ? 'Support offered' : 'Screening, not a diagnosis'}</Badge>}
      />

      {record.safety && (
        <section className="card card-pad" style={{ borderColor: '#f0dcd9', background: 'var(--rose-50)', marginBottom: '1.2rem' }}>
          <span className="kicker" style={{ color: '#a35f5a' }}>PEOPLE BEFORE SCORES</span>
          <h2 style={{ fontSize: '1.2rem' }}>Please reach out before anything else</h2>
          <p className="small" style={{ color: '#8f5450', maxWidth: '64ch' }}>
            On this check-in you told us about thoughts of self-harm. That deserves a person, not a
            number — Inner Circle opens urgent support the moment you answer, without waiting for any
            score. If you may be in immediate danger, call 112 now.
          </p>
          <div className="crisis-options">
            {CRISIS_RESOURCES.map((item) => (
              <a key={item.number} href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}>
                <span className="crisis-icon"><HeartHandshake size={16} /></span>
                <span className="crisis-copy"><b>{item.label}</b><small>{item.number} · {item.detail}</small></span>
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => openSafety('assessment')}>Open urgent support options</button>
            <Link className="btn btn-outline" to="/professional">Department of Psychiatry</Link>
          </div>
        </section>
      )}

      <div className="grid grid-2">
        <section className="card card-pad">
          <div className="score-block">
            <span className="score-ring" style={{ '--pct': pct }} aria-hidden="true">
              <span>{record.score}<small>of {max}</small></span>
            </span>
            <div>
              <span className={`band-pill band-${tone}`}>{record.severity?.short}</span>
              <p className="lead" style={{ margin: '0.6rem 0 0.3rem' }}>{record.severity?.label}</p>
              <p className="small muted" style={{ margin: 0 }}>
                {BAND_MEANING[record.severity?.short] || ''}
              </p>
            </div>
          </div>
          <p className="verify-note" style={{ marginTop: '1rem' }}>
            Reported impact on daily life: <b>{difficultyLabel}</b>
          </p>
        </section>

        <section className="card card-pad">
          <span className="kicker">WHERE THIS SITS</span>
          <div className="chip-row" style={{ marginBottom: '0.8rem' }}>
            {bands.map((band) => (
              <span key={band} className={`chip ${band === record.severity?.short ? 'chip-on' : ''}`} style={{ cursor: 'default' }}>
                {band}
              </span>
            ))}
          </div>
          <Note tone="mint" icon={ShieldCheck}>
            {DISCLAIMER} The bands are the standard published ranges for{' '}
            {type === 'phq9' ? 'the PHQ-9' : 'the GAD-7'} — they describe reported symptom level, and
            only a qualified professional can interpret what it means for you.
          </Note>
        </section>
      </div>

      <SectionTitle
        title="What you can do next"
        sub={isHigh ? 'A few sensible steps — you choose the order, nothing is automatic.' : 'Optional, and always yours to pick.'}
      />
      <div className="grid grid-3">
        {isHigh && (
          <Link to="/professional" className="card card-click feature-card" style={{ borderColor: 'var(--mint-3)', background: 'var(--mint)' }}>
            <span className="feature-icon"><HeartHandshake size={19} /></span>
            <b>Contact a professional</b>
            <p>A qualified person can confirm what this result actually means. Inner Circle never can.</p>
            <span className="go">Get support <ArrowRight size={14} /></span>
          </Link>
        )}
        <Link to="/companion" className="card card-click feature-card">
          <span className="feature-icon"><MessageCircle size={19} /></span>
          <b>Talk it through</b>
          <p>Put into words what has been sitting heavily — the companion is there at any hour.</p>
          <span className="go">Open chat <ArrowRight size={14} /></span>
        </Link>
        <Link to="/breathe?ex=minute" className="card card-click feature-card">
          <span className="feature-icon"><Wind size={19} /></span>
          <b>A one-minute reset</b>
          <p>A quiet minute before you decide on anything else.</p>
          <span className="go">Start <ArrowRight size={14} /></span>
        </Link>
        <Link to="/assessments" className="card card-click feature-card">
          <span className="feature-icon"><ClipboardCheck size={19} /></span>
          <b>Re-check in a few days</b>
          <p>One result is a moment in time. A second one shows a direction.</p>
          <span className="go">Your check-ins <ArrowRight size={14} /></span>
        </Link>
        <Link to="/mood" className="card card-click feature-card">
          <span className="feature-icon"><CalendarClock size={19} /></span>
          <b>Look at your week</b>
          <p>Your moods, reflections and tiny wins in one gentle view.</p>
          <span className="go">My mood journey <ArrowRight size={14} /></span>
        </Link>
      </div>

      <div style={{ marginTop: '1.3rem' }}>
        <Note tone="grey" icon={ShieldAlert}>
          This score feeds Inner Circle's fuzzy support engine together with your stress, recent
          mood and how daily life is affected —{' '}
          <Link to="/how" style={{ fontWeight: 800 }}>see exactly how that turns into a suggestion →</Link>
        </Note>
      </div>
    </div>
  )
}
