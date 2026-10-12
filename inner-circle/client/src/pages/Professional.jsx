import { useCallback, useEffect, useState } from 'react'
import { Activity, ClipboardCheck, Flag, ShieldCheck, UserRound } from 'lucide-react'
import { api, formatRelative } from '../lib/api'
import { EmptyState, ErrorBanner, SectionHeader, Skeleton } from '../components/common'

const tierTone = tier => tier === 3 ? 'high' : tier === 2 ? 'moderate' : 'low'

export default function Professional() {
  const [tab, setTab] = useState('queue')
  const [queue, setQueue] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [trend, setTrend] = useState(null)

  const load = useCallback(async () => {
    const [q, s] = await Promise.all([api('/pro/review-queue'), api('/pro/students')])
    setQueue(q.queue)
    setStudents(s.students)
  }, [])

  useEffect(() => { setLoading(true); load().catch(err => setError(err.message)).finally(() => setLoading(false)) }, [load])

  const review = async (item, decision) => {
    try {
      await api(`/pro/review/${item.id}`, { method: 'POST', body: JSON.stringify({ decision }) })
      setQueue(list => list.filter(entry => entry.id !== item.id))
      setNotice(`Review ${decision}.`)
    } catch (err) { setNotice(err.message) }
  }

  const openTrend = async student => {
    if (expanded === student.id) { setExpanded(null); setTrend(null); return }
    setExpanded(student.id)
    setTrend(null)
    try {
      const data = await api(`/pro/students/${student.id}/trend`)
      setTrend(data)
    } catch (err) { setNotice(err.message) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">SUPPORT DESK</span>
          <h1>Human in the loop</h1>
          <p>Review anonymized safety signals and support students — every access is audit-logged.</p>
        </div>
      </div>

      {notice && <div className="toast-inline" onClick={() => setNotice('')}>{notice}</div>}
      <ErrorBanner message={error} onRetry={load} />

      <div className="tab-row">
        <button className={`tab ${tab === 'queue' ? 'tab-on' : ''}`} onClick={() => setTab('queue')}><Flag size={15} /> Review queue {queue.length > 0 && <span className="tab-badge">{queue.length}</span>}</button>
        <button className={`tab ${tab === 'students' ? 'tab-on' : ''}`} onClick={() => setTab('students')}><UserRound size={15} /> Students</button>
      </div>

      {loading ? <div className="panel"><Skeleton rows={4} /></div> : tab === 'queue' ? (
        queue.length === 0 ? <EmptyState icon={ClipboardCheck} title="No open reviews">Everything is clear for now.</EmptyState> : (
          <ul className="review-list">
            {queue.map(item => (
              <li className={`review-item severity-${item.severity}`} key={item.id}>
                <div className="review-head">
                  <span className="review-alias">{item.alias}</span>
                  <span className={`pill pill-${item.severity === 'high' ? 'high' : 'moderate'}`}>{item.severity}</span>
                  <span className="pill pill-muted">{item.source}</span>
                  <small>{formatRelative(item.createdAt)}</small>
                </div>
                <p>{item.summary}</p>
                <div className="review-actions">
                  <button className="btn btn-soft btn-sm" onClick={() => review(item, 'confirmed')}><ShieldCheck size={14} /> Confirm</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => review(item, 'adjusted')}>Adjust</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => review(item, 'dismissed')}>Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <ul className="student-list">
          {students.map(student => (
            <li className="student-item" key={student.id}>
              <button className="student-row" onClick={() => openTrend(student)}>
                <span className="student-avatar">{student.alias.slice(0, 1)}</span>
                <span className="student-copy"><b>{student.alias}</b><small>{student.level} · trend {student.trend}</small></span>
                {student.flagged && <span className="pill pill-high">Flagged</span>}
                {student.tier && <span className={`tier-dot tier-${tierTone(student.tier)}`} />}
              </button>
              {expanded === student.id && (
                <div className="student-detail">
                  {trend ? (
                    <>
                      <p className="muted small">Risk points: {trend.points?.length || 0}</p>
                      <ul className="narrative-list">{trend.narrative?.slice(0, 3).map((line, index) => <li key={index}>{line}</li>)}</ul>
                      <div className="rules-mini">{trend.firedRules?.slice(0, 4).map(rule => <span className="pill pill-soft" key={rule.id}>{rule.id} · {Math.round(rule.strength * 100)}%</span>)}</div>
                    </>
                  ) : <span className="muted small"><Activity size={13} /> Loading trace…</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
