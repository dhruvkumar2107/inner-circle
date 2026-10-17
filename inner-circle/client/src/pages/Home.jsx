import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarHeart, ClipboardCheck, Gamepad2, Leaf, MessageCircle, Stethoscope, Wind, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { Mascot, Note, SectionTitle, Badge } from '../components/ui'
import { MOODS, MOOD_SUGGESTIONS, NEED_CHOICES, moodMeta } from '../lib/moods'
import { todayKey } from '../lib/storage'

const greetingKey = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'home.kicker.morning'
  if (hour < 17) return 'home.kicker.afternoon'
  return 'home.kicker.evening'
}

const SMALL_CARDS = [
  { to: '/breathe?ex=minute', icon: Wind, titleKey: 'home.cards.minute.title', bodyKey: 'home.cards.minute.body', ctaKey: 'home.cards.minute.cta' },
  { to: '/play', icon: Gamepad2, titleKey: 'home.cards.play.title', bodyKey: 'home.cards.play.body', ctaKey: 'home.cards.play.cta' },
  { to: '/assessments', icon: ClipboardCheck, titleKey: 'home.cards.checkin.title', bodyKey: 'home.cards.checkin.body', ctaKey: 'home.cards.checkin.cta' },
  { to: '/mood', icon: CalendarHeart, titleKey: 'home.cards.mood.title', bodyKey: 'home.cards.mood.body', ctaKey: 'home.cards.mood.cta' },
  { to: '/professional', icon: Stethoscope, titleKey: 'home.cards.pro.title', bodyKey: 'home.cards.pro.body', ctaKey: 'home.cards.pro.cta' },
]

export default function Home() {
  const navigate = useNavigate()
  const t = useT()
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

  const firstName = profile?.firstName || t('nav.friend')

  return (
    <div className="page">
      <section className="card home-hero">
        <Mascot size={64} className="hero-mascot" />
        <span className="kicker">{t(greetingKey())}</span>
        <h1>{t('home.title', { name: firstName })}</h1>
        <p className="lead" style={{ marginBottom: '0.3rem' }}>{t('home.lead')}</p>
        <p className="sub" style={{ margin: 0 }}>
          {t('home.sub')}
        </p>
      </section>

      <section className="card card-pad" style={{ marginTop: '1.1rem' }}>
        <SectionTitle
          title={t('home.checkin.title')}
          sub={todaysMood ? t('home.checkin.subDone') : t('home.checkin.subNew')}
        />

        <div className="mood-grid" role="group" aria-label={t('home.checkin.aria')}>
          {MOODS.map((mood) => (
            <button
              key={mood.key}
              type="button"
              className={`mood-card ${activeMood === mood.key ? 'mood-card-on' : ''}`}
              aria-pressed={activeMood === mood.key}
              onClick={() => pickMood(mood.key)}
            >
              <span className="mood-emoji" aria-hidden="true">{mood.emoji}</span>
              <span className="mood-label">{t(mood.labelKey)}</span>
            </button>
          ))}
        </div>

        {activeMood && (
          <div style={{ marginTop: '1.2rem' }}>
            <div className="note note-mint" style={{ marginBottom: suggestion && showSuggestion ? '0.9rem' : 0 }}>
              <Leaf size={15} />
              <div>
                <b>{t('home.note.thanks')}</b> {t('home.note.question')}{' '}
                <span className="tiny" style={{ display: 'block', marginTop: '0.2rem', opacity: 0.85 }}>
                  {t('home.note.tiny')}
                </span>
              </div>
            </div>

            <div className="chip-row">
              {NEED_CHOICES.map((choice) => (
                <button key={choice.key} type="button" className="chip" onClick={() => navigate(choice.to)}>
                  {t(choice.labelKey)}
                </button>
              ))}
            </div>

            {suggestion && showSuggestion && (
              <div className="card card-mint card-pad suggest-card" style={{ marginTop: '0.9rem' }}>
                <span className="suggest-icon"><Wind size={19} /></span>
                <span className="suggest-copy">
                  <b>{t(suggestion.titleKey)}</b>
                  <p>{t(suggestion.bodyKey)}</p>
                </span>
                <span style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(suggestion.cta.to.replace('#dismiss', '/home'))}>
                    {t(suggestion.cta.labelKey)}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowSuggestion(false)}>
                    {t('home.maybeLater')}
                  </button>
                </span>
                {suggestion.alt && suggestion.alt.to !== '#dismiss' && (
                  <Link className="small" to={suggestion.alt.to} style={{ fontWeight: 700, flexBasis: '100%' }}>
                    {t('home.orPrefix')} {t(suggestion.alt.labelKey)} →
                  </Link>
                )}
              </div>
            )}

            {suggestion && !showSuggestion && (
              <p className="small muted" style={{ marginTop: '0.7rem' }}>
                {t('home.recordedAs')} <b>{t(moodMeta(activeMood)?.labelKey)}</b>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSuggestion(true)}>{t('home.showSuggestion')}</button>
              </p>
            )}
          </div>
        )}
      </section>

      <section style={{ marginTop: '1.1rem' }}>
        <Link to="/companion" className="card card-click chat-feature">
          <span className="feature-icon"><MessageCircle size={20} /></span>
          <span style={{ flex: 1 }}>
            <b>{t('home.chat.title')}</b>
            <p>{t('home.chat.body')}</p>
          </span>
          <span className="go">{t('home.chat.cta')} <ArrowRight size={16} /></span>
        </Link>
      </section>

      <section className="grid grid-3" style={{ marginTop: '1.1rem' }}>
        {SMALL_CARDS.map(({ to, icon: Icon, titleKey, bodyKey, ctaKey }) => (
          <Link key={to} to={to} className="card card-click feature-card">
            <span className="feature-icon"><Icon size={19} /></span>
            <b>{t(titleKey)}</b>
            <p>{t(bodyKey)}</p>
            <span className="go">{t(ctaKey)} <ArrowRight size={14} /></span>
          </Link>
        ))}
        <div className="card card-cream feature-card">
          <span className="feature-icon" style={{ background: 'var(--cream-2)' }}><Badge tone="demo">{t('common.demo')}</Badge></span>
          <b>{t('home.sentiment.title')}</b>
          <p>{t('home.sentiment.body')}</p>
          <Link className="go" to="/how">{t('home.sentiment.cta')} <ArrowRight size={14} /></Link>
        </div>
      </section>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey">
          {t('home.disclaimer.pre')}<b>{t('nav.helpNow')}</b>{t('home.disclaimer.post')}
        </Note>
      </div>
    </div>
  )
}
