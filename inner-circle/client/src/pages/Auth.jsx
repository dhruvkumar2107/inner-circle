import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, User } from 'lucide-react'
import { api, setSession } from '../lib/api'
import { Brand, ErrorBanner, LandscapeArt } from '../components/common'

const demoAccounts = [
  { label: 'Student (moderate)', email: 'moderate@demo.innercircle.test' },
  { label: 'Student (high support)', email: 'high@demo.innercircle.test' },
  { label: 'Counsellor', email: 'sarah@demo.innercircle.test' },
  { label: 'Admin', email: 'admin@demo.innercircle.test' },
]

export default function Auth({ mode = 'login' }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isLogin = mode === 'login'
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', college: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = key => event => setForm(value => ({ ...value, [key]: event.target.value }))

  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const body = isLogin
        ? { email: form.email, password: form.password }
        : { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, ...(form.college ? { college: form.college } : {}) }
      const data = await api(`/auth/${isLogin ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify(body) })
      setSession(data)
      navigate(isLogin ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = email => setForm(value => ({ ...value, email, password: 'DemoPass123' }))

  return (
    <div className="auth-page">
      <aside className="auth-art">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back home</Link>
        <Brand light />
        <h2>You're not meant to carry it all alone.</h2>
        <p>Create a private, anonymous space that adapts to how you feel — and connects you to real people when you need them.</p>
        <LandscapeArt className="auth-landscape" />
      </aside>

      <main className="auth-card-wrap">
        <form className="auth-card" onSubmit={submit}>
          <span className="kicker">{isLogin ? 'WELCOME BACK' : 'JOIN INNER CIRCLE'}</span>
          <h1>{isLogin ? t('auth.login') : t('auth.register')}</h1>
          <p className="auth-sub">{isLogin ? 'Sign in to pick up where you left off.' : 'A few details — then we keep you anonymous.'}</p>

          <ErrorBanner message={error} />

          {!isLogin && (
            <div className="field-row">
              <label className="field"><span><User size={14} /> First name</span><input value={form.firstName} onChange={update('firstName')} required maxLength={60} autoComplete="given-name" /></label>
              <label className="field"><span><User size={14} /> Last name</span><input value={form.lastName} onChange={update('lastName')} required maxLength={60} autoComplete="family-name" /></label>
            </div>
          )}

          <label className="field"><span><Mail size={14} /> College email</span><input type="email" value={form.email} onChange={update('email')} required autoComplete="email" placeholder="you@college.edu" /></label>

          {!isLogin && (
            <label className="field"><span><Leaf size={14} /> College <em>(optional)</em></span><input value={form.college} onChange={update('college')} maxLength={120} placeholder="Demo Institute of Technology" /></label>
          )}

          <label className="field">
            <span><Lock size={14} /> Password</span>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Your password' : 'At least 8 characters with a number'}
              />
              <button type="button" className="icon-button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button className="btn btn-primary btn-lg full" disabled={busy}>
            {busy ? 'Just a moment…' : isLogin ? 'Sign in' : 'Create my account'} {!busy && <ArrowRight size={18} />}
          </button>

          <p className="auth-switch">
            {isLogin ? <>New to Inner Circle? <Link to="/register">Create an account</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}
          </p>

          {isLogin && (
            <div className="demo-hint">
              <b>Demo accounts</b>
              <div className="demo-chips">
                {demoAccounts.map(account => (
                  <button type="button" key={account.email} onClick={() => fillDemo(account.email)}>{account.label}</button>
                ))}
              </div>
              <small>Password for every demo account: <code>DemoPass123</code></small>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
