import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart3, Bell, BookOpen, CalendarDays, Compass, Heart, Home, Leaf,
  LogOut, Menu, MessageCircle, ShieldCheck, Sparkles, Users, X, Settings as SettingsIcon,
} from 'lucide-react'
import { api, clearSession, getAlias, initials, tokenKey } from '../lib/api'
import { Brand, LanguagePicker, SafetyPathway } from './common'

const baseNav = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/chat', label: 'AI Chat', icon: MessageCircle },
  { to: '/check-in', label: 'Check-in', icon: Activity },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/forum', label: 'Community', icon: Users },
]

const mobileNav = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/appointments', label: 'Book', icon: CalendarDays },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/forum', label: 'Community', icon: Users },
]

export function useMe() {
  const [me, setMe] = useState({ alias: getAlias(), role: localStorage.getItem('inner-circle-role') || 'student' })
  useEffect(() => {
    api('/auth/me')
      .then(data => {
        if (data?.user) {
          if (data.user.alias) localStorage.setItem('inner-circle-alias', data.user.alias)
          if (data.user.role) localStorage.setItem('inner-circle-role', data.user.role)
          setMe({ alias: data.user.alias, role: data.user.role, firstName: data.user.firstName })
        }
      })
      .catch(() => { /* guard will redirect on expiry */ })
  }, [])
  return me
}

function Notifications({ open, onClose }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    setItems(null)
    Promise.all([
      api('/appointments').catch(() => ({ appointments: [] })),
      api('/risk/latest').catch(() => ({ inference: null })),
    ]).then(([appointments, risk]) => {
      const list = []
      const upcoming = (appointments.appointments || []).filter(item => item.status !== 'cancelled' && item.status !== 'completed')
      upcoming.slice(0, 3).forEach(item => list.push({
        id: `appt-${item.id}`,
        title: `Appointment with ${item.professionalName}`,
        detail: `${item.date} · ${item.time}`,
      }))
      if (risk?.inference?.trend === 'Worsening') {
        list.push({ id: 'trend', title: 'Your check-ins suggest rising stress', detail: 'Consider a check-in or booking a guide.' })
      }
      setItems(list)
    }).catch(() => setError('Could not load notifications.'))
  }, [open])
  if (!open) return null
  return (
    <div className="popover" role="dialog" aria-label="Notifications">
      <div className="popover-head"><b>Notifications</b><button className="icon-button" onClick={onClose} aria-label="Close notifications"><X size={15} /></button></div>
      {error && <p className="popover-empty">{error}</p>}
      {!items && !error && <p className="popover-empty">Loading…</p>}
      {items && items.length === 0 && <p className="popover-empty">You're all caught up. 🌿</p>}
      {items && items.map(item => (
        <div className="popover-item" key={item.id}>
          <span className="popover-dot" />
          <span><b>{item.title}</b><small>{item.detail}</small></span>
        </div>
      ))}
    </div>
  )
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const me = useMe()
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => { setMenuOpen(false); setNotifOpen(false); window.scrollTo(0, 0) }, [location.pathname])

  const roleLabel = me.role === 'admin' ? 'Administrator'
    : me.role === 'professional' ? 'Professional'
      : me.role === 'volunteer' ? 'Peer volunteer'
        : 'Student · Anonymous'

  const navItems = [
    ...baseNav,
    ...(me.role === 'professional' || me.role === 'admin' ? [{ to: '/professional', label: 'Support desk', icon: ShieldCheck }] : []),
    ...(me.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: BarChart3 }] : []),
    ...(me.role === 'admin' || me.role === 'professional' ? [{ to: '/playground', label: 'Fuzzy lab', icon: Activity }] : []),
  ]

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* local sign-out still clears the browser */ }
    clearSession()
    navigate('/')
  }

  return (
    <div className="shell">
      <div className={`scrim ${menuOpen ? 'scrim-open' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand /></div>
        <div className="sidebar-caption">Your space</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-lower">
          <div className="sidebar-caption">More</div>
          <NavLink to="/how-it-works" className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}><Compass size={18} /><span>How it works</span></NavLink>
          <NavLink to="/privacy" className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}><ShieldCheck size={18} /><span>Privacy & safety</span></NavLink>
          <NavLink to="/settings" className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}><SettingsIcon size={18} /><span>Settings</span></NavLink>
          <div className="identity-chip">
            <span className="identity-avatar"><Leaf size={15} /></span>
            <span className="identity-copy"><b>{me.alias}</b><small>{roleLabel}</small></span>
            <button type="button" className="icon-button" onClick={logout} aria-label="Log out"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="topbar-title"><b>INNER CIRCLE</b><span>Curated support to meet you where you are.</span></div>
          <div className="topbar-actions">
            <LanguagePicker />
            <div className="notif-wrap">
              <button className="icon-button notif-button" aria-label="Notifications" onClick={() => setNotifOpen(value => !value)}>
                <Bell size={18} /><i />
              </button>
              <Notifications open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <span className="topbar-alias">{me.alias}</span>
            <button className="btn btn-ghost btn-sm logout-button" onClick={logout}><LogOut size={15} />Logout</button>
          </div>
        </header>

        <main className="content" key={location.pathname}><Outlet /></main>

        <nav className="bottom-nav" aria-label="Mobile navigation">
          {mobileNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `bottom-tab ${isActive ? 'bottom-tab-active' : ''}`}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <button className="help-now" onClick={() => setHelpOpen(true)}><Heart size={16} /> I need help now</button>
      {helpOpen && <SafetyPathway onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

export function PrivateShell() {
  if (!localStorage.getItem(tokenKey)) return <Navigate to="/login" replace />
  return <AppShell />
}

export function FloatingLeaves() {
  return (
    <span className="floating-leaves" aria-hidden="true">
      <Sparkles className="leaf-a" size={16} />
      <Leaf className="leaf-b" size={18} />
      <Sparkles className="leaf-c" size={12} />
    </span>
  )
}
