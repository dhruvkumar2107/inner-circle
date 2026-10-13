import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { tokenKey } from './lib/api'
import { AppShell } from './components/Shell'
import { Brand, LanguagePicker } from './components/common'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import CheckIn from './pages/CheckIn'
import Appointments from './pages/Appointments'
import Resources from './pages/Resources'
import Forum from './pages/Forum'
import HowItWorks from './pages/HowItWorks'
import Privacy from './pages/Privacy'
import Settings from './pages/Settings'
import Playground from './pages/Playground'
import Professional from './pages/Professional'
import Admin from './pages/Admin'

const RequireAuth = ({ children }) => {
  if (!localStorage.getItem(tokenKey)) return <Navigate to="/login" replace />
  return children
}

const InfoShell = () => {
  if (localStorage.getItem(tokenKey)) return <AppShell />
  return (
    <div className="info-shell">
      <header className="info-shell-nav">
        <Link to="/" className="info-shell-brand"><Brand /></Link>
        <div className="info-shell-actions">
          <LanguagePicker />
          <Link className="btn btn-ghost" to="/login">Sign in</Link>
          <Link className="btn btn-primary" to="/register">Create account</Link>
        </div>
      </header>
      <main className="info-shell-content"><Outlet /></main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

      <Route element={<InfoShell />}>
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/privacy" element={<Privacy />} />
      </Route>

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/professional" element={<Professional />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
