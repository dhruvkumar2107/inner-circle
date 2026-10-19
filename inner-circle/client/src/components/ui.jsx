import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, HeartHandshake, Leaf, Loader2, Sprout, X } from 'lucide-react'
import { useT } from '../i18n'

export function Brand({ compact = false }) {
  const t = useT()
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true"><LeafMark size={20} /></span>
      <span className="brand-text">
        <b>Inner Circle</b>
        {!compact && <small>{t('common.brandTagline')}</small>}
      </span>
    </div>
  )
}

/** The Inner Circle mark: two leaves forming a small, open circle. */
export function LeafMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.2c4.4 0 7.9 3.5 7.9 7.9 0 4.3-3.5 7.8-7.9 7.8"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
      <path
        d="M12 20.8c-4.4 0-7.9-3.5-7.9-7.9 0-4.3 3.5-7.8 7.9-7.8"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.55"
      />
      <path
        d="M12 8.6c1.9-2.1 4.4-2.4 6.1-2.2-.2 2.2-1.3 4.4-3.4 5.4-1.4.7-2.7.5-2.7.5s-.4-2-.0-3.7Z"
        fill="currentColor"
      />
      <path
        d="M10.6 14.9c-.5-2.1-2-3.7-4.4-4.3.1 2.4 1.2 4.7 3.3 5.7 1.3.6 2.5.3 2.5.3s-.4-1-.4-1.7Z"
        fill="currentColor" opacity="0.65"
      />
    </svg>
  )
}

/** The small, subtle Inner Circle companion — a young leaf named Fern. */
export function Mascot({ size = 64, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="33" fill="#eaf4eb" />
      <circle cx="36" cy="36" r="33" stroke="#cfe4d4" strokeWidth="2" />
      <path d="M36 52V33" stroke="#5e8159" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M36 34c-1.5-7-6.5-11.5-13-12.5.5 7.5 5 13.5 12 14.6 1 .2 1-1.4 1-2.1Z"
        fill="#6e9169"
      />
      <path
        d="M36 41c1.8-6.2 6.6-10 12.5-10.6-.4 6.8-4.6 12.2-11.2 13.2-1.1.2-1.6-1.5-1.3-2.6Z"
        fill="#8fb589"
      />
      <path d="M27 52h18" stroke="#cfe4d4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Spinner({ label }) {
  return (
    <span className="spinner" role="status" aria-live="polite" style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center', color: 'var(--muted)' }}>
      <Loader2 className="spin" size={16} />
      {label && <span className="small">{label}</span>}
    </span>
  )
}

export function PageHeader({ kicker, title, sub, action }) {
  return (
    <header className="page-header page-header-row">
      <div>
        {kicker && <span className="kicker">{kicker}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </header>
  )
}

export function SectionTitle({ title, sub, action }) {
  return (
    <div className="section-title page-header-row">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ tone = '', children, className = '' }) {
  return <span className={`badge ${tone ? `badge-${tone}` : ''} ${className}`}>{children}</span>
}

export function Note({ tone = '', icon: Icon = null, children }) {
  return (
    <div className={`note ${tone ? `note-${tone}` : ''}`}>
      {Icon && <Icon size={15} />}
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ icon: Icon = Sprout, title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon size={21} /></span>
      <b>{title}</b>
      {children && <p className="small">{children}</p>}
      {action}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  const t = useT()
  if (!message) return null
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={16} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry} style={{ marginLeft: 'auto' }}>
          {t('common.tryAgain')}
        </button>
      )}
    </div>
  )
}

export function Modal({ title, kicker, onClose, children, footer, wide = false, hideClose = false }) {
  const t = useT()
  const ref = useRef(null)
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && onClose) onClose() }}>
      <section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        {!hideClose && <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}><X size={17} /></button>}
        <div className="modal-head">
          {kicker && <span className="kicker">{kicker}</span>}
          {title && <h2>{title}</h2>}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </section>
    </div>
  )
}

/** Helpline entries are keyed so each language file supplies its own wording. */
export const CRISIS_RESOURCES = [
  { key: 'emergency', number: '112' },
]

/**
 * The urgent-support pathway. Deliberately separate from ordinary navigation:
 * it opens from any page, from a safety-sensitive answer, or from the
 * companion when it detects crisis language.
 */
export function SafetyModal({ onClose, trigger = 'manual' }) {
  const t = useT()
  return (
    <Modal
      kicker={t('common.safety.kicker')}
      title={t('common.safety.title')}
      onClose={onClose}
      footer={(
        <>
          <Link className="btn btn-primary" to="/professional" onClick={onClose}>{t('common.safety.deptContact')}</Link>
          <button className="btn btn-ghost" onClick={onClose}>{t('common.close')}</button>
        </>
      )}
    >
      <p className="small" style={{ color: 'var(--ink-2)' }}>
        {trigger === 'assessment' ? t('common.safety.bodyAssessment') : t('common.safety.bodyManual')}
      </p>
      <div className="crisis-options">
        {CRISIS_RESOURCES.map((item) => (
          <a key={item.number} href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}>
            <span className="crisis-icon"><HeartHandshake size={16} /></span>
            <span className="crisis-copy">
              <b>{t(`common.safety.resources.${item.key}.label`)}</b>
              <small>{item.number} · {t(`common.safety.resources.${item.key}.detail`)}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="verify-note">{t('common.safety.verifyNote')}</p>
    </Modal>
  )
}
