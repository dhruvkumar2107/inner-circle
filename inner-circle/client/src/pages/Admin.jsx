import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, ScrollText, ShieldAlert, Users } from 'lucide-react'
import { api, formatDate, formatRelative } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { ErrorBanner, SectionHeader, Skeleton } from '../components/common'

export default function Admin() {
  const [tab, setTab] = useState('overview')
  const analytics = useAsync(() => api('/admin/analytics'), [])
  const users = useAsync(() => tab === 'users' ? api('/admin/users') : Promise.resolve({ users: [] }), [tab])
  const audit = useAsync(() => tab === 'audit' ? api('/admin/audit?limit=50') : Promise.resolve({ audit: [] }), [tab])
  const flags = useAsync(() => tab === 'flags' ? api('/admin/flags') : Promise.resolve({ flags: [] }), [tab])

  const data = analytics.data

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">ADMINISTRATION</span>
          <h1>Aggregate insights</h1>
          <p>Anonymized, k-suppressed analytics. No individual student is ever identified here.</p>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab ${tab === 'overview' ? 'tab-on' : ''}`} onClick={() => setTab('overview')}><BarChart3 size={15} /> Overview</button>
        <button className={`tab ${tab === 'users' ? 'tab-on' : ''}`} onClick={() => setTab('users')}><Users size={15} /> Users</button>
        <button className={`tab ${tab === 'flags' ? 'tab-on' : ''}`} onClick={() => setTab('flags')}><ShieldAlert size={15} /> Flags</button>
        <button className={`tab ${tab === 'audit' ? 'tab-on' : ''}`} onClick={() => setTab('audit')}><ScrollText size={15} /> Audit log</button>
      </div>

      {tab === 'overview' && (
        <>
          <ErrorBanner message={analytics.error} onRetry={analytics.reload} />
          {analytics.loading ? <div className="panel"><Skeleton rows={5} /></div> : data && (
            <>
              <div className="stat-grid">
                <div className="stat-card"><span>Students</span><b>{data.totals.registeredStudents}</b></div>
                <div className="stat-card"><span>Assessments</span><b>{data.totals.assessmentsCompleted}</b></div>
                <div className="stat-card"><span>Check-ins</span><b>{data.totals.checkInsCompleted}</b></div>
                <div className="stat-card"><span>Risk inferences</span><b>{data.totals.riskInferences}</b></div>
                <div className="stat-card"><span>Open reviews</span><b>{data.totals.openReviews}</b></div>
                <div className="stat-card"><span>Posts</span><b>{data.peerSupport.posts}</b></div>
              </div>

              <section className="panel">
                <SectionHeader kicker="LAST 4 WEEKS" title="Activity trend" tight />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.weeklyTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#eaf2ed" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6c8478' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6c8478' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2ede7', fontSize: 12 }} />
                    <Bar dataKey="checkIns" name="Check-ins" fill="#8fd0ab" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="assessments" name="Assessments" fill="#5aa9d6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              <div className="dash-grid">
                <section className="panel">
                  <SectionHeader kicker="RISK DISTRIBUTION" title="Where students are" tight />
                  <div className="dist-grid">
                    {data.riskDistribution.map(bucket => (
                      <div className={`dist-card tier-${bucket.level === 'High' ? 'high' : bucket.level === 'Moderate' ? 'moderate' : 'low'}`} key={bucket.level}>
                        <b>{bucket.suppressed ? '—' : bucket.count}</b>
                        <span>{bucket.level}</span>
                        <small>{bucket.percent}%{bucket.suppressed ? ' (suppressed)' : ''}</small>
                      </div>
                    ))}
                  </div>
                  <p className="verify-note">Cells smaller than {data.minCellSize} are suppressed to protect privacy.</p>
                </section>

                <section className="panel">
                  <SectionHeader kicker="APPOINTMENTS" title="Support delivery" tight />
                  <ul className="stat-list">
                    <li><span>Total</span><b>{data.appointmentStats.total}</b></li>
                    <li><span>Upcoming</span><b>{data.appointmentStats.upcoming}</b></li>
                    <li><span>Completed</span><b>{data.appointmentStats.completed}</b></li>
                    <li><span>Cancelled</span><b>{data.appointmentStats.cancelled}</b></li>
                    <li><span>Online</span><b>{data.appointmentStats.online}</b></li>
                  </ul>
                </section>
              </div>

              <section className="panel">
                <SectionHeader kicker="COMMON CONCERNS" title="What students talk about" tight />
                <ul className="concern-list">
                  {data.commonConcerns.slice(0, 8).map(item => (
                    <li key={item.concern}>
                      <span>{item.concern}</span>
                      <div className="concern-bar"><i style={{ width: `${Math.min(100, (item.channel.count ?? 0) * 3)}%` }} /></div>
                      <b>{item.channel.suppressed ? '—' : item.channel.count}</b>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}

      {tab === 'users' && (
        <>
          <ErrorBanner message={users.error} onRetry={users.reload} />
          {users.loading ? <div className="panel"><Skeleton rows={6} /></div> : (
            <section className="panel table-wrap">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Alias</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {users.data?.users?.map(user => (
                    <tr key={user.id}><td>{user.name}</td><td>{user.alias}</td><td>{user.email}</td><td><span className="pill pill-soft">{user.role}</span></td><td>{formatDate(user.createdAt)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}

      {tab === 'flags' && (
        <>
          <ErrorBanner message={flags.error} onRetry={flags.reload} />
          {flags.loading ? <div className="panel"><Skeleton rows={5} /></div> : flags.data?.flags?.length ? (
            <ul className="review-list">
              {flags.data.flags.map(flag => (
                <li className={`review-item severity-${flag.severity}`} key={flag.id}>
                  <div className="review-head">
                    <span className="review-alias">{flag.alias}</span>
                    <span className={`pill pill-${flag.severity === 'high' ? 'high' : 'moderate'}`}>{flag.severity}</span>
                    <span className="pill pill-muted">{flag.source}</span>
                    <span className={`pill pill-${flag.status === 'open' ? 'moderate' : 'low'}`}>{flag.status}</span>
                    <small>{formatRelative(flag.createdAt)}</small>
                  </div>
                  <p>{flag.summary}</p>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No flags recorded.</p>}
        </>
      )}

      {tab === 'audit' && (
        <>
          <ErrorBanner message={audit.error} onRetry={audit.reload} />
          {audit.loading ? <div className="panel"><Skeleton rows={6} /></div> : (
            <section className="panel table-wrap">
              <table className="data-table">
                <thead><tr><th>When</th><th>Action</th><th>Role</th><th>Resource</th></tr></thead>
                <tbody>
                  {audit.data?.audit?.map(record => (
                    <tr key={record.id}><td>{formatRelative(record.ts)}</td><td>{record.action}</td><td>{record.role}</td><td>{record.resource}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  )
}
