import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowRight, BookOpen, CalendarDays, CalendarPlus, HeartPulse, MessageCircle, NotebookPen, Sparkles, Users, Wind,
} from 'lucide-react'
import { api, getAlias } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { ErrorBanner, SectionHeader, Skeleton } from '../components/common'

const tierLabel = { 1: 'Steady', 2: 'Needs care', 3: 'High support' }
const tierTone = { 1: 'low', 2: 'moderate', 3: 'high' }

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const loadDashboard = async () => {
  let concerns = []
  try { concerns = JSON.parse(localStorage.getItem('inner-circle-concerns') || '[]') } catch { concerns = [] }
  const [risk, appointments, recommendations, community] = await Promise.all([
    api('/risk/latest').catch(() => ({ inference: null })),
    api('/appointments').catch(() => ({ appointments: [] })),
    api(`/resources/recommended?concerns=${encodeURIComponent(concerns.join(','))}&tier=Moderate`).catch(() => ({ recommendations: [] })),
    api('/forum/posts?sort=popular&limit=3').catch(() => ({ posts: [] })),
  ])
  const trend = await api('/risk/trend').catch(() => ({ points: [] }))
  const today = new Date().toISOString().slice(0, 10)
  return {
    inference: risk.inference,
    appointments: (appointments.appointments || []).filter(item => item.status !== 'cancelled' && item.date >= today).slice(0, 3),
    recommendations: (recommendations.recommendations || []).slice(0, 3),
    community: community.posts || [],
    points: (trend.points || []).slice(-10).map(point => ({
      label: new Date(point.date).toLocaleDateString([], { day: 'numeric', month: 'short' }),
      score: Number(point.riskScore.toFixed(2)),
    })),
  }
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(loadDashboard, [])
  const inference = data?.inference
  const tier = inference?.tier ?? null

  return (
    <div className="page">
      <section className="dash-hero">
        <div className="dash-hero-copy">
          <span className="kicker">{t('navbar.eyebrow')}</span>
          <h1>{greeting()}, {getAlias()}.</h1>
          <p>How are you arriving today? There's no right way — take a slow breath and choose whatever feels helpful.</p>
          <div className="quick-actions">
            <Link className="quick-action" to="/chat"><MessageCircle size={20} /><b>Talk it through</b><small>Chat with your companion</small></Link>
            <Link className="quick-action" to="/check-in"><NotebookPen size={20} /><b>Check in</b><small>30-second mood check</small></Link>
            <Link className="quick-action" to="/appointments"><CalendarPlus size={20} /><b>Book support</b><small>Sessions & peer circles</small></Link>
            <Link className="quick-action" to="/resources"><Wind size={20} /><b>Calm now</b><small>Breathe & ground</small></Link>
          </div>
        </div>
        <div className={`dash-status tier-${tierTone[tier] || 'unknown'}`}>
          <span className="dash-status-label"><HeartPulse size={15} /> Your wellbeing pulse</span>
          {inference ? (
            <>
              <b>{tierLabel[tier] || 'Not scored yet'}</b>
              <p>{inference.narrative?.[0] || 'Keep checking in so we can understand your patterns.'}</p>
              <Link to="/privacy" className="dash-status-link">How we calculate this <ArrowRight size={14} /></Link>
            </>
          ) : (
            <p>Complete a check-in or a chat and your wellbeing pulse will appear here — with a plain-language explanation.</p>
          )}
        </div>
      </section>

      <ErrorBanner message={error} onRetry={reload} />

      <div className="dash-grid">
        <section className="panel panel-trend">
          <SectionHeader kicker="LAST 10 CHECK-INS" title="How your wellbeing is moving" tight
            action={<Link className="link-more" to="/check-in">New check-in <ArrowRight size={14} /></Link>} />
          {loading ? <Skeleton rows={4} /> : data?.points?.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5aab7f" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#5aab7f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6c8478' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6c8478' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2ede7', fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#3f9468" strokeWidth={2.5} fill="url(#riskFill)" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="chart-note">Lower is steadier. This is a supportive guide, never a diagnosis.</p>
            </div>
          ) : (
            <div className="empty-inline">
              <p>No check-ins yet. Your first one takes about 30 seconds and helps you notice patterns gently.</p>
              <Link className="btn btn-primary btn-sm" to="/check-in"><NotebookPen size={15} /> Check in now</Link>
            </div>
          )}
        </section>

        <section className="panel">
          <SectionHeader kicker="UPCOMING" title="Your appointments" tight
            action={<Link className="link-more" to="/appointments">Manage <ArrowRight size={14} /></Link>} />
          {loading ? <Skeleton rows={2} /> : data?.appointments?.length ? (
            <ul className="mini-list">
              {data.appointments.map(item => (
                <li key={item.id}>
                  <span className="mini-icon"><CalendarDays size={16} /></span>
                  <span className="mini-copy"><b>{item.professionalName}</b><small>{item.date} · {item.time} · {item.mode}</small></span>
                  <span className={`pill pill-${item.priority === 'emergency' ? 'high' : 'low'}`}>{item.type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-inline">
              <p>No sessions booked yet. Whenever you're ready, a counsellor or peer is here.</p>
              <Link className="btn btn-soft btn-sm" to="/appointments"><CalendarPlus size={15} /> Find support</Link>
            </div>
          )}
        </section>

        <section className="panel">
          <SectionHeader kicker="PICKED FOR YOU" title="Gentle next steps" tight
            action={<Link className="link-more" to="/resources">All resources <ArrowRight size={14} /></Link>} />
          {loading ? <Skeleton rows={3} /> : data?.recommendations?.length ? (
            <ul className="recommend-list">
              {data.recommendations.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <span className="recommend-icon"><Sparkles size={15} /></span>
                  <div><b>{item.title}</b><small>{item.reason}</small></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-inline"><p>Recommendations will appear once you check in or chat.</p></div>
          )}
        </section>

        <section className="panel">
          <SectionHeader kicker="COMMUNITY HIGHLIGHTS" title="You're not alone" tight
            action={<Link className="link-more" to="/forum">Visit community <ArrowRight size={14} /></Link>} />
          {loading ? <Skeleton rows={3} /> : data?.community?.length ? (
            <ul className="community-list">
              {data.community.map(post => (
                <li key={post.id}>
                  <span className="community-avatar"><Users size={14} /></span>
                  <div><b>{post.authorAlias}</b><p>{post.body}</p><small>{post.room} · {post.reactions.support + post.reactions.relate + post.reactions.grow} supports</small></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-inline"><p>The rooms are quiet right now — be the first to share something kind.</p>
              <Link className="btn btn-soft btn-sm" to="/forum"><Users size={15} /> Open community</Link></div>
          )}
        </section>
      </div>

      <section className="dash-foot">
        <BookOpen size={18} />
        <p><b>Remember:</b> Inner Circle is a supportive companion, not an emergency service. If you or someone else may be in danger, please contact Tele-MANAS 14416, KIRAN 1800-599-0019, or Emergency 112 right away.</p>
      </section>
    </div>
  )
}
