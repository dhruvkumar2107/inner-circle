import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays, ClipboardCheck, Compass, Gamepad2, Heart, Home, LogOut, Menu, MessageCircle,
  Puzzle, Settings as SettingsIcon, Stethoscope, Wind, X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { todayKey } from '../lib/storage'
import LanguagePicker from './LanguagePicker'
import { Brand, LeafMark, SafetyModal } from './ui'

const NAV_GROUPS = [
  {
    labelKey: 'nav.groupSpace',
    items: [
      { to: '/home', labelKey: 'nav.home', icon: Home },
      { to: '/companion', labelKey: 'nav.companion', icon: MessageCircle },
      { to: '/mood', labelKey: 'nav.mood', icon: CalendarDays },
      { to: '/assessments', labelKey: 'nav.assessments', icon: ClipboardCheck },
    ],
  },
  {
    labelKey: 'nav.groupUnwind',
    items: [
      { to: '/play', labelKey: 'nav.play', icon: Gamepad2 },
      { to: '/breathe', labelKey: 'nav.breathe', icon: Wind },
      { to: '/puzzles', labelKey: 'nav.puzzles', icon: Puzzle },
    ],
  },
  {
    labelKey: 'nav.groupSupport',
    items: [
      { to: '/professional', labelKey: 'nav.professional', icon: Stethoscope },
      { to: '/how', labelKey: 'nav.how', icon: Compass },
    ],
  },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const { profile, signOut, safetyOpen, safetyTrigger, openSafety, closeSafety, toasts, dismissToast, moods } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const today = todayKey()
  const checkedInToday = moods.some((m) => m.date === today)

  const handleSignOut = () => {
    signOut()
    navigate('/register', { replace: true })
  }

  return (
    <div className="shell">
      <div className={`scrim ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label={t('nav.mainNav')}>
        <div className="sidebar-brand">
          <Brand />
          <button className="icon-btn" style={{ position: 'absolute', top: '0.9rem', right: '0.7rem' }} onClick={() => setMenuOpen(false)} aria-label={t('nav.closeNav')}>
            <X size={17} />
          </button>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <div className="side-group">{t(group.labelKey)}</div>
            <nav className="side-nav">
              {group.items.map(({ to, labelKey, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
                  <Icon size={18} />
                  <span>{t(labelKey)}</span>
                  {to === '/home' && !checkedInToday && <i style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)' }} aria-label={t('nav.notCheckedIn')} />}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <div className="sidebar-spacer" />

        <nav className="side-nav">
          <NavLink to="/settings" className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
            <SettingsIcon size={18} />
            <span>{t('nav.settings')}</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <span className="user-avatar"><LeafMark size={17} /></span>
          <span className="user-copy">
            <b>{profile?.firstName || t('nav.friend')}</b>
            <small>{profile?.university || t('nav.student')} · {t('nav.demoProfile')}</small>
          </span>
          <button className="icon-btn" onClick={handleSignOut} aria-label={t('nav.signOut')} title={t('nav.signOut')}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label={t('nav.openNav')}>
            <Menu size={19} />
          </button>
          <div className="topbar-title">
            <b>Inner Circle</b>
            <span>{t('nav.tagline')}</span>
          </div>
          <div className="topbar-actions">
            <LanguagePicker compact />
            <button className="btn btn-soft btn-sm" onClick={() => openSafety('manual')}>
              <Heart size={15} /> {t('nav.helpNow')}
            </button>
          </div>
        </header>

        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      <div className="toast-wrap" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast ${item.tone === 'warn' ? 'toast-warn' : ''}`}>
            <span>{item.message}</span>
            <button onClick={() => dismissToast(item.id)} aria-label={t('nav.toastDismiss')}><X size={14} /></button>
          </div>
        ))}
      </div>

      {safetyOpen && <SafetyModal onClose={closeSafety} trigger={safetyTrigger} />}
    </div>
  )
}
