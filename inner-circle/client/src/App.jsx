import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import {
  Activity, ArrowDownRight, ArrowRight, BarChart3, Bell, BookOpen, CalendarDays, Check,
  ChevronRight, CircleHelp, Compass, Heart, Home, LockKeyhole, LogOut, Menu,
  MessageCircle, Search, Send, ShieldCheck, Sparkles, Users, Wind, X,
} from 'lucide-react'

const tokenKey = 'inner-circle-access'
const aliasKey = 'inner-circle-alias'
const api = async (path, options = {}) => {
  const token = localStorage.getItem(tokenKey)
  const apiBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : ''
  const response = await fetch(`${apiBase}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'We could not complete that request. Please try again.')
  return data
}

const phqQuestions = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way',
]
const gadQuestions = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
]
const answerLabels = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
const severity = (score, isPhq) => {
  if (score <= 4) return 'Minimal'
  if (score <= 9) return 'Mild'
  if (score <= 14) return 'Moderate'
  if (isPhq && score <= 19) return 'Moderately severe'
  return 'Severe'
}

function LanguagePicker() {
  const { i18n } = useTranslation()
  return (
    <label className="language-picker">
      <span className="sr-only">Choose language</span>
      <select value={i18n.language.slice(0, 2)} onChange={event => i18n.changeLanguage(event.target.value)} aria-label="Choose language">
        <option value="en">EN</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option>
      </select>
    </label>
  )
}

function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><Heart size={18} fill="currentColor" /></span><span><b>Inner Circle</b><small>your quiet space to heal</small></span></div>
}

function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <div className="landing-page">
      <header className="landing-nav"><Brand /><div className="landing-nav-actions"><LanguagePicker /><button className="button button-quiet" onClick={() => navigate('/login')}>Login</button><button className="button button-primary" onClick={() => navigate('/register')}>Get started <ArrowRight size={16} /></button></div></header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> A GENTLER WAY TO CHECK IN</span>
            <h1>Your mind matters.<br /><span>Always.</span></h1>
            <p className="landing-tagline">your quiet space to heal</p>
            <p className="hero-description">A private, supportive space for the days that feel light — and the days that don't. Take a breath, check in with yourself, and find support at your own pace.</p>
            <div className="hero-actions"><button className="button button-primary button-large" onClick={() => navigate('/register')}>Create your account <ArrowRight size={18} /></button><button className="button button-quiet button-large" onClick={() => navigate('/about')}>Learn about well-being</button></div>
            <div className="privacy-note"><ShieldCheck size={17} /><span>Your peer identity is anonymous. Your choices stay yours.</span></div>
          </div>
          <div className="landing-visual" aria-label="A gentle reminder to take a mindful pause">
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="visual-note"><span className="note-icon"><Wind size={21} /></span><small>A MOMENT FOR YOU</small><strong>You don't have to<br />figure it all out today.</strong><span className="note-rule" /><span className="note-caption">Breathe in. You are here.</span></div>
            <span className="visual-spark spark-a">✳</span><span className="visual-spark spark-b">✦</span><span className="visual-leaf">❋</span>
          </div>
        </section>
        <section className="how-strip"><div className="section-kicker">A SIMPLE PLACE TO BEGIN</div><h2>Support that meets you where you are.</h2><div className="how-steps"><div><span>01</span><b>Check in</b><p>Reflect on how you have been feeling.</p></div><ChevronRight /><div><span>02</span><b>Understand</b><p>See your screening results, explained simply.</p></div><ChevronRight /><div><span>03</span><b>Find support</b><p>Explore a next step that feels right for you.</p></div></div></section>
      </main>
      <footer className="landing-footer"><div><b>Need immediate help?</b> India: Tele-MANAS <a href="tel:14416">14416</a> · Emergency <a href="tel:112">112</a><small>Please verify support numbers before launch. This platform is not an emergency service.</small></div><div className="footer-links"><button onClick={() => navigate('/privacy')}>Privacy & confidentiality</button><button onClick={() => navigate('/about')}>How it works</button></div></footer>
    </div>
  )
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', studentId: '', college: '', department: '', year: '', password: '' })
  const update = event => setForm({ ...form, [event.target.name]: event.target.value })
  const passwordRules = [form.password.length >= 8, /[A-Za-z]/.test(form.password), /\d/.test(form.password)]
  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api(`/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(isRegister ? form : { email: form.email, password: form.password }),
      })
      localStorage.setItem(tokenKey, result.accessToken)
      localStorage.setItem(aliasKey, result.user.alias)
      navigate(isRegister ? '/onboarding' : '/dashboard')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auth-page">
      <header className="auth-top"><button className="text-brand-button" onClick={() => navigate('/')}><Brand /></button><span>Already have an account? <button className="inline-link" onClick={() => navigate(isRegister ? '/login' : '/register')}>{isRegister ? 'Sign in' : 'Create account'}</button></span></header>
      <main className="auth-card">
        <span className="auth-icon"><Heart size={20} /></span><span className="section-kicker">{isRegister ? 'A SPACE THAT IS YOURS' : 'WELCOME BACK'}</span>
        <h1>{isRegister ? 'Create your account' : 'Sign in to your space'}</h1>
        <p>{isRegister ? 'A few details to get you started. Your peer-facing name will be anonymous.' : 'Pick up where you left off. Your quiet space is here.'}</p>
        <form onSubmit={submit} className="auth-form">
          {isRegister && <div className="field-row"><label>First name<input required name="firstName" value={form.firstName} onChange={update} autoComplete="given-name" /></label><label>Last name<input required name="lastName" value={form.lastName} onChange={update} autoComplete="family-name" /></label></div>}
          <label>Email address<input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" /></label>
          {isRegister && <><label>Student ID <span className="optional">(optional)</span><input name="studentId" value={form.studentId} onChange={update} /></label><div className="field-row"><label>College <span className="optional">(optional)</span><input name="college" value={form.college} onChange={update} /></label><label>Department <span className="optional">(optional)</span><input name="department" value={form.department} onChange={update} /></label></div><label>Year of study <span className="optional">(optional)</span><input name="year" value={form.year} onChange={update} placeholder="e.g. 2nd year" /></label></>}
          <label>Password<div className="password-wrap"><input required type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={update} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
          {isRegister && <div className="password-rules" aria-live="polite">{['At least 8 characters', 'Contains a letter', 'Contains a number'].map((text, index) => <span key={text} className={passwordRules[index] ? 'rule-valid' : ''}><Check size={14} />{text}</span>)}</div>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" disabled={busy || (isRegister && !passwordRules.every(Boolean))}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
        </form>
        <div className="auth-footnote"><LockKeyhole size={14} /> We only collect what is needed to support your account.</div>
      </main>
    </div>
  )
}

function PrivateShell() {
  if (!localStorage.getItem(tokenKey)) return <Navigate to="/login" replace />
  return <AppShell />
}

const baseNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/chat', label: 'AI Chat', icon: MessageCircle },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/forum', label: 'Forum', icon: Users },
]

function useRole() {
  const [role, setRole] = useState(() => localStorage.getItem('inner-circle-role') || 'student')
  useEffect(() => {
    api('/auth/me')
      .then(data => {
        if (data?.user?.role) {
          localStorage.setItem('inner-circle-role', data.user.role)
          if (data.user.alias) localStorage.setItem(aliasKey, data.user.alias)
          setRole(data.user.role)
        }
      })
      .catch(() => { /* token may be missing; the guard will redirect */ })
  }, [])
  return role
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const alias = localStorage.getItem(aliasKey) || 'Harmonious Aurora'
  const role = useRole()
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = [
    ...baseNavItems,
    ...(role === 'professional' || role === 'admin' ? [{ to: '/professional', label: 'Support desk', icon: ShieldCheck }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: BarChart3 }] : []),
    ...(role === 'admin' || role === 'professional' ? [{ to: '/playground', label: 'Fuzzy play', icon: Activity }] : []),
  ]
  const roleLabel = role === 'admin' ? 'Admin' : role === 'professional' ? 'Professional' : role === 'volunteer' ? 'Volunteer' : 'Student · Anonymous'
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* Local sign-out still clears the browser session. */ }
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(aliasKey)
    localStorage.removeItem('inner-circle-role')
    navigate('/')
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand /></div>
        <div className="sidebar-caption">YOUR SPACE</div>
        <nav className="side-nav">{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar-lower"><div className="sidebar-caption">MORE</div><NavLink to="/how-it-works" className="side-link"><Compass size={18} /><span>How it works</span></NavLink><NavLink to="/privacy" className="side-link"><ShieldCheck size={18} /><span>Privacy & safety</span></NavLink><button className="identity-chip" onClick={() => navigate('/settings')}><span className="identity-avatar">{alias.slice(0, 1)}</span><span><b>{alias}</b><small>{roleLabel}</small></span><ChevronRight size={15} /></button></div>
      </aside>
      <div className="workspace">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">{menuOpen ? <X /> : <Menu />}</button><div><b>INNER CIRCLE</b><span>Curated support to meet you where you are.</span></div><div className="topbar-actions"><LanguagePicker /><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button><span className="topbar-alias">{alias}</span><button className="button button-quiet logout-button" onClick={logout}><LogOut size={16} />Logout</button></div></header>
        <main className="page-content" key={location.pathname}><Outlet /></main>
        <nav className="mobile-tabs">{baseNavItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-tab mobile-tab-active' : 'mobile-tab'}><Icon size={19} /><span>{label === 'Appointments' ? 'Book' : label}</span></NavLink>)}</nav>
      </div>
      <button className="help-now" onClick={() => setHelpOpen(true)}><Heart size={16} /> I need help now</button>
      {helpOpen && <SafetyPathway onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

function SafetyPathway({ onClose }) {
  const reported = useRef(false)
  useEffect(() => {
    if (reported.current) return
    reported.current = true
    api('/safety/help-now', { method: 'POST', body: JSON.stringify({ trigger: 'help-now-button' }) }).catch(() => { /* the pathway still shows locally */ })
  }, [])
  return <div className="modal-backdrop" role="presentation"><section className="safety-modal" role="dialog" aria-modal="true" aria-labelledby="safety-title"><button className="modal-close" onClick={onClose} aria-label="Close"><X /></button><span className="safety-icon"><Heart size={22} /></span><span className="section-kicker">YOU DON'T HAVE TO BE ALONE</span><h2 id="safety-title">Let's find support together.</h2><p>If you may be in immediate danger, contact emergency services or someone you trust now. Inner Circle is not an emergency service.</p><div className="crisis-options"><a href="tel:14416"><b>Tele-MANAS</b><span>14416 <small>· India mental-health support</small></span></a><a href="tel:18005990019"><b>KIRAN</b><span>1800-599-0019</span></a><a href="tel:112"><b>Emergency services</b><span>112</span></a></div><div className="verify-note">Please verify support numbers and campus contacts before launch.</div><button className="button button-primary full-width" onClick={onClose}>I'm safe for now — continue</button></section></div>
}

function Dashboard() {
  const alias = localStorage.getItem(aliasKey) || 'Harmonious Aurora'
  const risk = JSON.parse(localStorage.getItem('inner-circle-risk') || 'null')
  const navigate = useNavigate()
  return <div className="page-wrap">
    <div className="dashboard-grid">
      <section className="dashboard-hero"><span className="hero-tag"><Sparkles size={13} /> INNER CIRCLE DASHBOARD</span><h1>Welcome back,<br />{alias}!</h1><p>How are you feeling today? Take a moment to check in, explore calming practices, or reach out to your support circle.</p><div className="hero-actions"><button className="button button-white" onClick={() => navigate('/chat')}>Start mindful chat <ArrowRight size={16} /></button><button className="button button-outline-white" onClick={() => navigate('/appointments')}>Schedule time with a guide</button></div><span className="hero-art-artifact">✳</span></section>
      <section className="mood-card"><div className="mood-heading"><span className="mood-heart"><Heart size={19} /></span><span>MOOD SNAPSHOT</span></div><h2>Take a mindful pause</h2><p>Try a 2-minute breathing reset or share a reflection with your accountability circle.</p><button className="mini-action" onClick={() => navigate('/resources')}><Wind size={17} /><span><b>Breathing reset</b><small>2 min · gentle pace</small></span><ChevronRight size={16} /></button><button className="mini-action" onClick={() => navigate('/check-in')}><Activity size={17} /><span><b>Mood log</b><small>Guided prompts</small></span><ChevronRight size={16} /></button></section>
    </div>
    <div className="section-heading"><div><span className="section-kicker">YOUR WELL-BEING</span><h2>A little check-in, just for you.</h2></div><button className="button button-soft" onClick={() => navigate('/check-in')}>Check in now <ArrowRight size={16} /></button></div>
    <div className="wellbeing-grid"><article className="surface-card wellbeing-main"><div className="card-topline"><div><span className="card-label">CURRENT SCREENING</span><h3>{risk ? `${risk.level} support` : 'Your well-being, at your pace'}</h3></div><span className="gentle-status"><span />{risk ? `Tier ${risk.tier}` : 'Ready when you are'}</span></div><p>{risk ? 'This is a guide to support planning, not a diagnosis.' : 'Your screening results and check-ins will appear here after onboarding.'}</p><div className="progress-metrics"><div><span>PHQ-9</span><b>{risk?.inputs?.phq9 ?? '—'}<small> / 27</small></b><i><em style={{ width: `${risk?.inputs ? risk.inputs.phq9 / 27 * 100 : 12}%` }} /></i></div><div><span>GAD-7</span><b>{risk?.inputs?.gad7 ?? '—'}<small> / 21</small></b><i><em style={{ width: `${risk?.inputs ? risk.inputs.gad7 / 21 * 100 : 12}%` }} /></i></div><div><span>STRESS</span><b>{risk?.inputs?.stress ?? '—'}<small> / 10</small></b><i><em style={{ width: `${risk?.inputs ? risk.inputs.stress * 10 : 12}%` }} /></i></div></div><button className="inline-link" onClick={() => navigate('/onboarding')}>{risk ? 'Review your screening' : 'Start your first check-in'} <ArrowRight size={15} /></button></article><article className="surface-card care-plan"><span className="card-label">YOUR CARE PLAN</span><h3>Small steps, steady support.</h3><p>Your support options adapt to what you share. You remain in control of each next step.</p><div className="care-ladder">{['Self-guided care', 'Peer and AI support', 'Professional support'].map((item, i) => <div key={item} className={risk && risk.tier === i + 1 ? 'care-step care-step-active' : 'care-step'}><span>{i + 1}</span>{item}{risk && risk.tier === i + 1 && <Check size={15} />}</div>)}</div></article></div>
    <div className="section-heading section-heading-tight"><div><span className="section-kicker">QUICK ACTIONS</span><h2>Your mindful control center</h2></div></div>
    <div className="quick-grid">{[[MessageCircle, 'Talk to AI', '/chat', 'A gentle conversation, whenever you need'], [Activity, 'Take a check-in', '/check-in', 'Notice how the week has been'], [Wind, 'Relax', '/resources', 'Breathing, grounding and quiet practices'], [CalendarDays, 'Book support', '/appointments', 'Explore time with a guide'], [BookOpen, 'Explore resources', '/resources', 'Small practices for real life'], [Users, 'Peer circle', '/forum', 'Connect with student volunteers']].map(([Icon, title, path, desc]) => <button className="quick-card" key={title} onClick={() => navigate(path)}><span className="quick-icon"><Icon size={18} /></span><b>{title}</b><small>{desc}</small><ArrowRight className="quick-arrow" size={16} /></button>)}</div>
    <div className="dashboard-footnote"><ShieldCheck size={15} /> Screening helps guide support. It is not a medical diagnosis.</div>
  </div>
}

function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [consent, setConsent] = useState(false)
  const [research, setResearch] = useState(false)
  const [phq, setPhq] = useState(Array(9).fill(null))
  const [difficulty, setDifficulty] = useState(null)
  const [gad, setGad] = useState(Array(7).fill(null))
  const [stress, setStress] = useState(5)
  const [functional, setFunctional] = useState(5)
  const [concerns, setConcerns] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const questions = step === 1 ? phqQuestions : gadQuestions
  const answers = step === 1 ? phq : gad
  const setter = step === 1 ? setPhq : setGad
  const itemIndex = step === 1 ? phq.findIndex(answer => answer === null) : gad.findIndex(answer => answer === null)
  const itemNumber = itemIndex === -1 ? answers.length : itemIndex
  const phqTotal = phq.reduce((sum, value) => sum + (value ?? 0), 0)
  const gadTotal = gad.reduce((sum, value) => sum + (value ?? 0), 0)
  const safetyFlag = phq[8] > 0
  const finish = async () => {
    setError('')
    setLoading(true)
    try {
      const inference = await api('/risk/infer', {
        method: 'POST',
        body: JSON.stringify({
          phq9: phqTotal,
          gad7: gadTotal,
          sentiment: 0,
          stress: Number(stress),
          functional: Number(functional),
          item9Flag: safetyFlag,
        }),
      })
      inference.inputs = { phq9: phqTotal, gad7: gadTotal, stress: Number(stress), functional: Number(functional) }
      setResult(inference)
      localStorage.setItem('inner-circle-risk', JSON.stringify(inference))
      localStorage.setItem('inner-circle-consent', JSON.stringify({ privacy: consent, research, at: new Date().toISOString() }))
      setStep(4)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }
  const toggleConcern = concern => setConcerns(current => current.includes(concern) ? current.filter(item => item !== concern) : [...current, concern])
  if (step === 4 && safetyFlag) return <SafetyPathway onClose={() => navigate('/dashboard')} />
  if (step === 4 && result) return <div className="onboarding-page"><div className="onboarding-result"><span className="section-kicker">ASSESSMENT · RISK ANALYSIS · SUPPORT</span><h1>Your screening summary</h1><p className="onboarding-intro">Thank you for taking a moment to check in. These results can help guide a conversation about support.</p><div className="result-table"><div><b>Screening</b><b>Score</b><b>Range</b></div><div><span>PHQ-9</span><span>{phqTotal} / 27</span><span>{severity(phqTotal, true)}</span></div><div><span>GAD-7</span><span>{gadTotal} / 21</span><span>{severity(gadTotal, false)}</span></div></div><p className="diagnosis-disclaimer">This screening result is not a medical diagnosis.</p><article className="surface-card result-risk"><div className="risk-score"><span>AI-ASSISTED WELL-BEING ASSESSMENT</span><b>{Math.round(result.riskScore)}<small> / 100</small></b><strong>{result.level === 'High' ? 'Extra support recommended' : `${result.level} support`}</strong></div><div className="why-result"><b>Why this result?</b><p>The fuzzy logic-based risk stratification module considers screening responses alongside stress and daily impact. It helps suggest supportive next steps; a human professional makes care decisions.</p>{result.narrative.map(text => <span key={text}><Check size={14} />{text}</span>)}</div></article><button className="button button-primary button-large" onClick={() => navigate('/dashboard')}>Continue to your space <ArrowRight size={17} /></button></div></div>
  return <div className="onboarding-page"><div className="onboarding-top"><Brand /><button className="button button-quiet" onClick={() => navigate('/dashboard')}>Do this later</button></div><div className="onboarding-card"><div className="step-progress"><span>GETTING TO KNOW YOU</span><b>{['Consent', 'PHQ-9', 'GAD-7', 'Well-being'][step]} · {step + 1} of 4</b><i><em style={{ width: `${(step + 1) * 25}%` }} /></i></div>
    {step === 0 && <><span className="section-kicker">A THOUGHTFUL FIRST STEP</span><h1>Let's understand how you're feeling.</h1><p className="onboarding-intro">Before we begin, here's what you can expect from this space.</p><div className="consent-points"><p><ShieldCheck size={17} /> Your identity is shown to other students only as your anonymous alias.</p><p><LockKeyhole size={17} /> Screening responses are stored to support your well-being journey.</p><p><Users size={17} /> A professional may be alerted if you indicate an immediate safety concern.</p><p><CircleHelp size={17} /> You can ask to access or delete your account data.</p></div><label className="consent-check"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /> <span>I have read and agree to the privacy information above. <b>Required</b></span></label><label className="consent-check"><input type="checkbox" checked={research} onChange={event => setResearch(event.target.checked)} /> <span>Allow my de-identified information to be used for research. <small>Optional — you can change this later.</small></span></label><button className="button button-primary button-large" disabled={!consent} onClick={() => setStep(1)}>Continue <ArrowRight size={16} /></button></>}
    {(step === 1 || step === 2) && <><span className="section-kicker">{step === 1 ? 'PHQ-9 · MOOD OVER THE LAST 2 WEEKS' : 'GAD-7 · WORRY OVER THE LAST 2 WEEKS'}</span><h1>{step === 1 ? 'How often have you been bothered by these concerns?' : 'How often have you been bothered by these concerns?'}</h1><p className="onboarding-intro">Please indicate how often you have been bothered by the following concerns.</p>{itemIndex >= 0 ? <><div className="question-counter">QUESTION {itemNumber + 1} OF {questions.length}</div><article className="question-card"><span>{questions[itemIndex]}</span><div className="answer-options">{answerLabels.map((label, score) => <button key={label} aria-pressed={answers[itemIndex] === score} className={answers[itemIndex] === score ? 'answer-pill answer-selected' : 'answer-pill'} onClick={() => setter(answers.map((value, i) => i === itemIndex ? score : value))}>{label}</button>)}</div></article></> : <div className="complete-note"><Check size={17} /> All questions answered.</div>}{step === 1 && itemIndex === -1 && difficulty === null && <div className="difficulty-prompt"><b>How difficult have these concerns made it to do your work, take care of things at home, or get along with other people?</b><div className="answer-options">{['Not difficult', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'].map((label, i) => <button key={label} className="answer-pill" onClick={() => setDifficulty([0, 3, 7, 10][i])}>{label}</button>)}</div></div>}<div className="onboarding-controls"><button className="button button-quiet" onClick={() => setStep(Math.max(0, step - 1))}>Back</button>{error && <span role="alert" className="form-error">{error}</span>}{itemIndex === -1 && (step !== 1 || difficulty !== null) && <button className="button button-primary" onClick={() => step === 1 ? setStep(2) : setStep(3)}>Continue <ArrowRight size={16} /></button>}</div></>}
    {step === 3 && <><span className="section-kicker">A FEW MORE DETAILS</span><h1>Your well-being, in your words.</h1><p className="onboarding-intro">These optional questions help tailor your support plan.</p><label className="range-field">Stress level <b>{stress} / 10</b><input type="range" min="1" max="10" value={stress} onChange={event => setStress(event.target.value)} /></label><label className="range-field">How much is this affecting your daily activities? <b>{functional} / 10</b><input type="range" min="0" max="10" value={functional} onChange={event => setFunctional(event.target.value)} /></label><div className="concern-picker"><b>What has been on your mind? <small>(optional)</small></b><div>{['Stress', 'Anxiety', 'Loneliness', 'Academic pressure', 'Relationships', 'Sleep', 'Burnout', 'Other'].map(item => <button key={item} onClick={() => toggleConcern(item)} className={concerns.includes(item) ? 'topic-chip topic-chip-active' : 'topic-chip'}>{item}</button>)}</div></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="onboarding-controls"><button className="button button-quiet" onClick={() => setStep(2)}>Back</button><button className="button button-primary" onClick={finish} disabled={loading}>{loading ? 'Preparing your summary…' : 'See my summary'} <ArrowRight size={16} /></button></div></>}
  </div><div className="onboarding-note"><ShieldCheck size={15} /> Your answers are private and used to guide supportive next steps.</div></div>
}

function ChatPage() {
  const [messages, setMessages] = useState([{ from: 'assistant', text: "Hello! I'm here to provide emotional support and coping strategies. How are you feeling today? You can share what's on your mind, and I'll do my best to help." }])
  const [value, setValue] = useState('')
  const [crisis, setCrisis] = useState(false)
  const [typing, setTyping] = useState(false)
  const send = async message => {
    const text = (message ?? value).trim()
    if (!text) return
    setMessages(items => [...items, { from: 'student', text }])
    setValue('')
    setTyping(true)
    const fallback = () => {
      const lower = text.toLowerCase()
      return lower.includes('anxious') || lower.includes('worr') || lower.includes('overwhelm')
        ? "It sounds like a lot is asking for your attention right now. We can take this one small moment at a time.\n\n**Try a grounding pause:**\n1. Name 5 things you can see.\n2. Notice 4 things you can feel.\n3. Listen for 3 sounds around you.\n\nWould it help to talk about one worry in particular?"
        : lower.includes('sleep') ? "A busy mind can make rest feel far away. If it feels comfortable, try a slow exhale that's a little longer than your inhale.\n\nWhat have evenings been like for you lately?"
          : "Thank you for sharing that with me. It makes sense that this is on your mind. You don't have to solve everything at once — would you like to tell me a little more about what feels most important right now?"
    }
    try {
      const data = await api('/chat', { method: 'POST', body: JSON.stringify({ message: text }) })
      setMessages(items => [...items, { from: 'assistant', text: data.reply || fallback() }])
      if (data.crisis?.isCrisis) setCrisis(true)
    } catch {
      setMessages(items => [...items, { from: 'assistant', text: fallback() }])
    } finally {
      setTyping(false)
    }
  }
  const quickReplies = ['I need a calming exercise', 'Feeling overwhelmed', 'Motivation boost', 'Sleep issues']
  return <div className="page-wrap chat-page"><div className="page-heading"><div><span className="section-kicker">A SUPPORTIVE SPACE</span><h1>Mindful chat</h1><p>Share what's on your mind. We'll take it one step at a time.</p></div><span className="gentle-status"><span /> Listening now</span></div><section className="chat-card"><div className="chat-header"><span className="chat-avatar"><Sparkles size={20} /></span><div><b>Inner Circle Guide</b><small><i /> Listening now · AI support, not clinical care</small></div><span className="risk-badge">Risk: {JSON.parse(localStorage.getItem('inner-circle-risk') || 'null')?.level || 'Not assessed'}</span><button className="button button-quiet" onClick={() => setMessages([{ from: 'assistant', text: 'Thank you for taking a moment for yourself. Before you go, what is one feeling you are leaving with?' }])}>End chat</button></div><div className="message-list">{messages.map((message, index) => <div className={`message-row ${message.from === 'student' ? 'message-row-user' : ''}`} key={`${message.from}-${index}`}><div className={`message-bubble ${message.from === 'student' ? 'message-user' : 'message-assistant'}`}>{message.from === 'assistant' ? <ReactMarkdown>{message.text}</ReactMarkdown> : message.text}<time>Just now</time></div></div>)}{typing && <div className="typing-indicator">Inner Circle is thinking gently…</div>}</div><div className="quick-replies">{quickReplies.map(chip => <button key={chip} onClick={() => send(chip)}>{chip}</button>)}</div><form className="chat-input" onSubmit={event => { event.preventDefault(); send() }}><input aria-label="Type your message" value={value} onChange={event => setValue(event.target.value)} placeholder="Type your message…" /><button className="send-button" aria-label="Send message"><Send size={18} /></button></form></section><p className="dashboard-footnote"><ShieldCheck size={15} /> AI can make mistakes. This chat is not a diagnosis or a substitute for professional support.</p>{crisis && <SafetyPathway onClose={() => setCrisis(false)} />}</div>
}

const resourceGroups = [
  { title: 'Relaxation Guides', description: 'Guided breathing, mindfulness scripts, and grounding routines to help you reset.', icon: Wind, tags: ['Stress', 'Anxiety'], items: [['Guided breathing audio set', 'Follow immersive breathing sessions curated by Inner Circle mentors.'], ['Mindful moments journal prompts', 'Download prompts that anchor your reflections in calm and gratitude.']] },
  { title: 'Music Therapy', description: 'Curated soundscapes and playlists matched to mood, focus, and relaxation goals.', icon: Heart, tags: ['Sleep', 'Focus'], items: [['Lo-fi focus sessions', 'Hand-picked beats to help you stay grounded while you study or create.'], ['Sleep & unwind melodies', 'Gentle ambient tracks to calm the nervous system before bedtime.'], ['Confidence boosting affirmations', 'Daily mantras voiced by therapists to reinforce self-belief.']] },
  { title: 'Gamified Activities', description: 'Interactive challenges that build resilience, gratitude, and emotional regulation skills.', icon: Sparkles, tags: ['Self-esteem', 'Stress'], items: [['Zen puzzle flow', 'Play a calming block puzzle that encourages steady breathing and focus.'], ['Affirmation typing quest', 'Type uplifting words to guide your character through a mindful adventure.'], ['Gratitude badge builder', 'Earn digital badges by completing quick gratitude quests and reflection prompts.']] },
  { title: 'Mini Library', description: 'Short reads, printable worksheets, and expert-backed toolkits for your mental wellness journey.', icon: BookOpen, tags: ['Academic pressure', 'Relationships'], items: [['How We Learn — Benedict Carey', 'A friendly read about learning, memory, and finding study approaches that work for you.'], ['Atomic Habits — James Clear', 'Small, practical ideas for making helpful routines easier to begin.'], ['Self-Compassion — Dr. Kristin Neff', 'An introduction to treating yourself with the kindness you offer a friend.']] },
]

function Resources() {
  const [query, setQuery] = useState('')
  const [activity, setActivity] = useState(null)
  const [saved, setSaved] = useState([])
  const filtered = useMemo(() => resourceGroups.filter(group => `${group.title} ${group.description} ${group.tags.join(' ')} ${group.items.map(item => item.join(' ')).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <div className="page-wrap"><div className="page-heading"><div><span className="section-kicker">A LITTLE SUPPORT, WHEN YOU NEED IT</span><h1>Wellness resources</h1><p>Small, thoughtful practices for the moments in between.</p></div></div><div className="resource-tools"><div className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search guided practices, playlists, worksheets…" /></div><div className="resource-tags">{['Anxiety', 'Depression', 'Stress', 'Academic pressure', 'Relationships', 'Sleep', 'Self-esteem', 'Exam stress'].map(tag => <button key={tag} onClick={() => setQuery(tag)}>{tag}</button>)}</div></div><div className="resource-grid">{filtered.map(group => <article className="resource-card surface-card" key={group.title}><div className="resource-card-header"><span className="resource-icon"><group.icon size={21} /></span><div><h2>{group.title}</h2><p>{group.description}</p></div></div><div className="resource-links">{group.items.map(([title, desc]) => <div key={title} className="resource-item"><ExternalItem title={title} description={desc} /></div>)}</div><div className="resource-actions"><button className="button button-primary button-small" onClick={() => setActivity(group.items[0][0])}>Try now</button><button className="button button-quiet button-small" onClick={() => setSaved(current => current.includes(group.title) ? current.filter(item => item !== group.title) : [...current, group.title])}>{saved.includes(group.title) ? <Check size={15} /> : <BookOpen size={15} />}{saved.includes(group.title) ? 'Saved' : 'Save for later'}</button></div><details className="why-resource"><summary>Why am I seeing this?</summary><p>This resource is here as an optional way to explore {group.tags.join(' or ').toLowerCase()} support. Choose what feels useful for you.</p></details></article>)}</div>{filtered.length === 0 && <div className="empty-state">No resources match that search yet. Try another topic.</div>}{activity && <div className="modal-backdrop"><section className="activity-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setActivity(null)} aria-label="Close"><X /></button><span className="activity-modal-icon"><Wind /></span><span className="section-kicker">A MOMENT FOR YOU</span><h2>{activity}</h2><p>Take one comfortable breath in, and let the exhale be slow and easy. Notice the support beneath you. There is nowhere else you need to be for this moment.</p><button className="button button-primary" onClick={() => setActivity(null)}>Done for now <Check size={16} /></button></section></div>}</div>
}

function ExternalItem({ title, description }) { return <><div className="resource-item-title"><b>{title}</b><ArrowRight size={14} /></div><p>{description}</p></> }

function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const book = event => {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const date = data.get('date')
    const time = data.get('time')
    if (date < today) { setError('Please choose a date that is today or later.'); return }
    if (appointments.some(item => item.date === date && item.time === time && item.counselor === data.get('counselor') && item.status !== 'cancelled')) { setError('That time is already booked with this guide. Please choose another slot.'); return }
    setAppointments(items => [...items, { id: Date.now(), counselor: data.get('counselor'), date, time, type: data.get('type'), mode: data.get('mode'), status: 'confirmed' }])
    setOpen(false)
    setNotice('Appointment booked')
    window.setTimeout(() => setNotice(''), 2500)
  }
  const cancel = id => { setAppointments(items => items.map(item => item.id === id ? { ...item, status: 'cancelled' } : item)); setNotice('Appointment cancelled'); window.setTimeout(() => setNotice(''), 2500) }
  return <div className="page-wrap"><div className="page-heading"><div><span className="section-kicker">SUPPORT, AT YOUR PACE</span><h1>Appointments</h1><p>Explore a conversation with a guide who can support you.</p></div><button className="button button-primary" onClick={() => setOpen(true)}>+ Book appointment</button></div><div className="stats-grid">{[['Total appointments', appointments.length], ['Upcoming', appointments.filter(item => item.status === 'confirmed').length], ['Completed', 0], ['Online', appointments.filter(item => item.mode === 'Online').length]].map(([label, value]) => <article className="surface-card stat-card" key={label}><span>{label}</span><b>{value}</b></article>)}</div><section className="surface-card appointment-list"><div className="card-topline"><div><span className="card-label">YOUR APPOINTMENTS</span><h2>Time set aside for you</h2></div><button className="button button-quiet">Filter <ArrowDownRight size={15} /></button></div>{appointments.length === 0 ? <div className="empty-state"><span className="empty-icon"><CalendarDays /></span><b>No appointments yet</b><p>When you book time with a guide, the details will show up here.</p><button className="button button-soft" onClick={() => setOpen(true)}>Explore available times</button></div> : appointments.map(item => <div className="appointment-row" key={item.id}><span className="guide-avatar">{item.counselor.split(' ').slice(-1)[0][0]}</span><div className="appointment-main"><b>{item.counselor}</b><span>{item.date} · {item.time} · 45 min</span><div><i className={`appointment-status ${item.status}`} />{item.status} <span className="appointment-type">{item.type}</span> · {item.mode}</div></div><button className="button button-quiet" disabled={item.status === 'cancelled'} onClick={() => cancel(item.id)}>{item.status === 'cancelled' ? 'Cancelled' : 'Cancel'}</button></div>)}</section>{notice && <div className="toast-note">{notice}</div>}{open && <div className="modal-backdrop"><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><button className="modal-close" onClick={() => setOpen(false)} aria-label="Close"><X /></button><span className="section-kicker">BOOK NEW APPOINTMENT</span><h2 id="booking-title">Make a little room for support.</h2><form onSubmit={book} className="booking-form"><label>Guide<select name="counselor"><option>Dr. Sarah Johnson</option><option>Dr. Michael Chen</option></select></label><div className="field-row"><label>Date<input name="date" type="date" min={today} required /></label><label>Time<select name="time"><option>10:00 AM</option><option>11:30 AM</option><option>2:00 PM</option><option>3:30 PM</option></select></label></div><div className="field-row"><label>Type<select name="type"><option>Individual</option><option>Follow-up</option><option>Group</option></select></label><label>Location<select name="mode"><option>Online</option><option>Office</option></select></label></div><label>Anything you'd like us to know? <span className="optional">(optional)</span><textarea name="notes" placeholder="Share any preferences or concerns…" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="booking-actions"><button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary">Book appointment</button></div></form></section></div>}</div>
}

function Forum() {
  const [posts, setPosts] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const alias = localStorage.getItem(aliasKey) || 'Harmonious Aurora'
  useEffect(() => {
    api('/forum/posts').then(data => setPosts(data.posts)).catch(() => setPosts([]))
  }, [])
  const post = event => {
    event.preventDefault()
    if (!message.trim()) return
    setPosts(items => [{ id: String(Date.now()), authorAlias: alias, body: message.trim(), room: 'General', createdAt: new Date().toISOString() }, ...(items || [])])
    setMessage('')
    setError('')
  }
  return <div className="page-wrap"><section className="forum-hero"><span className="hero-tag"><ShieldCheck size={14} /> VERIFIED STUDENT VOLUNTEERS</span><h1>Find a supporter who aligns with your needs.</h1><p>Browse by name, specialization, or availability to match with psychology students trained in peer support.</p><div className="hero-actions"><button className="button button-white">Start volunteer chat <MessageCircle size={16} /></button><button className="button button-outline-white">Explore all rooms <ArrowRight size={16} /></button></div></section><div className="section-heading"><div><span className="section-kicker">A COMMUNITY THAT LISTENS</span><h2>How peer support works</h2></div></div><div className="support-steps">{[['Connect', 'Browse and select a peer supporter who matches your needs.'], ['Talk', 'Confidential conversations via chat, voice, or video.'], ['Grow', 'Receive guidance, grounding routines, and practical coping strategies.']].map(([title, desc], i) => <article className="surface-card support-step" key={title}><span>0{i + 1}</span><b>{title}</b><p>{desc}</p></article>)}</div><div className="section-heading section-heading-tight"><div><span className="section-kicker">ANONYMOUS COMMUNITY BOARD</span><h2>Share a little, if you'd like.</h2></div></div><form className="post-composer surface-card" onSubmit={post}><label htmlFor="forum-post">What's on your mind today?</label><textarea id="forum-post" value={message} onChange={event => setMessage(event.target.value)} placeholder="Your post will appear under your anonymous alias…" /><div><span>Posting as <b>{alias}</b></span><button className="button button-primary button-small">Share with the circle <Send size={15} /></button></div>{error && <p className="form-error">{error}</p>}</form><div className="forum-posts">{(posts || []).map(item => <article className="surface-card forum-post" key={item.id}><div><span className="identity-avatar">{item.authorAlias?.[0] || 'A'}</span><span><b>{item.authorAlias}</b><small>{item.room} · community post</small></span><button className="report-link" onClick={() => setError('Thank you. A moderator will review this post.')}>Report</button></div><p>{item.body}</p><button className="reaction-button">♡ Support <span>0</span></button></article>)}</div>{posts === null && <div className="empty-state">Loading community posts…</div>}</div>
}

function CheckIn() {
  const [mood, setMood] = useState('')
  const [stress, setStress] = useState(5)
  const [done, setDone] = useState(false)
  return <div className="page-wrap narrow-page"><div className="page-heading"><div><span className="section-kicker">A SMALL MOMENT OF NOTICE</span><h1>How have you been feeling this week?</h1><p>No right or wrong answer. Choose what feels closest for you.</p></div></div>{done ? <div className="surface-card checkin-done"><span className="auth-icon"><Check /></span><h2>Thank you for checking in.</h2><p>You took a moment to notice how things have been. That matters.</p><button className="button button-primary" onClick={() => setDone(false)}>Check in again</button></div> : <section className="surface-card checkin-card"><div className="mood-choices">{[['😊', 'Good'], ['😐', 'Okay'], ['😟', 'Stressed'], ['😔', 'Low'], ['😣', 'Overwhelmed']].map(([emoji, text]) => <button key={text} className={mood === text ? 'mood-choice mood-choice-active' : 'mood-choice'} onClick={() => setMood(text)}><span>{emoji}</span>{text}</button>)}</div><label className="range-field">Stress level <b>{stress} / 10</b><input type="range" min="1" max="10" value={stress} onChange={event => setStress(event.target.value)} /></label><label className="booking-form">Anything else you'd like to note? <textarea placeholder="Optional — one line is enough." /></label><button className="button button-primary" disabled={!mood} onClick={() => setDone(true)}>Save check-in <ArrowRight size={16} /></button></section>}</div>
}

function HowItWorks() {
  return <div className="page-wrap"><div className="page-heading"><div><span className="section-kicker">TRANSPARENT BY DESIGN</span><h1>How Inner Circle makes decisions</h1><p>Screening → risk analysis → supportive options → human review where needed.</p></div></div><div className="architecture-grid">{[['Your check-in', 'PHQ-9 · GAD-7 · mood · stress'], ['Understanding signals', 'Sentiment · fuzzy inference · trends'], ['Support options', 'Self-guided · peer · professional'], ['Follow-up', 'Periodic check-ins · human review']].map(([title, detail], i) => <article className="surface-card architecture-step" key={title}><span>0{i + 1}</span><h2>{title}</h2><p>{detail}</p>{i < 3 && <ArrowRight className="architecture-arrow" />}</article>)}</div><div className="surface-card research-positioning"><span className="section-kicker">RESEARCH POSITIONING</span><p>Validated psychological screening (PHQ-9 / GAD-7) + <b>fuzzy risk inference</b> + NLP-based conversational analysis + risk-adaptive intervention + continuous monitoring + human-in-the-loop professional support.</p><small>Screening supports conversations; it does not diagnose. The research system requires clinical review and institutional approval before deployment.</small></div></div>
}

function Privacy() {
  return <div className="page-wrap narrow-page"><div className="page-heading"><div><span className="section-kicker">YOUR TRUST MATTERS</span><h1>Security & privacy</h1><p>Support works best when expectations are clear.</p></div></div><div className="privacy-cards">{[['Your peer identity', 'Students see your anonymous alias rather than your real name or email.'], ['Your choices', 'Research participation is optional. Ask to access or delete your account data.'], ['Limits to privacy', 'If a safety concern is identified, a trained professional may be notified so support can be offered.'], ['AI support', 'AI can be wrong. It offers supportive information, not diagnosis, treatment or emergency response.']].map(([title, body]) => <article className="surface-card privacy-card" key={title}><ShieldCheck size={19} /><div><b>{title}</b><p>{body}</p></div></article>)}</div><div className="verify-note">Before a real-world launch, complete a security review, confirm data retention settings, verify crisis resources, and obtain institutional and clinical approvals.</div></div>
}

function Settings() {
  const alias = localStorage.getItem(aliasKey) || 'Harmonious Aurora'
  const [note, setNote] = useState('')
  return <div className="page-wrap narrow-page"><div className="page-heading"><div><span className="section-kicker">YOUR ACCOUNT</span><h1>Settings</h1><p>Manage your privacy and anonymous identity.</p></div></div><section className="surface-card settings-card"><span className="card-label">PEER IDENTITY</span><h2>{alias}</h2><p>This is the name other students see. Alias changes are limited to three times in a 30-day period.</p><button className="button button-soft" onClick={() => setNote('Alias updates will be available when the account settings API is connected.')}>Change alias</button>{note && <p className="settings-note">{note}</p>}</section><section className="surface-card settings-card"><span className="card-label">YOUR DATA</span><h2>Access and deletion</h2><p>You can request an export or deletion of your account information.</p><button className="button button-quiet" onClick={() => setNote('For this demo, please contact your institution to request an export or deletion.')}>Request my data</button></section></div>
}

function FuzzyPlayground() {
  const [values, setValues] = useState({ phq9: 8, gad7: 6, sentiment: -0.4, stress: 7, functional: 5 })
  const [output, setOutput] = useState(null)
  const [error, setError] = useState('')
  const run = async () => {
    setError('')
    try { setOutput(await api('/risk/infer', { method: 'POST', body: JSON.stringify(values) })) }
    catch (runError) { setError(runError.message) }
  }
  return <div className="page-wrap"><div className="page-heading"><div><span className="section-kicker">RESEARCH / DEMO MODE</span><h1>Fuzzy logic playground</h1><p>Explore how different inputs influence the inspectable Mamdani inference result.</p></div></div><div className="playground-grid"><section className="surface-card sliders-card">{[['phq9', 'PHQ-9 total', 0, 27, 1], ['gad7', 'GAD-7 total', 0, 21, 1], ['sentiment', 'Recent sentiment', -1, 1, 0.1], ['stress', 'Stress level', 1, 10, 1], ['functional', 'Functional impact', 0, 10, 1]].map(([key, label, min, max, step]) => <label className="range-field" key={key}>{label}<b>{values[key]}</b><input type="range" min={min} max={max} step={step} value={values[key]} onChange={event => setValues({ ...values, [key]: Number(event.target.value) })} /></label>)}<button className="button button-primary" onClick={run}>Run inference <Activity size={16} /></button>{error && <p className="form-error">{error}</p>}</section>{output ? <section className="surface-card playground-result"><span className="card-label">INFERENCE RESULT</span><div className="playground-score">{Math.round(output.riskScore)}<small> / 100</small></div><h2>{output.level} · Tier {output.tier}</h2><p>Screening is not a diagnosis. This output is for research demonstration.</p><h3>Fired rules</h3>{output.firedRules.map(rule => <div className="fired-rule" key={rule.id}><b>{rule.id}</b><span>{rule.text}</span><small>{Math.round(rule.strength * 100)}%</small></div>)}<details><summary>Membership values</summary><pre>{JSON.stringify(output.memberships, null, 2)}</pre></details></section> : <section className="surface-card playground-placeholder"><BarChart3 size={26} /><h2>Your model output will appear here.</h2><p>Try the reference example values and run an inference.</p><button className="button button-soft" onClick={run}>Run reference example</button></section>}</div></div>
}

function ProfessionalDashboard() {
  const [students, setStudents] = useState([])
  const [queue, setQueue] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api('/pro/students'), api('/pro/review-queue')])
      .then(([s, q]) => { setStudents(s.students); setQueue(q.queue) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])
  const review = async (id, decision) => {
    setError('')
    try {
      await api(`/pro/review/${id}`, { method: 'POST', body: JSON.stringify({ decision }) })
      setQueue(items => items.filter(item => item.id !== id))
    } catch (err) { setError(err.message) }
  }
  const openTrend = async id => {
    setError('')
    try { setDetail(await api(`/pro/students/${id}/trend`)) } catch (err) { setError(err.message) }
  }
  const flagged = students.filter(item => item.flagged).length
  return <div className="page-wrap">
    <div className="page-heading"><div><span className="section-kicker">HUMAN-IN-THE-LOOP SUPPORT</span><h1>Professional support desk</h1><p>AI assists with signals. Trained professionals make support decisions.</p></div><button className="button button-quiet" onClick={() => window.location.reload()}>Refresh</button></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="stats-grid">{[['Assigned students', students.length], ['Open reviews', queue.length], ['Flagged', flagged]].map(([label, value]) => <article className="surface-card stat-card" key={label}><span>{label}</span><b>{value}</b></article>)}</div>
    <div className="section-heading section-heading-tight"><div><span className="section-kicker">AI REVIEW QUEUE</span><h2>Items needing a human decision</h2></div></div>
    <section className="surface-card appointment-list">{queue.length === 0 ? <div className="empty-state"><ShieldCheck size={22} /><b>Nothing waiting for review.</b><p>Escalations appear here for confirmation, adjustment or dismissal.</p></div> : queue.map(item => <div className="appointment-row" key={item.id}><span className="guide-avatar">{(item.alias || 'A').slice(0, 1)}</span><div className="appointment-main"><b>{item.alias}</b><span>{item.summary}</span><div><i className={`appointment-status ${item.severity === 'high' ? 'cancelled' : 'confirmed'}`} />{item.source} · {item.severity} · {new Date(item.createdAt).toLocaleDateString()}</div></div><div className="appointment-actions"><button className="button button-soft button-small" onClick={() => review(item.id, 'confirmed')}>Confirm</button><button className="button button-quiet button-small" onClick={() => review(item.id, 'dismissed')}>Dismiss</button></div></div>)}</section>
    <div className="section-heading section-heading-tight"><div><span className="section-kicker">ASSIGNED STUDENTS</span><h2>Anonymous records</h2></div></div>
    <section className="surface-card appointment-list">{loading ? <div className="empty-state">Loading…</div> : students.map(student => <div className="appointment-row" key={student.id}><span className="guide-avatar">{student.alias.slice(0, 1)}</span><div className="appointment-main"><b>{student.alias}</b><span>Tier {student.tier ?? '—'} · {student.level} · risk {student.riskScore != null ? Math.round(student.riskScore) : '—'}{student.trend ? ` · ${student.trend}` : ''}</span>{student.flagged && <div><i className="appointment-status cancelled" />flagged for review</div>}</div><button className="button button-quiet button-small" onClick={() => openTrend(student.id)}>View trace</button></div>)}</section>
    {detail && <div className="modal-backdrop" role="presentation"><section className="modal-card surface-card" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setDetail(null)} aria-label="Close"><X /></button><span className="section-kicker">FIRED-RULE TRACE</span><h2>{detail.student.alias}</h2>{detail.latest && <p>Latest risk {Math.round(detail.latest.riskScore)} / 100 · Tier {detail.latest.tier} · {detail.latest.level}</p>}<div className="fired-rules">{detail.firedRules.map(rule => <div className="fired-rule" key={rule.id}><b>{rule.id}</b><span>{rule.text}</span><small>{Math.round(rule.strength * 100)}%</small></div>)}</div><h3>Plain-language narrative</h3><ul>{detail.narrative.map(text => <li key={text}>{text}</li>)}</ul></section></div>}
  </div>
}

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [audit, setAudit] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api('/admin/analytics'), api('/admin/audit?limit=20')])
      .then(([a, b]) => { setAnalytics(a); setAudit(b.audit) })
      .catch(err => setError(err.message))
  }, [])
  if (error) return <div className="page-wrap narrow-page"><p role="alert" className="form-error">{error}</p></div>
  if (!analytics) return <div className="page-wrap narrow-page"><div className="empty-state">Loading analytics…</div></div>
  const t = analytics.totals
  const kpis = [['Registered students', t.registeredStudents], ['Assessments completed', t.assessmentsCompleted], ['Check-ins completed', t.checkInsCompleted], ['Risk inferences', t.riskInferences], ['Open reviews', t.openReviews], ['Appointments', analytics.appointmentStats.total]]
  return <div className="page-wrap">
    <div className="page-heading"><div><span className="section-kicker">AGGREGATED VIEW · k ≥ {analytics.minCellSize}</span><h1>Admin overview</h1><p>Anonymized analytics. Groups smaller than {analytics.minCellSize} are suppressed.</p></div></div>
    <div className="stats-grid">{kpis.map(([label, value]) => <article className="surface-card stat-card" key={label}><span>{label}</span><b>{value}</b></article>)}</div>
    <div className="wellbeing-grid">
      <article className="surface-card wellbeing-main"><span className="card-label">RISK DISTRIBUTION</span><h3>Screening tiers</h3><div className="progress-metrics">{analytics.riskDistribution.map(bucket => <div key={bucket.level}><span>{bucket.level}</span><b>{bucket.suppressed ? '—' : bucket.count ?? 0}<small> · {bucket.percent}%</small></b><i><em style={{ width: `${bucket.percent}%` }} /></i></div>)}</div>{analytics.riskDistribution.some(b => b.suppressed) && <p className="settings-note">Cells below {analytics.minCellSize} are suppressed to protect privacy.</p>}</article>
      <article className="surface-card care-plan"><span className="card-label">PEER SUPPORT</span><h3>Community activity</h3><div className="progress-metrics"><div><span>Posts</span><b>{analytics.peerSupport.posts}</b></div><div><span>Reactions</span><b>{analytics.peerSupport.reactions}</b></div><div><span>Hidden for safety</span><b>{analytics.peerSupport.hiddenForSafety}</b></div></div></article>
    </div>
    <div className="section-heading section-heading-tight"><div><span className="section-kicker">WEEKLY TREND</span><h2>Last four weeks</h2></div></div>
    <section className="surface-card appointment-list">{analytics.weeklyTrend.map(week => <div className="appointment-row" key={week.label}><span className="guide-avatar">{week.label}</span><div className="appointment-main"><b>Avg risk {week.avgRisk}</b><span>{week.assessments} assessments · {week.checkIns} check-ins</span></div></div>)}</section>
    <div className="section-heading section-heading-tight"><div><span className="section-kicker">MOST COMMON CONCERNS</span><h2>By community room</h2></div></div>
    <section className="surface-card appointment-list">{analytics.commonConcerns.map(item => <div className="appointment-row" key={item.concern}><div className="appointment-main"><b>{item.concern}</b><span>{item.channel.suppressed ? 'suppressed' : `${item.channel.count ?? 0} posts`}</span></div></div>)}</section>
    <div className="section-heading section-heading-tight"><div><span className="section-kicker">AUDIT LOG</span><h2>Recent admin & professional actions</h2></div></div>
    <section className="surface-card appointment-list">{audit.length === 0 ? <div className="empty-state">No audit entries yet.</div> : audit.map(entry => <div className="appointment-row" key={entry.id}><span className="guide-avatar">{(entry.role || 'S').slice(0, 1).toUpperCase()}</span><div className="appointment-main"><b>{entry.action}</b><span>{entry.resource}</span><div>{entry.role} · {new Date(entry.ts).toLocaleString()}{entry.targetUserId ? ' · student-linked' : ''}</div></div></div>)}</section>
    <div className="dashboard-footnote"><ShieldCheck size={15} /> Individual student records are not shown in the aggregate analytics view.</div>
  </div>
}

function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route element={<PrivateShell />}>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/check-in" element={<CheckIn />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/playground" element={<FuzzyPlayground />} />
      <Route path="/professional" element={<ProfessionalDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Route>
    <Route path="/about" element={<HowItWorks />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default App
