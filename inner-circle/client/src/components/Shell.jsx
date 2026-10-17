import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays, ClipboardCheck, Compass, Gamepad2, Heart, Home, LogOut, Menu, MessageCircle,
  Puzzle, Settings as SettingsIcon, Stethoscope, Wind, X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { todayKey } from '../lib/storage'
import { Brand, LeafMark, SafetyModal } from './ui'

const NAV_GROUPS = [
  {
    label: 'Your space',
    items: [
      { to: '/home', label: 'Home', icon: Home },
      { to: '/companion', label: 'AI Companion', icon: MessageCircle },
      { to: '/mood', label: 'My Mood Journey', icon: CalendarDays },
      { to: '/assessments', label: 'Mental Health Check-in', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Unwind',
    items: [
      { to: '/play', label: 'Play & Relax', icon: Gamepad2 },
      { to: '/breathe', label: 'Breathe & Reset', icon: Wind },
      { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/professional', label: 'Contact a Professional', icon: Stethoscope },
      { to: '/how', label: 'How Inner Circle Works', icon: Compass },
    ],
  },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
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

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <Brand />
          <button className="icon-btn" style={{ position: 'absolute', top: '0.9rem', right: '0.7rem' }} onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <X size={17} />
          </button>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="side-group">{group.label}</div>
            <nav className="side-nav">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
                  <Icon size={18} />
                  <span>{label}</span>
                  {to === '/home' && !checkedInToday && <i style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)' }} aria-label="Mood check-in not done today" />}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <div className="sidebar-spacer" />

        <nav className="side-nav">
          <NavLink to="/settings" className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
            <SettingsIcon size={18} />
            <span>Settings &amp; Privacy</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <span className="user-avatar"><LeafMark size={17} /></span>
          <span className="user-copy">
            <b>{profile?.firstName || 'Friend'}</b>
            <small>{profile?.university || 'Student'} · demo profile</small>
          </span>
          <button className="icon-btn" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div className="topbar-title">
            <b>Inner Circle</b>
            <span>Your quiet space between feelings and the next step.</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-soft btn-sm" onClick={() => openSafety('manual')}>
              <Heart size={15} /> I need help now
            </button>
          </div>
        </header>

        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'warn' ? 'toast-warn' : ''}`}>
            <span>{t.message}</span>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        ))}
      </div>

      {safetyOpen && <SafetyModal onClose={closeSafety} trigger={safetyTrigger} />}
    </div>
  )
}
