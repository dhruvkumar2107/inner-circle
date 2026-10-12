import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, LogOut, Save, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { api, clearSession, getAlias } from '../lib/api'
import { ErrorBanner, LanguagePicker, SectionHeader } from '../components/common'

const concerns = [
  { id: 'anxiety', label: 'Exam & academic anxiety' },
  { id: 'stress', label: 'Stress & overwhelm' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'mood', label: 'Low mood' },
  { id: 'focus', label: 'Focus & motivation' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'self-esteem', label: 'Self-esteem' },
]

export default function Settings() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [me, setMe] = useState(null)
  const [picked, setPicked] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api('/auth/me').then(data => setMe(data.user)).catch(err => setError(err.message))
    try { setPicked(JSON.parse(localStorage.getItem('inner-circle-concerns') || '[]')) } catch { setPicked([]) }
  }, [])

  const toggle = id => setPicked(value => value.includes(id) ? value.filter(x => x !== id) : [...value, id])

  const save = () => {
    localStorage.setItem('inner-circle-concerns', JSON.stringify(picked))
    setNotice('Preferences saved.')
  }

  const signOut = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    clearSession()
    navigate('/')
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">SETTINGS</span>
          <h1>Your space, your rules</h1>
          <p>Adjust how Inner Circle supports you. None of these choices are permanent.</p>
        </div>
      </div>

      {notice && <div className="toast-inline" onClick={() => setNotice('')}>{notice}</div>}
      <ErrorBanner message={error} />

      <div className="settings-grid">
        <section className="panel">
          <SectionHeader kicker="YOUR PROFILE" title="How you appear" tight />
          <div className="profile-card">
            <span className="profile-avatar">{getAlias().slice(0, 1)}</span>
            <div>
              <b>{me?.alias || getAlias()}</b>
              <small>{t('sidebar.tagline')}</small>
            </div>
          </div>
          <ul className="profile-list">
            <li><span><UserRound size={15} /> Name</span><b>{me ? `${me.firstName}` : '—'}</b></li>
            <li><span><Sparkles size={15} /> Role</span><b>{me?.role || 'student'}</b></li>
            <li><span><ShieldCheck size={15} /> College</span><b>{me?.college || 'Not provided'}</b></li>
          </ul>
          <p className="verify-note">Your alias is how you appear in community rooms — your real name is never shown to other students.</p>
        </section>

        <section className="panel">
          <SectionHeader kicker="PREFERENCES" title="Language & focus areas" tight />
          <div className="settings-row">
            <span>App language</span>
            <LanguagePicker />
          </div>
          <p className="muted small">What would you like more support with?</p>
          <div className="chip-grid">
            {concerns.map(item => (
              <button type="button" key={item.id} className={`select-chip ${picked.includes(item.id) ? 'select-chip-on' : ''}`} onClick={() => toggle(item.id)}>
                {picked.includes(item.id) && <Check size={14} />}{item.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={save}><Save size={16} /> Save preferences</button>
        </section>

        <section className="panel">
          <SectionHeader kicker="PRIVACY & SAFETY" title="What stays private" tight />
          <ul className="privacy-points">
            <li>Chats, check-ins and notes are yours.</li>
            <li>Staff see anonymized risk signals only when a safety review is needed.</li>
            <li>You can use “I need help now” any time for real crisis contacts.</li>
          </ul>
          <Link className="btn btn-soft" to="/privacy"><ShieldCheck size={16} /> Read the full policy</Link>
        </section>

        <section className="panel panel-danger">
          <SectionHeader kicker="ACCOUNT" title="Sign out" tight />
          <p className="muted">Signing out clears this device. Your data stays safe on the server.</p>
          <button className="btn btn-outline" onClick={signOut}><LogOut size={16} /> Sign out</button>
        </section>
      </div>
    </div>
  )
}
