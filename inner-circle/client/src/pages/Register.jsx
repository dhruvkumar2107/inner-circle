import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, HeartHandshake, Leaf, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { Brand, Mascot, Modal, Note } from '../components/ui'

const DEFAULT_UNIVERSITY = 'Dayananda Sagar University'

const TERMS_SECTION_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
const PRIVACY_SECTION_IDS = ['p1', 'p2', 'p3', 'p4']

/** Sign-in errors come from the frozen app store in English; map them to keys. */
const SIGNIN_ERROR_KEYS = {
  'No demo account on this device yet. Please register first.': 'register.errors.noAccount',
  'That email is not registered on this device.': 'register.errors.emailNotRegistered',
  'That password does not match the demo account.': 'register.errors.passwordNoMatch',
}

export default function Register() {
  const t = useT()
  const navigate = useNavigate()
  const { profile, register, signIn, toast } = useApp()
  const [mode, setMode] = useState(profile ? 'signin' : 'register')
  const [form, setForm] = useState({
    name: '', age: '', university: DEFAULT_UNIVERSITY, email: '', password: '', confirm: '',
    terms: false, research: false,
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [legal, setLegal] = useState(null) // 'terms' | 'privacy' | null

  useEffect(() => {
    if (profile) setMode((m) => (m === 'register' ? 'signin' : m))
  }, [profile])

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (error) setError('')
  }

  const fillDemo = () => {
    setForm((f) => ({
      ...f,
      name: 'Ananya Sharma',
      age: '20',
      university: DEFAULT_UNIVERSITY,
      email: 'ananya.sharma@dsu.example.edu',
      password: 'quietcircle24',
      confirm: 'quietcircle24',
      terms: true,
    }))
    setError('')
  }

  const submitRegister = (event) => {
    event.preventDefault()
    const age = Number(form.age)
    if (!form.name.trim()) return setError('register.errors.name')
    if (!form.age || Number.isNaN(age)) return setError('register.errors.ageRequired')
    if (age < 18) return setError('register.errors.ageMin')
    if (age > 120) return setError('register.errors.ageInvalid')
    if (!form.university.trim()) return setError('register.errors.university')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('register.errors.email')
    if (form.password.length < 8) return setError('register.errors.password')
    if (form.password !== form.confirm) return setError('register.errors.passwordMismatch')
    if (!form.terms) return setError('register.errors.terms')

    register({
      name: form.name,
      age: form.age,
      university: form.university,
      email: form.email,
      password: form.password,
      research: form.research,
    })
    toast(t('register.toast.welcome'))
    navigate('/home', { replace: true })
  }

  const submitSignIn = (event) => {
    event.preventDefault()
    const result = signIn(form.email, form.password)
    if (!result.ok) return setError(SIGNIN_ERROR_KEYS[result.error] || result.error)
    toast(t('register.toast.welcomeBack'))
    navigate('/home', { replace: true })
  }

  const renderConsentLine = () => {
    const parts = t('register.consent.terms').split(/(\{\{terms\}\}|\{\{privacy\}\})/)
    return parts.map((part, i) => {
      if (part === '{{terms}}') {
        return (
          <a key={`terms-${i}`} href="#terms" onClick={(e) => { e.preventDefault(); setLegal('terms') }}>
            {t('register.consent.termsLink')}
          </a>
        )
      }
      if (part === '{{privacy}}') {
        return (
          <a key={`privacy-${i}`} href="#privacy" onClick={(e) => { e.preventDefault(); setLegal('privacy') }}>
            {t('register.consent.privacyLink')}
          </a>
        )
      }
      return part
    })
  }

  const researchParts = t('register.consent.research').split('{{bold}}')
  const termsNoteParts = t('register.terms.note').split('{{bold}}')

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Brand />
        <h1>{t('register.hero.title')}</h1>
        <p className="muted" style={{ maxWidth: '46ch' }}>
          {t('register.hero.body')}
        </p>
        <div className="auth-points">
          <div className="auth-point">
            <span><HeartHandshake size={16} /></span>
            <span><b>{t('register.hero.points.supportiveTitle')}</b> {t('register.hero.points.supportiveBody')}</span>
          </div>
          <div className="auth-point">
            <span><ShieldCheck size={16} /></span>
            <span><b>{t('register.hero.points.privateTitle')}</b> {t('register.hero.points.privateBody')}</span>
          </div>
          <div className="auth-point">
            <span><Sparkles size={16} /></span>
            <span><b>{t('register.hero.points.neverTitle')}</b> {t('register.hero.points.neverBody')}</span>
          </div>
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <Mascot size={54} />
          <p className="tiny muted" style={{ margin: 0, maxWidth: '30ch' }}>
            {t('register.hero.collab')}
          </p>
        </div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <span className="kicker">{mode === 'register' ? t('register.kicker.register') : t('register.kicker.signin')}</span>
          <h2 style={{ marginBottom: '0.4rem' }}>{mode === 'register' ? t('register.heading.register') : t('register.heading.signin')}</h2>
          <p className="muted small" style={{ marginBottom: '1.3rem' }}>
            {mode === 'register'
              ? t('register.sub.register')
              : t('register.sub.signin')}
          </p>

          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={15} />
              <span>{t(error)}</span>
            </div>
          )}

          <form onSubmit={mode === 'register' ? submitRegister : submitSignIn} noValidate>
            {mode === 'register' && (
              <>
                <label className="field">
                  <span>{t('register.fields.name')}</span>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Ananya Sharma" autoComplete="name" />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>{t('register.fields.age')} <em>{t('register.fields.ageHint')}</em></span>
                    <input type="number" min={1} max={120} value={form.age} onChange={set('age')} placeholder="20" />
                  </label>
                  <label className="field">
                    <span>{t('register.fields.university')}</span>
                    <input type="text" value={form.university} onChange={set('university')} placeholder={t('register.placeholders.university')} />
                  </label>
                </div>
              </>
            )}

            <label className="field">
              <span>{t('register.fields.email')}</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@university.edu" autoComplete="email" />
            </label>

            <label className="field">
              <span>{t('register.fields.password')}</span>
              <span style={{ position: 'relative', display: 'block' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder={mode === 'register' ? t('register.placeholders.passwordNew') : t('register.placeholders.passwordExisting')}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  style={{ paddingRight: '2.6rem' }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  style={{ position: 'absolute', right: '0.25rem', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('register.aria.hidePassword') : t('register.aria.showPassword')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {mode === 'register' && (
              <label className="field">
                <span>{t('register.fields.confirm')}</span>
                <input type="password" value={form.confirm} onChange={set('confirm')} placeholder={t('register.placeholders.confirm')} autoComplete="new-password" />
              </label>
            )}

            {mode === 'register' && (
              <>
                <div className="check-row">
                  <input id="terms" type="checkbox" checked={form.terms} onChange={set('terms')} />
                  <label htmlFor="terms">
                    {renderConsentLine()}
                  </label>
                </div>
                <div className="check-row">
                  <input id="research" type="checkbox" checked={form.research} onChange={set('research')} />
                  <label htmlFor="research">
                    {researchParts[0]}
                    <b>{t('register.consent.researchBold')}</b>
                    {researchParts[1]}
                  </label>
                </div>
              </>
            )}

            <button className="btn btn-primary btn-lg btn-block" type="submit">
              {mode === 'register' ? <>{t('register.submit.register')} <ArrowRight size={17} /></> : t('register.submit.signin')}
            </button>
          </form>

          <p className="auth-alt">
            {mode === 'register' ? (
              <>
                {t('register.alt.haveAccount')}{' '}
                <a href="#signin" onClick={(e) => { e.preventDefault(); setError(''); setMode('signin') }}>{t('register.alt.signin')}</a>
                {' · '}
                <button type="button" className="btn btn-ghost btn-sm" onClick={fillDemo} style={{ padding: '0.1rem 0.4rem' }}>
                  {t('register.alt.fillDemo')}
                </button>
              </>
            ) : (
              <>
                {t('register.alt.newHere')}{' '}
                <a href="#register" onClick={(e) => { e.preventDefault(); setError(''); setMode('register') }}>{t('register.alt.createAccount')}</a>
                {profile && (
                  <>
                    {' · '}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/home')} style={{ padding: '0.1rem 0.4rem' }}>
                      {t('register.alt.continueAs', { name: profile.firstName })}
                    </button>
                  </>
                )}
              </>
            )}
          </p>

          <p className="tiny muted center" style={{ marginTop: '1.4rem', display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
            <Lock size={12} /> {t('register.demoNote')}
          </p>
        </div>
      </div>

      {legal === 'terms' && (
        <Modal
          kicker={t('register.terms.kicker')}
          title={t('register.terms.title')}
          wide
          onClose={() => setLegal(null)}
          footer={<button className="btn btn-primary" onClick={() => setLegal(null)}>{t('register.terms.understand')}</button>}
        >
          <Note tone="mint" icon={Sparkles}>
            {termsNoteParts[0]}
            <b>{t('register.terms.noteBold')}</b>
            {termsNoteParts[1]}
          </Note>
          <div className="legal-scroll" style={{ marginTop: '0.9rem' }}>
            {TERMS_SECTION_IDS.map((id) => (
              <div key={id}>
                <h4>{t(`register.terms.sections.${id}.title`)}</h4>
                <p>{t(`register.terms.sections.${id}.body`)}</p>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
            {t('register.terms.footnote')}
          </p>
        </Modal>
      )}

      {legal === 'privacy' && (
        <Modal
          kicker={t('register.privacy.kicker')}
          title={t('register.privacy.title')}
          wide
          onClose={() => setLegal(null)}
          footer={<button className="btn btn-primary" onClick={() => setLegal(null)}>{t('common.close')}</button>}
        >
          <div className="legal-scroll">
            {PRIVACY_SECTION_IDS.map((id) => (
              <div key={id}>
                <h4>{t(`register.privacy.sections.${id}.title`)}</h4>
                <p>{t(`register.privacy.sections.${id}.body`)}</p>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
            {t('register.privacy.footnote')}
          </p>
        </Modal>
      )}
    </div>
  )
}
