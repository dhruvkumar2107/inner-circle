import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CalendarPlus, Clock, MapPin, RefreshCw, Stethoscope, Video, XCircle } from 'lucide-react'
import { api, formatDate } from '../lib/api'
import { EmptyState, ErrorBanner, Modal, SectionHeader, Skeleton } from '../components/common'

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [booking, setBooking] = useState(null)
  const [rescheduling, setRescheduling] = useState(null)

  const load = useCallback(async () => {
    const [mine, pros] = await Promise.all([api('/appointments'), api('/professionals')])
    setAppointments(mine.appointments)
    setProfessionals(pros.professionals)
  }, [])

  useEffect(() => {
    setLoading(true)
    load().catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [load])

  const cancel = async appointment => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await api(`/appointments/${appointment.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) })
      setAppointments(list => list.map(item => item.id === appointment.id ? { ...item, status: 'cancelled' } : item))
      setNotice('Your appointment was cancelled.')
    } catch (err) { setNotice(err.message) }
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter(item => item.status !== 'cancelled' && item.date >= today)
  const past = appointments.filter(item => item.status === 'cancelled' || item.date < today)

  const onBooked = appointment => {
    setAppointments(list => [...list, appointment])
    setBooking(null)
    setNotice('Appointment confirmed. We\'ll remind you before it starts.')
  }

  const onRescheduled = updated => {
    setAppointments(list => list.map(item => item.id === updated.id ? updated : item))
    setRescheduling(null)
    setNotice('Appointment rescheduled.')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">SUPPORT SESSIONS</span>
          <h1>Talk to someone real</h1>
          <p>Book a counsellor, psychologist or peer volunteer — online or in person, at a time that suits you.</p>
        </div>
      </div>

      {notice && <div className="toast-inline" onClick={() => setNotice('')}>{notice}</div>}
      <ErrorBanner message={error} onRetry={load} />

      <section className="panel">
        <SectionHeader kicker="YOUR BOOKINGS" title="Upcoming sessions" tight />
        {loading ? <Skeleton rows={2} /> : upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming sessions">When you're ready, choose a guide below — there's no pressure.</EmptyState>
        ) : (
          <ul className="appointment-list">
            {upcoming.map(item => (
              <li key={item.id} className={`appointment ${item.priority === 'emergency' ? 'appointment-emergency' : ''}`}>
                <div className="appointment-when">
                  <b>{formatDate(item.date)}</b>
                  <small><Clock size={13} /> {item.time} · {item.durationMin} min</small>
                </div>
                <div className="appointment-who">
                  <b>{item.professionalName}</b>
                  <small>{item.type} · {item.mode === 'Online' ? <><Video size={12} /> Online</> : <><MapPin size={12} /> Office</>}</small>
                  {item.notes && <small className="appointment-note">“{item.notes}”</small>}
                </div>
                <div className="appointment-actions">
                  {item.priority === 'emergency' && <span className="pill pill-high">Priority</span>}
                  <button className="btn btn-ghost btn-sm" onClick={() => setRescheduling(item)}><RefreshCw size={14} /> Reschedule</button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => cancel(item)}><XCircle size={14} /> Cancel</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <SectionHeader kicker="THE CIRCLE" title="Guides & counsellors" tight />
        {loading ? <div className="resource-grid">{[0, 1, 2].map(index => <div className="pro-card" key={index}><Skeleton rows={3} /></div>)}</div> : (
          <div className="pro-grid">
            {professionals.map(profile => (
              <article className="pro-card" key={profile.id}>
                <span className="pro-avatar"><Stethoscope size={18} /></span>
                <h3>{profile.name}</h3>
                <span className="pro-title">{profile.title}</span>
                <div className="pro-tags">
                  {profile.specialization.slice(0, 4).map(tag => <span className="pill pill-soft" key={tag}>{tag}</span>)}
                </div>
                <ul className="pro-meta">
                  <li><b>Languages</b> {profile.languages.join(', ')}</li>
                  <li><b>Modes</b> {profile.modes.join(' · ')}</li>
                  <li><b>Times</b> {profile.availability.slice(0, 3).join(', ')}{profile.availability.length > 3 ? '…' : ''}</li>
                </ul>
                <button className="btn btn-primary full" onClick={() => setBooking(profile)}><CalendarPlus size={16} /> Book a session</button>
              </article>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="panel">
          <SectionHeader kicker="HISTORY" title="Past & cancelled" tight />
          <ul className="appointment-list muted-list">
            {past.map(item => (
              <li key={item.id} className="appointment">
                <div className="appointment-when"><b>{formatDate(item.date)}</b><small>{item.time}</small></div>
                <div className="appointment-who"><b>{item.professionalName}</b><small>{item.type}</small></div>
                <span className={`pill pill-${item.status === 'cancelled' ? 'muted' : 'low'}`}>{item.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {booking && <BookDialog professional={booking} onClose={() => setBooking(null)} onBooked={onBooked} />}
      {rescheduling && <RescheduleDialog appointment={rescheduling} onClose={() => setRescheduling(null)} onSaved={onRescheduled} />}
    </div>
  )
}

function BookDialog({ professional, onClose, onBooked }) {
  const [slots, setSlots] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [form, setForm] = useState({ type: 'Individual', mode: 'Online', notes: '', priority: 'normal' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/professionals/${professional.id}/slots`)
      .then(data => { setSlots(data.slots); setDate(data.slots[0]?.date || ''); setTime(data.slots[0]?.times?.[0] || '') })
      .catch(err => setError(err.message))
  }, [professional.id])

  const times = slots.find(slot => slot.date === date)?.times || []

  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api('/appointments', {
        method: 'POST',
        body: JSON.stringify({ professionalId: professional.id, date, time, ...form, notes: form.notes || undefined }),
      })
      onBooked(data.appointment)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal kicker="BOOK A SESSION" title={professional.name} onClose={onClose} wide
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy || !date || !time}>{busy ? 'Booking…' : 'Confirm booking'}</button>
      </>}>
      <form className="book-form" onSubmit={submit}>
        <ErrorBanner message={error} />
        <span className="pro-subtitle">{professional.title}</span>
        <div className="field">
          <span>Choose a day</span>
          <div className="slot-days">
            {slots.map(slot => (
              <button type="button" key={slot.date} className={`slot-day ${slot.date === date ? 'slot-day-on' : ''}`} onClick={() => { setDate(slot.date); setTime(slot.times[0] || '') }}>
                {new Date(slot.date).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Choose a time</span>
          <div className="slot-times">
            {times.map(value => (
              <button type="button" key={value} className={`slot-time ${value === time ? 'slot-time-on' : ''}`} onClick={() => setTime(value)}>{value}</button>
            ))}
          </div>
        </div>
        <div className="field-row">
          <label className="field"><span>Session type</span>
            <select value={form.type} onChange={event => setForm(value => ({ ...value, type: event.target.value }))}>
              <option>Individual</option><option>Follow-up</option><option>Peer support</option><option>Emergency-priority</option>
            </select>
          </label>
          <label className="field"><span>Mode</span>
            <select value={form.mode} onChange={event => setForm(value => ({ ...value, mode: event.target.value }))}>
              <option>Online</option><option>In-person</option>
            </select>
          </label>
        </div>
        <label className="field"><span>Anything you'd like them to know? <em>(optional)</em></span>
          <textarea rows={3} maxLength={500} value={form.notes} onChange={event => setForm(value => ({ ...value, notes: event.target.value }))} placeholder="You can keep this brief." />
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={form.priority === 'emergency'} onChange={event => setForm(value => ({ ...value, priority: event.target.checked ? 'emergency' : 'normal' }))} />
          <span>Mark as urgent — I'd like priority review</span>
        </label>
      </form>
    </Modal>
  )
}

function RescheduleDialog({ appointment, onClose, onSaved }) {
  const [date, setDate] = useState(appointment.date)
  const [time, setTime] = useState(appointment.time)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      const data = await api(`/appointments/${appointment.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reschedule', date, time }) })
      onSaved(data.appointment)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal kicker="RESCHEDULE" title={appointment.professionalName} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={busy}>Save new time</button></>}>
      <ErrorBanner message={error} />
      <label className="field"><span>New date</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)} /></label>
      <label className="field"><span>New time</span><input value={time} onChange={event => setTime(event.target.value)} placeholder="e.g. 11:30 AM" /></label>
    </Modal>
  )
}
