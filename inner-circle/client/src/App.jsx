import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { AppShell } from './components/Shell'
import Register from './pages/Register'
import Home from './pages/Home'
import Companion from './pages/Companion'
import MoodJourney from './pages/MoodJourney'
import Assessments from './pages/Assessments'
import AssessmentRunner from './pages/AssessmentRunner'
import AssessmentResult from './pages/AssessmentResult'
import PlayRelax from './pages/PlayRelax'
import Breathe from './pages/Breathe'
import Puzzles from './pages/Puzzles'
import Professional from './pages/Professional'
import SupportInsights from './pages/SupportInsights'
import Settings from './pages/Settings'

function RequireProfile({ children }) {
  const { profile } = useApp()
  if (!profile) return <Navigate to="/register" replace />
  return children
}

function EntryRedirect() {
  const { profile } = useApp()
  return <Navigate to={profile ? '/home' : '/register'} replace />
}

export default function App() {
  const location = useLocation()
  return (
    <Routes location={location}>
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<EntryRedirect />} />

      <Route element={<RequireProfile><AppShell /></RequireProfile>}>
        <Route path="/home" element={<Home />} />
        <Route path="/companion" element={<Companion />} />
        <Route path="/mood" element={<MoodJourney />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/assessments/:type" element={<AssessmentRunner />} />
        <Route path="/assessments/:type/result" element={<AssessmentResult />} />
        <Route path="/play" element={<PlayRelax />} />
        <Route path="/breathe" element={<Breathe />} />
        <Route path="/puzzles" element={<Puzzles />} />
        <Route path="/professional" element={<Professional />} />
        <Route path="/how" element={<SupportInsights />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<EntryRedirect />} />
    </Routes>
  )
}
