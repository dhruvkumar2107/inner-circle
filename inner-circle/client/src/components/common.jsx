import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Heart, Leaf, Loader2, RefreshCw, X } from 'lucide-react'
import { api } from '../lib/api'

export function Brand({ light = false, compact = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true"><Leaf size={18} fill="currentColor" /></span>
      <span className="brand-text">
        <b>Inner Circle</b>
        {!compact && <small>your quiet space to heal</small>}
      </span>
    </div>
  )
}

export function LanguagePicker() {
  const { i18n } = useTranslation()
  return (
    <label className="language-picker">
      <span className="sr-only">Choose language</span>
      <select
        value={i18n.language.slice(0, 2)}
        onChange={event => i18n.changeLanguage(event.target.value)}
        aria-label="Choose language"
      >
        <option value="en">EN</option>
        <option value="hi">हिन्दी</option>
        <option value="kn">ಕನ್ನಡ</option>
      </select>
    </label>
  )
}

export function Spinner({ label }) {
  return (
    <span className="spinner" role="status" aria-live="polite">
      <Loader2 className="spin" size={18} />
      {label && <span>{label}</span>}
    </span>
  )
}

export function EmptyState({ icon: Icon = Leaf, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true"><Icon size={24} /></span>
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={16} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  )
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} style={{ width: `${90 - index * 12}%` }} />
      ))}
    </div>
  )
}

export function Toast({ message, tone = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onClose, 3200)
    return () => clearTimeout(timer)
  }, [message, onClose])
  if (!message) return null
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" aria-label="Dismiss" onClick={onClose}><X size={14} /></button>
    </div>
  )
}

export function Modal({ title, kicker, onClose, children, footer, wide = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section
        className={`modal-card ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {kicker && <span className="kicker">{kicker}</span>}
        {title && <h2>{title}</h2>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </section>
    </div>
  )
}

export function SectionHeader({ kicker, title, action, tight = false }) {
  return (
    <div className={`section-header ${tight ? 'section-tight' : ''}`}>
      <div>
        {kicker && <span className="kicker">{kicker}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}

/**
 * The safety pathway. It reports the help-now trigger to the server (creating a
 * review flag + audit entry) exactly once and lists real crisis resources.
 */
export function SafetyPathway({ onClose }) {
  const reported = useRef(false)
  const [resources, setResources] = useState(null)
  useEffect(() => {
    if (reported.current) return
    reported.current = true
    api('/safety/help-now', { method: 'POST', body: JSON.stringify({ trigger: 'help-now-button' }) })
      .then(data => setResources(data?.resources ?? null))
      .catch(() => { /* the pathway still shows the built-in resources below */ })
  }, [])
  const numbers = resources ?? [
    { label: 'Tele-MANAS', number: '14416', detail: 'India · 24×7 mental-health support' },
    { label: 'KIRAN', number: '1800-599-0019', detail: 'Mental-health helpline' },
    { label: 'Emergency services', number: '112', detail: 'If you may be in immediate danger' },
  ]
  return (
    <Modal
      kicker="YOU DON'T HAVE TO BE ALONE"
      title="Let's find support together."
      onClose={onClose}
      footer={<button className="btn btn-primary full" onClick={onClose}>I'm safe for now — continue</button>}
    >
      <p className="safety-lead">
        If you may be in immediate danger, please contact emergency services or someone you trust now.
        Inner Circle is not an emergency service.
      </p>
      <div className="crisis-options">
        {numbers.map(item => (
          <a key={item.number} href={`tel:${String(item.number).replace(/[^0-9+]/g, '')}`}>
            <span className="crisis-icon"><Heart size={16} /></span>
            <span className="crisis-copy">
              <b>{item.label}</b>
              <small>{item.number}{item.detail ? ` · ${item.detail}` : ''}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="verify-note">Please verify support numbers and your campus contacts before launch.</p>
    </Modal>
  )
}

/** Decorative layered landscape used in the landing + dashboard hero. */
export function LandscapeArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 520 300" role="img" aria-label="A calm, layered landscape" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dcefff" />
          <stop offset="100%" stopColor="#eafaf1" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe8d2" />
          <stop offset="100%" stopColor="#a7ddc2" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd0ab" />
          <stop offset="100%" stopColor="#6fbe94" />
        </linearGradient>
        <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5aab7f" />
          <stop offset="100%" stopColor="#3f9468" />
        </linearGradient>
      </defs>
      <rect width="520" height="300" fill="url(#sky)" />
      <circle cx="400" cy="78" r="38" fill="#ffe9a8" opacity="0.9" />
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="120" cy="80" rx="46" ry="20" />
        <ellipse cx="158" cy="72" rx="34" ry="17" />
        <ellipse cx="90" cy="74" rx="28" ry="14" />
        <ellipse cx="330" cy="120" rx="38" ry="16" />
        <ellipse cx="362" cy="114" rx="26" ry="13" />
      </g>
      <path d="M0 210 C 120 160 200 235 320 195 C 400 168 470 205 520 185 L 520 300 L 0 300 Z" fill="url(#hill1)" />
      <path d="M0 245 C 140 205 230 265 360 232 C 440 213 490 240 520 228 L 520 300 L 0 300 Z" fill="url(#hill2)" />
      <path d="M0 278 C 150 250 260 292 380 268 C 450 254 495 272 520 264 L 520 300 L 0 300 Z" fill="url(#hill3)" />
      <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M70 300 L70 250" />
        <path d="M70 260 L52 244 M70 268 L88 252 M70 250 L70 234" />
      </g>
    </svg>
  )
}
