import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, CalendarDays, HeartHandshake, UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, CRISIS_RESOURCES, EmptyState, Modal, Note, PageHeader, SectionTitle } from '../components/ui'
import { load, save, uid } from '../lib/storage'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOTS = ['Morning', 'Afternoon', 'Evening']

const DOCTORS = [
  { id: 'consultant', role: 'Consultant Psychiatrist' },
  { id: 'counselling', role: 'Counselling Psychologist' },
  { id: 'clinical', role: 'Clinical Psychologist' },
]

export default function Professional() {
  const { profile, openSafety, toast } = useApp()
  const [params] = useSearchParams()
  const [urgent] = useState(() => {
    const values = params.getAll('urgent')
    return values.length === 1 && values[0] === '1'
  })
  const openedRef = useRef(false)

  const [appts, setAppts] = useState(() => load('ic.appts', []))
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ role: '', name: '', day: 'Monday', slot: 'Morning', note: '', ack: false })

  useEffect(() => {
    if (!urgent || openedRef.current) return
    openedRef.current = true
    openSafety('manual')
  }, [urgent, openSafety])

  const openForm = (role) => {
    setForm({ role, name: profile?.name || '', day: 'Monday', slot: 'Morning', note: '', ack: false })
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
    if (!form.name.trim()) return setError('Please enter your full name so the department knows who to contact.')

    const next = [
      ...load('ic.appts', []),
      {
        id: uid(),
        role: form.role,
        name: form.name.trim(),
        day: form.day,
        slot: form.slot,
        note: form.note.trim(),
        createdAt: new Date().toISOString(),
      },
    ]
    save('ic.appts', next)
    setAppts(next)
    setOpen(false)
    toast('Appointment request recorded (demo).')
  }

  const cancel = (id) => {
    const next = load('ic.appts', []).filter((item) => item.id !== id)
    save('ic.appts', next)
    setAppts(next)
    toast('Request removed.')
  }

  return (
    <div className="page">
      <PageHeader
        kicker="PROFESSIONAL SUPPORT"
        title="Contact a Professional"
        sub="Reach the Department of Psychiatry at Dayananda Sagar University, and find urgent support whenever you need it."
      />

      {urgent && (
        <div style={{ marginBottom: '1rem' }}>
          <Note tone="rose" icon={AlertCircle}>
            You asked for urgent support, so those options are shown above. If you closed the panel,
            use <b>I need help now</b> below whenever you want them again.
          </Note>
        </div>
      )}

      <section className="pro-hero">
        <div className="page-header-row">
          <div>
            <span className="kicker">THE TEAM BEHIND INNER CIRCLE</span>
            <h2 style={{ marginBottom: '0.1rem' }}>Department of Psychiatry</h2>
            <p className="muted" style={{ margin: 0 }}>Dayananda Sagar University</p>
          </div>
          <Badge tone="demo">Demo — placeholder details</Badge>
        </div>
        <p className="lead" style={{ margin: '1rem 0 1.1rem', maxWidth: '56ch' }}>
          A qualified professional can tell you what your screening results actually mean — Inner Circle never can.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => openSafety('manual')}>
          I need help now
        </button>
      </section>

      <SectionTitle
        title="Who you could speak with"
        sub="Three placeholder profiles shared with Inner Circle by the department."
      />
      <div className="grid grid-3">
        {DOCTORS.map((doc) => (
          <article className="card doc-card" key={doc.id}>
            <span className="doc-avatar" aria-hidden="true"><UserRound size={24} /></span>
            <h3 style={{ margin: 0 }}>{doc.role} · placeholder profile</h3>
            <p className="small muted" style={{ margin: 0 }}>
              Timings to be confirmed by the department
            </p>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              onClick={() => openForm(doc.role)}
            >
              Request an appointment
            </button>
          </article>
        ))}
      </div>
      <p className="verify-note" style={{ marginTop: '0.7rem' }}>
        Placeholder profiles — real names, timings and official contact details will be added by the
        university before launch.
      </p>

      <SectionTitle
        title="Your appointment requests"
        sub="Saved only in this browser — nothing is sent to the department in this prototype."
      />
      <div className="card card-pad">
        {appts.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No requests yet">
            Pick a profile above and ask for a slot. Your requests will appear here so you can
            review or cancel them.
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
                aria-label={`Cancel request for ${item.day}, ${item.slot}`}
              >
                Cancel
              </button>
            </div>
          ))
        )}
      </div>

      <SectionTitle title="What happens next" />
      <div className="flow-steps">
        <div className="flow-step">
          <span className="flow-step-num">1</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>Your request is recorded here</b>
            <small>Demo only — it is saved on this device and never sent to the department.</small>
          </div>
        </div>
        <div className="flow-step">
          <span className="flow-step-num">2</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>The department would confirm a slot directly with you</b>
            <small>In the live version, someone from the department gets in touch with a time that suits you.</small>
          </div>
        </div>
        <div className="flow-step">
          <span className="flow-step-num">3</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>What you share in a session stays private</b>
            <small>Inner Circle only stores what you choose to save on this device.</small>
          </div>
        </div>
      </div>

      <SectionTitle
        title="If you may be in immediate danger now"
        sub="Reach a real person straight away — you never have to wait for the app."
      />
      <div className="crisis-options">
        {CRISIS_RESOURCES.map((item) => (
          <a key={item.number} href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}>
            <span className="crisis-icon" aria-hidden="true"><HeartHandshake size={16} /></span>
            <span className="crisis-copy">
              <b>{item.label}</b>
              <small>{item.number} · {item.detail}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="verify-note">
        Helpline numbers can change — verify every number before you rely on it, and check the
        department's official contact details once the university confirms them.
      </p>
      <div style={{ marginTop: '0.9rem' }}>
        <Note tone="grey">
          Inner Circle is not monitored 24/7 and is not an emergency service. If you may be in
          immediate danger, contact emergency services or someone you trust right now.
        </Note>
      </div>

      {open && (
        <Modal
          kicker="APPOINTMENT REQUEST"
          title="Request an appointment"
          onClose={() => setOpen(false)}
          footer={(
            <>
              <button type="submit" form="appt-form" className="btn btn-primary">Record my request</button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </>
          )}
        >
          <p className="small muted" style={{ marginTop: 0 }}>
            A demo request kept on this device only{form.role ? ` — ${form.role}` : ''}. The department
            is not contacted automatically.
          </p>

          <form id="appt-form" onSubmit={submit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <label className="field">
              <span>Full name</span>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Your full name" autoComplete="name" />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Preferred day</span>
                <select value={form.day} onChange={set('day')}>
                  {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Preferred time slot</span>
                <select value={form.slot} onChange={set('slot')}>
                  {SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Anything you would like to add <em>optional</em></span>
              <textarea value={form.note} onChange={set('note')} placeholder="A short note for the department" />
            </label>

            <div className="check-row">
              <input id="appt-ack" type="checkbox" checked={form.ack} onChange={set('ack')} />
              <label htmlFor="appt-ack">
                I understand this is a prototype request, stored only on this device
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
