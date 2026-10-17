import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, CalendarDays, HeartHandshake, UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { Badge, CRISIS_RESOURCES, EmptyState, Modal, Note, PageHeader, SectionTitle } from '../components/ui'
import { INSTITUTION } from '../lib/institution'
import { load, save, uid } from '../lib/storage'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const SLOTS = ['morning', 'afternoon', 'evening']

export default function Professional() {
  const { profile, openSafety, toast } = useApp()
  const t = useT()
  const [params] = useSearchParams()
  const [urgent] = useState(() => {
    const values = params.getAll('urgent')
    return values.length === 1 && values[0] === '1'
  })
  const openedRef = useRef(false)

  const [appts, setAppts] = useState(() => load('ic.appts', []))
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ role: '', name: '', day: 'monday', slot: 'morning', note: '', ack: false })

  useEffect(() => {
    if (!urgent || openedRef.current) return
    openedRef.current = true
    openSafety('manual')
  }, [urgent, openSafety])

  const openForm = (role) => {
    setForm({ role, name: profile?.name || '', day: 'monday', slot: 'morning', note: '', ack: false })
    setError('')
    setOpen(true)
  }

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (error) setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) return setError(t('professional.modal.errorName'))

    const next = [
      ...load('ic.appts', []),
      {
        id: uid(),
        role: form.role ? t(form.role) : '',
        name: form.name.trim(),
        day: t(`professional.days.${form.day}`),
        slot: t(`professional.slots.${form.slot}`),
        note: form.note.trim(),
        createdAt: new Date().toISOString(),
      },
    ]
    save('ic.appts', next)
    setAppts(next)
    setOpen(false)
    toast(t('professional.modal.toastRecorded'))
  }

  const cancel = (id) => {
    const next = load('ic.appts', []).filter((item) => item.id !== id)
    save('ic.appts', next)
    setAppts(next)
    toast(t('professional.appts.toastRemoved'))
  }

  return (
    <div className="page">
      <PageHeader
        kicker={t('professional.kicker')}
        title={t('professional.title')}
        sub={t('professional.sub', {
          department: INSTITUTION.departmentName,
          university: INSTITUTION.universityName,
        })}
      />

      {urgent && (
        <div style={{ marginBottom: '1rem' }}>
          <Note tone="rose" icon={AlertCircle}>
            {t('professional.urgentNoteBefore')} <b>{t('nav.helpNow')}</b> {t('professional.urgentNoteAfter')}
          </Note>
        </div>
      )}

      <section className="pro-hero">
        <div className="page-header-row">
          <div>
            <span className="kicker">{t('professional.hero.kicker')}</span>
            <h2 style={{ marginBottom: '0.1rem' }}>{INSTITUTION.departmentName}</h2>
            <p className="muted" style={{ margin: 0 }}>{INSTITUTION.universityName}</p>
            <p className="muted small" style={{ margin: 0 }}>
              {t('professional.hero.officeTimings', { timings: INSTITUTION.counsellingOffice.timings })}
            </p>
          </div>
          <Badge tone="demo">{t('professional.hero.badge')}</Badge>
        </div>
        <p className="lead" style={{ margin: '1rem 0 1.1rem', maxWidth: '56ch' }}>
          {t('professional.hero.lead')}
        </p>
        <button type="button" className="btn btn-primary" onClick={() => openSafety('manual')}>
          {t('nav.helpNow')}
        </button>
      </section>

      <SectionTitle
        title={t('professional.team.title')}
        sub={t('professional.team.sub')}
      />
      <div className="grid grid-3">
        {INSTITUTION.doctors.map((doc) => (
          <article className="card doc-card" key={doc.id}>
            <span className="doc-avatar" aria-hidden="true"><UserRound size={24} /></span>
            <h3 style={{ margin: 0 }}>{t('professional.team.cardTitle', { role: t(doc.roleKey) })}</h3>
            <p className="small muted" style={{ margin: 0 }}>
              {t('professional.team.nameLabel', { name: doc.displayName })}
            </p>
            <p className="small muted" style={{ margin: 0 }}>{doc.availability}</p>
            <p className="small muted" style={{ margin: 0 }}>
              {t('professional.team.contactLabel', { phone: doc.contact.phone, email: doc.contact.email })}
            </p>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              onClick={() => openForm(doc.roleKey)}
            >
              {t('professional.team.request')}
            </button>
          </article>
        ))}
      </div>
      <p className="verify-note" style={{ marginTop: '0.7rem' }}>
        {t('professional.team.verifyNote')}
      </p>

      <SectionTitle
        title={t('professional.appts.title')}
        sub={t('professional.appts.sub')}
      />
      <div className="card card-pad">
        {appts.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t('professional.appts.emptyTitle')}>
            {t('professional.appts.emptyBody')}
          </EmptyState>
        ) : (
          appts.map((item) => (
            <div className="list-row" key={item.id}>
              <div className="list-copy">
                <b>{item.day} · {item.slot}</b>
                <p>
                  {item.name}
                  {item.role ? ` · ${item.role}` : ''}
                  {item.note ? ` — ${item.note}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => cancel(item.id)}
                aria-label={t('professional.appts.cancelAria', { day: item.day, slot: item.slot })}
              >
                {t('professional.appts.cancel')}
              </button>
            </div>
          ))
        )}
      </div>

      <SectionTitle title={t('professional.steps.title')} />
      <div className="flow-steps">
        <div className="flow-step">
          <span className="flow-step-num">1</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{t('professional.steps.oneTitle')}</b>
            <small>{t('professional.steps.oneBody')}</small>
          </div>
        </div>
        <div className="flow-step">
          <span className="flow-step-num">2</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{t('professional.steps.twoTitle')}</b>
            <small>{t('professional.steps.twoBody')}</small>
          </div>
        </div>
        <div className="flow-step">
          <span className="flow-step-num">3</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{t('professional.steps.threeTitle')}</b>
            <small>{t('professional.steps.threeBody')}</small>
          </div>
        </div>
      </div>

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

      {open && (
        <Modal
          kicker={t('professional.modal.kicker')}
          title={t('professional.modal.title')}
          onClose={() => setOpen(false)}
          footer={(
            <>
              <button type="submit" form="appt-form" className="btn btn-primary">{t('professional.modal.submit')}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            </>
          )}
        >
          <p className="small muted" style={{ marginTop: 0 }}>
            {t('professional.modal.intro', { role: form.role ? ` — ${t(form.role)}` : '' })}
          </p>

          <form id="appt-form" onSubmit={submit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <label className="field">
              <span>{t('professional.modal.fullName')}</span>
              <input type="text" value={form.name} onChange={set('name')} placeholder={t('professional.modal.namePlaceholder')} autoComplete="name" />
            </label>

            <div className="field-row">
              <label className="field">
                <span>{t('professional.modal.day')}</span>
                <select value={form.day} onChange={set('day')}>
                  {DAYS.map((day) => <option key={day} value={day}>{t(`professional.days.${day}`)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t('professional.modal.slot')}</span>
                <select value={form.slot} onChange={set('slot')}>
                  {SLOTS.map((slot) => <option key={slot} value={slot}>{t(`professional.slots.${slot}`)}</option>)}
                </select>
              </label>
            </div>

            <label className="field">
              <span>{t('professional.modal.note')} <em>{t('common.optional')}</em></span>
              <textarea value={form.note} onChange={set('note')} placeholder={t('professional.modal.notePlaceholder')} />
            </label>

            <div className="check-row">
              <input id="appt-ack" type="checkbox" checked={form.ack} onChange={set('ack')} />
              <label htmlFor="appt-ack">
                {t('professional.modal.ack')}
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
