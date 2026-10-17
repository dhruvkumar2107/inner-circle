import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Eye, ShieldCheck, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, EmptyState, Note, PageHeader, SectionTitle } from '../components/ui'
import { DISCLAIMER_KEY } from '../lib/screening'
import { longDate } from '../lib/storage'
import { useT } from '../i18n'

const BAND_TABLES = {
  phq9: [
    ['0–4', '0–4'], ['5–9', '5–9'], ['10–14', '10–14'],
    ['15–19', '15–19'], ['20–27', '20–27'],
  ],
  gad7: [
    ['0–4', '0–4'], ['5–9', '5–9'], ['10–14', '10–14'], ['15–21', '15–21'],
  ],
}

const toneBadge = (tone) => (tone === 'high' ? 'rose' : tone === 'mid' ? 'demo' : 'mint')

export default function Assessments() {
  const navigate = useNavigate()
  const { assessments, removeAssessment } = useApp()
  const t = useT()

  const INSTRUMENTS = [
    {
      type: 'phq9',
      title: 'PHQ-9',
      focus: t('assessments.phq9Focus'),
      body: t('assessments.phq9Body'),
      meta: t('assessments.phq9Meta'),
    },
    {
      type: 'gad7',
      title: 'GAD-7',
      focus: t('assessments.gad7Focus'),
      body: t('assessments.gad7Body'),
      meta: t('assessments.gad7Meta'),
    },
  ]

  const past = [...assessments].reverse()

  return (
    <div className="page">
      <PageHeader
        kicker={t('assessments.kicker')}
        title={t('assessments.title')}
        sub={t('assessments.sub')}
        action={<Link className="btn btn-outline" to="/how">{t('assessments.howLink')} <ArrowRight size={15} /></Link>}
      />

      <Note tone="mint" icon={ShieldCheck}>
        <b>{t('assessments.screeningNoteTitle')}</b> {t('assessments.screeningNoteBody')}
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
              {t('assessments.start', { title: item.title })} <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </div>

      <SectionTitle
        title={t('assessments.pastTitle')}
        sub={t('assessments.pastSub')}
        action={past.length > 0 ? <Badge tone="grey">{t('assessments.pastCount', { count: past.length })}</Badge> : null}
      />

      {past.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={t('assessments.emptyTitle')}>
          {t('assessments.emptyBody')}
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
                    {meta?.title || record.type} · {t('common.score')} {record.score}/{max}{' '}
                    <span className={`badge badge-${toneBadge(record.severity?.tone)}`} style={{ marginLeft: '0.35rem' }}>
                      {t(record.severity?.shortKey || `screening.severity.minimal.short`)}
                    </span>
                    {record.safety && <span className="badge badge-rose" style={{ marginLeft: '0.35rem' }}>{t('assessments.supportNote')}</span>}
                  </b>
                  <p>{t(record.severity?.labelKey || `screening.severity.minimal.label`)} · {longDate(record.takenAt)} {record.safety ? t('assessments.urgentSuffix') : ''}</p>
                </span>
                <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/assessments/${record.type}/result`, { state: { id: record.id } })}
                  >
                    <Eye size={14} /> {t('assessments.view')}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => removeAssessment(record.id)}
                    aria-label={t('assessments.deleteAria', { title: meta?.title || record.type, date: longDate(record.takenAt) })}
                    title={t('assessments.deleteTitle')}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}

      <SectionTitle title={t('assessments.bandsTitle')} sub={t('assessments.bandsSub')} />
      <div className="grid grid-2">
        {Object.entries(BAND_TABLES).map(([type, rows]) => (
          <div className="card card-pad" key={type}>
            <b style={{ display: 'block', marginBottom: '0.5rem' }}>{type === 'phq9' ? t('assessments.phq9BandTitle') : t('assessments.gad7BandTitle')}</b>
            <div className="chip-row">
              {rows.map(([range, labelKey]) => (
                <span className="chip" key={range} style={{ cursor: 'default' }}>{range} · {t(`assessments.bandTable.${labelKey}`)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey">{t(DISCLAIMER_KEY)} {t('assessments.disclaimerSuffix')}</Note>
      </div>
    </div>
  )
}
