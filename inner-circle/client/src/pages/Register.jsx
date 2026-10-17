import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, HeartHandshake, Leaf, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Brand, Mascot, Modal, Note } from '../components/ui'

const DEFAULT_UNIVERSITY = 'Dayananda Sagar University'

const TERMS_SECTIONS = [
  {
    title: '1. What information Inner Circle collects',
    body: 'Your name, age, university, email address and the entries you choose to make — mood check-ins, journal notes, tiny wins, screening answers and your conversations with the companion. You choose what to share; nothing is compulsory except the basics needed to create an account.',
  },
  {
    title: '2. Why we need it',
    body: 'To create your account, remember your check-ins, show your mood journey over time, and personalise the activities and support we suggest. We ask for your age because registration is currently open only to users aged 18 and above.',
  },
  {
    title: '3. Sensitive information about your well-being',
    body: 'You may choose to share information about your mental well-being, including screening answers and what you tell the companion. This is sensitive. It is used only to support you inside Inner Circle, and you can delete it at any time from Settings & Privacy.',
  },
  {
    title: '4. How your messages and answers may be processed',
    body: 'Your messages are analysed for emotional tone (sentiment and emotion analysis) so the companion can respond appropriately and suggest relevant activities. Screening answers are scored and then interpreted by our fuzzy-logic support engine to produce an illustrative level of reported symptoms. In this prototype the analysis runs inside your browser and responses are simulated.',
  },
  {
    title: '5. How information is protected, and who can access it',
    body: 'In this prototype your data stays in this browser and is not sent to any server. In a deployed version, information would be stored with access controls, secure transmission and data minimisation, and would be visible only to you. No doctor or intern can read your conversations by default.',
  },
  {
    title: '6. When information may be shared',
    body: 'Information would be shared with authorised professionals only (a) when you ask for professional support and explicitly consent to sharing the relevant part of your record, or (b) when there is a clear and serious safety concern and sharing is necessary to protect you or someone else. In that situation we would tell you wherever possible. Otherwise nothing is shared.',
  },
  {
    title: '7. The AI is not a doctor',
    body: 'Inner Circle provides supportive conversation, self-help activities and screening tools. It does not diagnose, does not prescribe and is not a replacement for a qualified mental health professional. Always consult a qualified professional for medical advice.',
  },
  {
    title: '8. Accessing and deleting your information',
    body: 'You can review your saved profile, check-ins, screening records and conversations in Settings & Privacy, and you can delete any of it — or your whole demo profile — from the same page at any time.',
  },
]

const PRIVACY_SECTIONS = [
  {
    title: 'Data stored in this prototype',
    body: 'Everything lives in this browser\'s local storage under the Inner Circle keys: your demo profile, mood check-ins, journal entries, tiny wins, screening records and companion messages. Nothing is transmitted to a server.',
  },
  {
    title: 'What a real deployment would require',
    body: 'Encryption in transit and at rest, role-based access control, retention limits, a reviewed privacy policy, audit logging for any professional access, and explicit authorisation before any data is shared with the Department of Psychiatry, Dayananda Sagar University.',
  },
  {
    title: 'Your controls',
    body: 'Export is simulated in this prototype; deletion works immediately. Optional research consent is separate from accepting the Terms and can be changed at any time.',
  },
  {
    title: 'Voice input',
    body: 'If you use the microphone, your browser converts speech to text. This app does not record audio continuously and does not send recordings to any external service of its own.',
  },
]

export default function Register() {
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
    if (!form.name.trim()) return setError('Please enter your full name.')
    if (!form.age || Number.isNaN(age)) return setError('Please enter your age so we can confirm eligibility.')
    if (age < 18) return setError('Registration is currently available only to users aged 18 or above. Please come back when you are 18, or explore the public resources on the Department of Psychiatry page.')
    if (age > 120) return setError('Please enter a valid age.')
    if (!form.university.trim()) return setError('Please enter your university name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email address.')
    if (form.password.length < 8) return setError('Please use a password of at least 8 characters.')
    if (form.password !== form.confirm) return setError('The two passwords do not match.')
    if (!form.terms) return setError('Please accept the Terms and Conditions to create your account.')

    register({
      name: form.name,
      age: form.age,
      university: form.university,
      email: form.email,
      password: form.password,
      research: form.research,
    })
    toast('Welcome to Inner Circle 🌿')
    navigate('/home', { replace: true })
  }

  const submitSignIn = (event) => {
    event.preventDefault()
    const result = signIn(form.email, form.password)
    if (!result.ok) return setError(result.error)
    toast('Welcome back 🌿')
    navigate('/home', { replace: true })
  }

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Brand />
        <h1>A quiet space for students to check in with themselves.</h1>
        <p className="muted" style={{ maxWidth: '46ch' }}>
          Talk to a supportive companion, understand how you feel with recognised screening
          tools, unwind with calm activities, and reach real people when you need them.
        </p>
        <div className="auth-points">
          <div className="auth-point">
            <span><HeartHandshake size={16} /></span>
            <span><b>Supportive, not clinical.</b> Screening tools and an AI companion that never pretends to be a doctor.</span>
          </div>
          <div className="auth-point">
            <span><ShieldCheck size={16} /></span>
            <span><b>Private by design.</b> This prototype stores everything in your browser only.</span>
          </div>
          <div className="auth-point">
            <span><Sparkles size={16} /></span>
            <span><b>Never forced.</b> No questionnaire is required before you explore the app.</span>
          </div>
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <Mascot size={54} />
          <p className="tiny muted" style={{ margin: 0, maxWidth: '30ch' }}>
            In collaboration with the Department of Psychiatry, Dayananda Sagar University.
          </p>
        </div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <span className="kicker">{mode === 'register' ? 'Create your account' : 'Welcome back'}</span>
          <h2 style={{ marginBottom: '0.4rem' }}>{mode === 'register' ? 'Register' : 'Sign in'}</h2>
          <p className="muted small" style={{ marginBottom: '1.3rem' }}>
            {mode === 'register'
              ? 'A short form — then you go straight to your home page.'
              : 'Sign in to the demo profile saved on this device.'}
          </p>

          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={mode === 'register' ? submitRegister : submitSignIn} noValidate>
            {mode === 'register' && (
              <>
                <label className="field">
                  <span>Full name</span>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Ananya Sharma" autoComplete="name" />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Age <em>18 or above</em></span>
                    <input type="number" min={1} max={120} value={form.age} onChange={set('age')} placeholder="20" />
                  </label>
                  <label className="field">
                    <span>University</span>
                    <input type="text" value={form.university} onChange={set('university')} placeholder="Your university" />
                  </label>
                </div>
              </>
            )}

            <label className="field">
              <span>Email ID</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@university.edu" autoComplete="email" />
            </label>

            <label className="field">
              <span>Password</span>
              <span style={{ position: 'relative', display: 'block' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  style={{ paddingRight: '2.6rem' }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  style={{ position: 'absolute', right: '0.25rem', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {mode === 'register' && (
              <label className="field">
                <span>Confirm password</span>
                <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Type it again" autoComplete="new-password" />
              </label>
            )}

            {mode === 'register' && (
              <>
                <div className="check-row">
                  <input id="terms" type="checkbox" checked={form.terms} onChange={set('terms')} />
                  <label htmlFor="terms">
                    I have read and agree to the{' '}
                    <a href="#terms" onClick={(e) => { e.preventDefault(); setLegal('terms') }}>Terms and Conditions</a> and the{' '}
                    <a href="#privacy" onClick={(e) => { e.preventDefault(); setLegal('privacy') }}>Privacy Notice</a>.
                  </label>
                </div>
                <div className="check-row">
                  <input id="research" type="checkbox" checked={form.research} onChange={set('research')} />
                  <label htmlFor="research">
                    Optional: I agree that my <b>anonymised, de-identified</b> data may be used for wellbeing research. This is separate from the Terms and is not required to use Inner Circle.
                  </label>
                </div>
              </>
            )}

            <button className="btn btn-primary btn-lg btn-block" type="submit">
              {mode === 'register' ? <>Register <ArrowRight size={17} /></> : 'Sign in'}
            </button>
          </form>

          <p className="auth-alt">
            {mode === 'register' ? (
              <>
                Already registered on this device?{' '}
                <a href="#signin" onClick={(e) => { e.preventDefault(); setError(''); setMode('signin') }}>Sign in</a>
                {' · '}
                <button type="button" className="btn btn-ghost btn-sm" onClick={fillDemo} style={{ padding: '0.1rem 0.4rem' }}>
                  Fill demo details
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <a href="#register" onClick={(e) => { e.preventDefault(); setError(''); setMode('register') }}>Create an account</a>
                {profile && (
                  <>
                    {' · '}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/home')} style={{ padding: '0.1rem 0.4rem' }}>
                      Continue as {profile.firstName}
                    </button>
                  </>
                )}
              </>
            )}
          </p>

          <p className="tiny muted center" style={{ marginTop: '1.4rem', display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
            <Lock size={12} /> Demo prototype — no real sensitive data is collected or transmitted.
          </p>
        </div>
      </div>

      {legal === 'terms' && (
        <Modal
          kicker="PLEASE READ"
          title="Terms & Conditions"
          wide
          onClose={() => setLegal(null)}
          footer={<button className="btn btn-primary" onClick={() => setLegal(null)}>I understand</button>}
        >
          <Note tone="mint" icon={Sparkles}>
            Written in plain language on purpose. In short: your information supports <b>you</b>, is never
            sold, and the AI is not a substitute for a professional.
          </Note>
          <div className="legal-scroll" style={{ marginTop: '0.9rem' }}>
            {TERMS_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4>{section.title}</h4>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
            Accepting the Terms is required. Optional research consent is asked separately below the
            checkbox and can be changed later in Settings &amp; Privacy.
          </p>
        </Modal>
      )}

      {legal === 'privacy' && (
        <Modal
          kicker="YOUR DATA"
          title="Privacy Notice"
          wide
          onClose={() => setLegal(null)}
          footer={<button className="btn btn-primary" onClick={() => setLegal(null)}>Close</button>}
        >
          <div className="legal-scroll">
            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4>{section.title}</h4>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
            Contact routes, retention rules and the review of this notice with the Department of
            Psychiatry, Dayananda Sagar University are pending institutional approval.
          </p>
        </Modal>
      )}
    </div>
  )
}
