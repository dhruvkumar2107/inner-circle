import { useEffect, useState } from 'react'
import { Activity, HeartPulse, NotebookPen, Sparkles, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { api, formatRelative } from '../lib/api'
import { ErrorBanner, SectionHeader, Skeleton } from '../components/common'

const MOODS = [
  { value: 'Good', emoji: '🌿', label: 'Good' },
  { value: 'Okay', emoji: '🙂', label: 'Okay' },
  { value: 'Stressed', emoji: '😮‍💨', label: 'Stressed' },
  { value: 'Low', emoji: '🌧️', label: 'Low' },
  { value: 'Overwhelmed', emoji: '🌊', label: 'Overwhelmed' },
]

const tierLabel = { 1: 'Steady', 2: 'Time for extra care', 3: 'Let’s get you support' }

export default function CheckIn() {
  const [mood, setMood] = useState('Okay')
  const [stress, setStress] = useState(5)
  const [functional, setFunctional] = useState(4)
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadHistory = () => api('/checkins').then(data => setHistory(data.checkins)).catch(() => {})

  useEffect(() => { loadHistory().finally(() => setLoadingHistory(false)) }, [])

  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api('/checkins', { method: 'POST', body: JSON.stringify({ mood, stress, functionalImpact: functional, ...(note.trim() ? { note: note.trim() } : {}) }) })
      setResult(data)
      setNote('')
      loadHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const trendIcon = result?.trend === 'Improving' ? TrendingDown : result?.trend === 'Worsening' ? TrendingUp : Minus

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">GENTLE CHECK-IN</span>
          <h1>How are you, really?</h1>
          <p>Thirty seconds, no scores to pass. This just helps you (and your circle) notice patterns early.</p>
        </div>
      </div>

      <div className="checkin-layout">
        <form className="panel checkin-form" onSubmit={submit}>
          <ErrorBanner message={error} />
          <div className="field">
            <span>Today I feel…</span>
            <div className="mood-grid">
              {MOODS.map(item => (
                <button type="button" key={item.value} className={`mood-option ${mood === item.value ? 'mood-on' : ''}`} onClick={() => setMood(item.value)}>
                  <span aria-hidden="true">{item.emoji}</span>{item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field range-field">
            <span>Stress level <b>{stress}/10</b></span>
            <input type="range" min={1} max={10} value={stress} onChange={event => setStress(Number(event.target.value))} />
            <em className="range-hint">1 = calm · 10 = completely overwhelmed</em>
          </label>

          <label className="field range-field">
            <span>How much is this affecting daily life? <b>{functional}/10</b></span>
            <input type="range" min={0} max={10} value={functional} onChange={event => setFunctional(Number(event.target.value))} />
            <em className="range-hint">0 = not at all · 10 = a great deal</em>
          </label>

          <label className="field"><span>Anything you want to note? <em>(optional, private)</em></span>
            <textarea rows={3} maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="A word, a worry, a small win — anything counts." />
          </label>

          <button className="btn btn-primary btn-lg full" disabled={busy}><NotebookPen size={18} /> {busy ? 'Saving…' : 'Save my check-in'}</button>
        </form>

        <div className="checkin-result">
          {result ? (
            <div className={`result-card tier-${result.risk.level === 'High' ? 'high' : result.risk.level === 'Moderate' ? 'moderate' : 'low'}`}>
              <span className="result-icon"><HeartPulse size={22} /></span>
              <span className="kicker">YOUR CHECK-IN LANDED</span>
              <h2>{tierLabel[result.risk.tier] || 'Noted'}</h2>
              <p>{result.risk.narrative?.[0] || 'Thank you for checking in with yourself.'}</p>
              <div className="result-meta">
                <span><Activity size={14} /> Risk {Math.round(result.risk.riskScore)}/100</span>
                <span className={`trend trend-${result.trend.toLowerCase()}`}>{(() => { const Icon = trendIcon; return <Icon size={14} /> })()} {result.trend}</span>
              </div>
              {result.worsening && <p className="result-alert">We've noticed a rise across recent check-ins. Reaching out to someone could help — you deserve support.</p>}
              <ul className="result-rules">
                {result.risk.firedRules?.slice(0, 3).map(rule => <li key={rule.id}>{rule.text}</li>)}
              </ul>
            </div>
          ) : (
            <div className="result-card result-card-empty">
              <Sparkles size={22} />
              <h2>Your check-in is private</h2>
              <p>Only you see your notes. Trained staff can see anonymized risk signals when safety review is needed — never your real identity.</p>
            </div>
          )}

          <section className="panel">
            <SectionHeader kicker="RECENT" title="Your check-in history" tight />
            {loadingHistory ? <Skeleton rows={3} /> : history.length === 0 ? (
              <p className="muted">Your past check-ins will gather here to show gentle patterns over time.</p>
            ) : (
              <ul className="history-list">
                {history.slice(0, 6).map(item => (
                  <li key={item.id}>
                    <span className="history-emoji">{MOODS.find(m => m.value === item.mood)?.emoji || '🙂'}</span>
                    <span className="history-copy"><b>{item.mood}</b><small>Stress {item.stress}/10 · {formatRelative(item.takenAt)}</small></span>
                    {item.note && <span className="history-note">“{item.note}”</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
