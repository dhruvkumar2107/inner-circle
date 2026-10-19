import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Calendar, Clock, HeartHandshake, Mail, MapPin, Phone, ShieldCheck, Stethoscope, UserCheck, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { CRISIS_RESOURCES, EmptyState, Modal, Note, PageHeader, SectionTitle } from '../components/ui'
import { DEPARTMENT, NEARBY_CARE, EMERGENCY_NUMBER, DEMO_CLINICIANS } from '../lib/careContacts'

export default function Professional() {
  const { openSafety, appts, addAppointment, cancelAppointment, rescheduleAppointment, toast } = useApp()
  const t = useT()
  const [params] = useSearchParams()
  const [urgent] = useState(() => {
    const values = params.getAll('urgent')
    return values.length === 1 && values[0] === '1'
  })
  const openedRef = useRef(false)

  const [scheduling, setScheduling] = useState(null) // { clinicianId } or null
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deptError, setDeptError] = useState(false)

  useEffect(() => {
    if (!urgent || openedRef.current) return
    openedRef.current = true
    openSafety('manual')
  }, [urgent, openSafety])

  const startScheduling = (clinicianId) => {
    setScheduling({ clinicianId })
    setSelectedSlot('')
    setReason('')
  }

  const handleSubmitAppointment = async (e) => {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)
    try {
      addAppointment({
        clinicianId: scheduling.clinicianId,
        at: selectedSlot,
        reason: reason.trim() || undefined,
      })
      toast(t('professional.schedule.success'))
      setScheduling(null)
    } catch {
      toast(t('professional.schedule.error'), 'warn')
    } finally {
      setSubmitting(false)
    }
  }

  const formatSlot = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const clinician = DEMO_CLINICIANS.find((c) => c.id === scheduling?.clinicianId)
  const availableSlots = clinician?.slots || []

  const userAppts = [...appts].reverse()

  useEffect(() => {
    // Simulate potential department data load failure (never happens with static data,
    // but kept for demonstration of error state)
    setDeptError(false)
  }, [])

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

      {deptError && (
        <Note tone="rose" icon={AlertCircle} style={{ marginBottom: '1rem' }}>
          {t('common.safety.deptUnavailable')}
        </Note>
      )}

      <section className="card card-pad" style={{ marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <b style={{ fontSize: '1.1rem' }}>{t('professional.dept.title')}</b>
            <Badge tone="demo" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>{t('professional.dept.demoLabel')}</Badge>
            <div style={{ marginTop: '0.4rem', color: 'var(--ink-2)' }}>
              <div><Phone size={14} /> {t('professional.dept.phone')}: <a href={`tel:${DEPARTMENT.phone}`}>{DEPARTMENT.phone}</a></div>
              <div><Mail size={14} /> {t('professional.dept.email')}: <a href={`mailto:${DEPARTMENT.email}`}>{DEPARTMENT.email}</a></div>
              <div><MapPin size={14} /> {t('professional.dept.address')}: {DEPARTMENT.address}</div>
              <div><Clock size={14} /> {t('professional.dept.hours')}: {DEPARTMENT.hours}</div>
            </div>
            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a className="btn btn-primary btn-sm" href={`tel:${DEPARTMENT.phone}`}><Phone size={14} /> {t('professional.dept.call')}</a>
              <a className="btn btn-outline btn-sm" href={`https://maps.google.com/?q=${encodeURIComponent(DEPARTMENT.address)}`} target="_blank" rel="noopener"><MapPin size={14} /> {t('professional.dept.directions')}</a>
            </div>
          </div>
        </div>
      </section>

      <SectionTitle title={t('professional.nearby.title')} />

      <div className="crisis-options" style={{ marginBottom: '1.2rem' }}>
        <a href={`tel:${EMERGENCY_NUMBER.replace(/[^0-9+]/g, '')}`}>
          <span className="crisis-icon" aria-hidden="true"><HeartHandshake size={16} /></span>
          <span className="crisis-copy">
            <b>{t('professional.crisis.resources.emergency.label')}</b>
            <small>{EMERGENCY_NUMBER} · {t('professional.crisis.resources.emergency.detail')}</small>
          </span>
        </a>
        {NEARBY_CARE.map((item) => (
          <a key={item.key} href={item.number ? `tel:${item.number.replace(/[^0-9+]/g, '')}` : `tel:${item.phone.replace(/[^0-9+]/g, '')}`}>
            <span className="crisis-icon" aria-hidden="true"><HeartHandshake size={16} /></span>
            <span className="crisis-copy">
              <b>{t(item.labelKey)}</b>
              <small>{item.number || item.phone} · {t(item.detailKey)}</small>
            </span>
          </a>
        ))}
      </div>

      <SectionTitle title={t('professional.team.title')} />
      <p className="verify-note" style={{ marginBottom: '0.8rem' }}>{t('professional.team.demoNotice')}</p>

      <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
        {DEMO_CLINICIANS.map((c) => (
          <div key={c.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <b>{c.name}</b>
                <Badge tone="demo" style={{ fontSize: '0.7rem' }}>{c.title}</Badge>
              </div>
              <p className="small muted" style={{ margin: '0.2rem 0 0.6rem' }}>{c.qualification} · {c.experienceYears} {t('professional.team.experience')}</p>
              <div className="chip-row" style={{ gap: '0.3rem', flexWrap: 'wrap' }}>
                {c.supportAreas.map((area) => (
                  <span key={area} className="chip" style={{ cursor: 'default' }}>{t(`common.topics.${area}`)}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '0.8rem', borderTop: '1px solid var(--border)' }}>
              <b className="small">{t('professional.team.availability')}</b>
              {availableSlots.length > 0 && scheduling?.clinicianId === c.id ? (
                <>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: '0.4rem', marginBottom: '0.4rem' }}
                    aria-label={t('professional.schedule.selectSlot')}
                  >
                    <option value="">{t('professional.schedule.selectSlot')}</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{formatSlot(slot)}</option>
                    ))}
                  </select>
                  <label className="field" style={{ marginBottom: '0.5rem' }}>
                    <span>{t('professional.schedule.reason')}</span>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t('professional.schedule.reasonHint')}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    onClick={handleSubmitAppointment}
                    disabled={!selectedSlot || submitting}
                  >
                    {submitting ? t('professional.schedule.submitting') : t('professional.schedule.submit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', marginTop: '0.4rem' }}
                    onClick={() => setScheduling(null)}
                  >
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <div style={{ marginTop: '0.4rem' }}>
                  {availableSlots.length === 0 ? (
                    <p className="small muted">{t('professional.team.noSlots')}</p>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => startScheduling(c.id)}
                    >
                      {t('professional.team.book')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle title={t('professional.appointments.title')} />
      <div className="card card-pad">
        {userAppts.length === 0 ? (
          <p className="small muted">{t('professional.appointments.noAppointments')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {userAppts.map((appt) => {
              const c = DEMO_CLINICIANS.find((clin) => clin.id === appt.clinicianId)
              return (
                <div key={appt.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <b>{c?.name || 'Clinician'}</b>
                    <div className="small muted" style={{ marginTop: '0.2rem' }}>
                      {new Date(appt.at).toLocaleString()} · {t(`professional.appointments.status.${appt.status}`)}
                      {appt.reason && <span> — {appt.reason}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {appt.status === 'requested' && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => startScheduling(appt.clinicianId)}
                      >
                        {t('professional.appointments.reschedule')}
                      </button>
                    )}
                    {appt.status !== 'cancelled' && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => cancelAppointment(appt.id)}
                      >
                        {t('professional.appointments.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
      <p className="verify-note">{t('professional.crisis.verifyNote')}</p>
      <div style={{ marginTop: '0.9rem' }}>
        <Note tone="grey">{t('professional.crisis.note')}</Note>
      </div>
    </div>
  )
}