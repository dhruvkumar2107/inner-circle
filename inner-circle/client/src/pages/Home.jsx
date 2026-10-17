import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarHeart, ClipboardCheck, Gamepad2, Leaf, MessageCircle, Stethoscope, Wind, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Mascot, Note, SectionTitle, Badge } from '../components/ui'
import { MOODS, MOOD_SUGGESTIONS, NEED_CHOICES, moodMeta } from '../lib/moods'
import { todayKey } from '../lib/storage'

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const SMALL_CARDS = [
  { to: '/breathe?ex=minute', icon: Wind, title: 'One-Minute Reset', body: 'A single quiet minute with a breathing circle.', cta: 'Start' },
  { to: '/play', icon: Gamepad2, title: 'Play & Relax', body: 'Gentle mini-games and calming activities.', cta: 'Open' },
  { to: '/assessments', icon: ClipboardCheck, title: 'Mental Health Check-in', body: 'PHQ-9 and GAD-7 screening, whenever you choose.', cta: 'View' },
  { to: '/mood', icon: CalendarHeart, title: 'My Mood Journey', body: 'Your check-ins, tiny wins and reflections.', cta: 'View' },
  { to: '/professional', icon: Stethoscope, title: 'Contact a Professional', body: 'Department of Psychiatry, Dayananda Sagar University.', cta: 'Get support' },
]

export default function Home() {
  const navigate = useNavigate()
  const { profile, moods, addMood, toast } = useApp()
  const [justPicked, setJustPicked] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(false)

  const today = todayKey()
  const todaysMood = moods.find((m) => m.date === today) || null
  const activeMood = justPicked || todaysMood?.mood || null
  const suggestion = activeMood ? MOOD_SUGGESTIONS[activeMood] : null

  const pickMood = (key) => {
    addMood(key)
    setJustPicked(key)
    setShowSuggestion(key !== 'calm' && key !== 'okay' && key !== 'happy')
  }

  const firstName = profile?.firstName || 'friend'

  return (
    <div className="page">
      <section className="card home-hero">
        <Mascot size={64} className="hero-mascot" />
        <span className="kicker">{greeting()}</span>
        <h1>Hi {firstName}, welcome to Inner Circle 🌿</h1>
        <p className="lead" style={{ marginBottom: '0.3rem' }}>How are you feeling today?</p>
        <p className="sub" style={{ margin: 0 }}>
          You don't have to figure everything out at once. Take a moment for yourself.
        </p>
      </section>

      <section className="card card-pad" style={{ marginTop: '1.1rem' }}>
        <SectionTitle
          title="How are you feeling today?"
          sub={todaysMood ? 'You have already checked in today — you can change it any time.' : 'Pick whatever feels closest. Nothing is wrong.'}
        />

        <div className="mood-grid" role="group" aria-label="Daily mood check-in">
          {MOODS.map((mood) => (
            <button
              key={mood.key}
              type="button"
              className={`mood-card ${activeMood === mood.key ? 'mood-card-on' : ''}`}
              aria-pressed={activeMood === mood.key}
              onClick={() => pickMood(mood.key)}
            >
              <span className="mood-emoji" aria-hidden="true">{mood.emoji}</span>
              <span className="mood-label">{mood.label}</span>
            </button>
          ))}
        </div>

        {activeMood && (
          <div style={{ marginTop: '1.2rem' }}>
            <div className="note note-mint" style={{ marginBottom: suggestion && showSuggestion ? '0.9rem' : 0 }}>
              <Leaf size={15} />
              <div>
                <b>Thanks for checking in with yourself.</b> What would help you right now?{' '}
                <span className="tiny" style={{ display: 'block', marginTop: '0.2rem', opacity: 0.85 }}>
                  A mood is a moment, not a verdict — it never defines your mental health on its own.
                </span>
              </div>
            </div>

            <div className="chip-row">
              {NEED_CHOICES.map((choice) => (
                <button key={choice.key} type="button" className="chip" onClick={() => navigate(choice.to)}>
                  {choice.label}
                </button>
              ))}
            </div>

            {suggestion && showSuggestion && (
              <div className="card card-mint card-pad suggest-card" style={{ marginTop: '0.9rem' }}>
                <span className="suggest-icon"><Wind size={19} /></span>
                <span className="suggest-copy">
                  <b>{suggestion.title}</b>
                  <p>{suggestion.body}</p>
                </span>
                <span style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(suggestion.cta.to.replace('#dismiss', '/home'))}>
                    {suggestion.cta.label}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowSuggestion(false)}>
                    Maybe later
                  </button>
                </span>
                {suggestion.alt && suggestion.alt.to !== '#dismiss' && (
                  <Link className="small" to={suggestion.alt.to} style={{ fontWeight: 700, flexBasis: '100%' }}>
                    Or: {suggestion.alt.label} →
                  </Link>
                )}
              </div>
            )}

            {suggestion && !showSuggestion && (
              <p className="small muted" style={{ marginTop: '0.7rem' }}>
                Recorded for today as <b>{moodMeta(activeMood)?.label}</b>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSuggestion(true)}>Show a suggestion</button>
              </p>
            )}
          </div>
        )}
      </section>

      <section style={{ marginTop: '1.1rem' }}>
        <Link to="/companion" className="card card-click chat-feature">
          <span className="feature-icon"><MessageCircle size={20} /></span>
          <span style={{ flex: 1 }}>
            <b>Talk to your AI companion</b>
            <p>Type or speak — a supportive conversation, whenever you want it. No topic is too small.</p>
          </span>
          <span className="go">Open chat <ArrowRight size={16} /></span>
        </Link>
      </section>

      <section className="grid grid-3" style={{ marginTop: '1.1rem' }}>
        {SMALL_CARDS.map(({ to, icon: Icon, title, body, cta }) => (
          <Link key={to} to={to} className="card card-click feature-card">
            <span className="feature-icon"><Icon size={19} /></span>
            <b>{title}</b>
            <p>{body}</p>
            <span className="go">{cta} <ArrowRight size={14} /></span>
          </Link>
        ))}
        <div className="card card-cream feature-card">
          <span className="feature-icon" style={{ background: 'var(--cream-2)' }}><Badge tone="demo">Demo</Badge></span>
          <b>Sentiment analysis</b>
          <p>Every message you send to the companion is analysed for emotional tone — see it working on the chat page.</p>
          <Link className="go" to="/how">See how it works <ArrowRight size={14} /></Link>
        </div>
      </section>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey">
          Inner Circle offers screening, support and a route to professional help. It does not diagnose
          or prescribe, and it is not an emergency service — use <b>I need help now</b> if you may be in danger.
        </Note>
      </div>
    </div>
  )
}
