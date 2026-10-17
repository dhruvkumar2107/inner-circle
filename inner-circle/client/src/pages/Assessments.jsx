import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Eye, ShieldCheck, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, EmptyState, Note, PageHeader, SectionTitle } from '../components/ui'
import { DISCLAIMER } from '../lib/screening'
import { longDate } from '../lib/storage'

const BAND_TABLES = {
  phq9: [
    ['0–4', 'Minimal'], ['5–9', 'Mild'], ['10–14', 'Moderate'],
    ['15–19', 'Moderately severe'], ['20–27', 'Severe'],
  ],
  gad7: [
    ['0–4', 'Minimal'], ['5–9', 'Mild'], ['10–14', 'Moderate'], ['15–21', 'Severe'],
  ],
}

const INSTRUMENTS = [
  {
    type: 'phq9',
    title: 'PHQ-9',
    focus: 'Depression screening',
    body: 'Nine standard questions about the last two weeks, plus one question about how much it has affected daily life.',
    meta: '9 questions · about 3 minutes',
  },
  {
    type: 'gad7',
    title: 'GAD-7',
    focus: 'Anxiety screening',
    body: 'Seven standard questions about nervousness, worry and restlessness over the last two weeks, plus the daily-life question.',
    meta: '7 questions · about 2 minutes',
  },
]

const toneBadge = (tone) => (tone === 'high' ? 'rose' : tone === 'mid' ? 'demo' : 'mint')

export default function Assessments() {
  const navigate = useNavigate()
  const { assessments, removeAssessment } = useApp()

  const past = [...assessments].reverse()

  return (
    <div className="page">
      <PageHeader
        kicker="MENTAL HEALTH CHECK-IN"
        title="Mental Health Check-in"
        sub="Two short, standard screening questionnaires. Take one whenever you choose — never on a schedule, never forced."
        action={<Link className="btn btn-outline" to="/how">How Inner Circle uses these <ArrowRight size={15} /></Link>}
      />

      <Note tone="mint" icon={ShieldCheck}>
        <b>Screening, not diagnosis.</b> These tools describe what you report today in standard,
        recognised bands. They never name a condition, never prescribe, and only you can see the
        results — they stay in this browser.
      </Note>

      <div className="grid grid-2" style={{ marginTop: '1.2rem' }}>
        {INSTRUMENTS.map((item) => (
          <article key={item.type} className="card card-pad feature-card">
            <span className="feature-icon"><ClipboardCheck size={19} /></span>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <b style={{ fontSize: '1.05rem' }}>{item.title}</b>
              <Badge tone="mint">{item.focus}</Badge>
            </span>
            <p>{item.body}</p>
            <span className="tiny muted">{item.meta}</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/assessments/${item.type}`)}>
              Start {item.title} <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </div>

      <SectionTitle
        title="Your past check-ins"
        sub="Stored on this device only. Delete any of them whenever you like."
        action={past.length > 0 ? <Badge tone="grey">{past.length} saved</Badge> : null}
      />

      {past.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No check-ins yet">
          When you finish one, the result and its date will appear here so you can look back or delete it.
        </EmptyState>
      ) : (
        <div className="card card-pad">
          {past.map((record) => {
            const meta = INSTRUMENTS.find((i) => i.type === record.type)
            const max = record.type === 'phq9' ? 27 : 21
            return (
              <div className="list-row" key={record.id}>
                <span className="feature-icon" style={{ width: 36, height: 36 }} aria-hidden="true"><ClipboardCheck size={16} /></span>
                <span className="list-copy">
                  <b>
                    {meta?.title || record.type} · score {record.score}/{max}{' '}
                    <span className={`badge badge-${toneBadge(record.severity?.tone)}`} style={{ marginLeft: '0.35rem' }}>
                      {record.severity?.short}
                    </span>
                    {record.safety && <span className="badge badge-rose" style={{ marginLeft: '0.35rem' }}>Support note</span>}
                  </b>
                  <p>{record.severity?.label} · {longDate(record.takenAt)} {record.safety ? '· urgent support was opened for this one' : ''}</p>
                </span>
                <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/assessments/${record.type}/result`, { state: { id: record.id } })}
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => removeAssessment(record.id)}
                    aria-label={`Delete ${meta?.title || record.type} result from ${longDate(record.takenAt)}`}
                    title="Delete this result"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}

      <SectionTitle title="What the bands mean" sub="Standard severity bands for the two instruments — the same wording everywhere in Inner Circle." />
      <div className="grid grid-2">
        {Object.entries(BAND_TABLES).map(([type, rows]) => (
          <div className="card card-pad" key={type}>
            <b style={{ display: 'block', marginBottom: '0.5rem' }}>{type === 'phq9' ? 'PHQ-9 (0–27)' : 'GAD-7 (0–21)'}</b>
            <div className="chip-row">
              {rows.map(([range, label]) => (
                <span className="chip" key={range} style={{ cursor: 'default' }}>{range} · {label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey">{DISCLAIMER} It is not a substitute for a professional assessment.</Note>
      </div>
    </div>
  )
}
