import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, HeartHandshake, Stethoscope } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { CRISIS_RESOURCES, EmptyState, Note, PageHeader, SectionTitle } from '../components/ui'

export default function Professional() {
  const { openSafety } = useApp()
  const t = useT()
  const [params] = useSearchParams()
  const [urgent] = useState(() => {
    const values = params.getAll('urgent')
    return values.length === 1 && values[0] === '1'
  })
  const openedRef = useRef(false)

  useEffect(() => {
    if (!urgent || openedRef.current) return
    openedRef.current = true
    openSafety('manual')
  }, [urgent, openSafety])

  return (
    <div className="page">
      <PageHeader
        kicker={t('professional.kicker')}
        title={t('professional.title')}
        sub={t('professional.sub')}
      />

      {urgent && (
        <div style={{ marginBottom: '1rem' }}>
          <Note tone="rose" icon={AlertCircle}>
            {t('professional.urgentNoteBefore')} <b>{t('nav.helpNow')}</b> {t('professional.urgentNoteAfter')}
          </Note>
        </div>
      )}

      <section className="pro-hero">
        <EmptyState icon={Stethoscope} title={t('professional.pending.title')}>
          {t('professional.pending.body')}
        </EmptyState>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.4rem' }}>
          <button type="button" className="btn btn-primary" onClick={() => openSafety('manual')}>
            {t('nav.helpNow')}
          </button>
        </div>
      </section>

      <SectionTitle
        title={t('professional.crisis.title')}
        sub={t('professional.crisis.sub')}
      />
      <div className="crisis-options">
        {CRISIS_RESOURCES.map((item) => (
          <a key={item.number} href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}>
            <span className="crisis-icon" aria-hidden="true"><HeartHandshake size={16} /></span>
            <span className="crisis-copy">
              <b>{t(`common.safety.resources.${item.key}.label`)}</b>
              <small>{item.number} · {t(`common.safety.resources.${item.key}.detail`)}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="verify-note">
        {t('professional.crisis.verifyNote')}
      </p>
      <div style={{ marginTop: '0.9rem' }}>
        <Note tone="grey">
          {t('professional.crisis.note')}
        </Note>
      </div>
    </div>
  )
}
