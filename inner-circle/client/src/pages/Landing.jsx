import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarHeart, HeartHandshake, Leaf, MessageCircle, ShieldCheck, Sparkles, Users,
} from 'lucide-react'
import { tokenKey } from '../lib/api'
import { Brand, LandscapeArt, LanguagePicker } from '../components/common'

const features = [
  { icon: MessageCircle, title: 'A companion that listens', body: 'An always-available, judgement-free chat that remembers context and offers gentle, practical steps.' },
  { icon: Users, title: 'Anonymous community', body: 'Share wins and worries in caring rooms with an alias — never your real name.' },
  { icon: CalendarHeart, title: 'Guided appointments', body: 'Book online or in-person sessions with counsellors and peer volunteers in a few taps.' },
  { icon: BookOpen, title: 'A calm toolkit', body: 'Breathing, grounding, sleep and focus practices matched to how you feel right now.' },
  { icon: ShieldCheck, title: 'Safety first', body: 'Crisis-aware pathways, transparent privacy, and support that never replaces emergency care.' },
  { icon: HeartHandshake, title: 'Built for campuses', body: 'Explains, not judges. Gentle check-ins help you (and your circle) notice early.' },
]

const steps = [
  { title: 'Check in, gently', body: 'A quick mood and stress check-in — 30 seconds, no scores to “pass”.' },
  { title: 'Talk or reflect', body: 'Chat with the companion, breathe, journal, or visit a community room.' },
  { title: 'Reach a human', body: 'When it matters, book a session or use “I need help now”.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const signedIn = Boolean(localStorage.getItem(tokenKey))
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <div className="landing-nav-actions">
          <LanguagePicker />
          {signedIn ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to dashboard</button>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">Sign in</Link>
              <Link className="btn btn-primary" to="/register">Create account</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-pill"><Sparkles size={14} /> A softer way to support student minds</span>
          <h1>Your mind matters.<br /><em>Always.</em></h1>
          <p>
            Inner Circle is a quiet, welcoming space to check in with yourself, talk things through,
            and find the support you deserve — at your own pace, in your own words.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/register">Begin your circle <ArrowRight size={18} /></Link>
            <Link className="btn btn-soft btn-lg" to="/login">I already have an account</Link>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={15} /> Anonymous by design</span>
            <span><Leaf size={15} /> Free for students</span>
            <span><HeartHandshake size={15} /> Not a replacement for emergency care</span>
          </div>
        </div>
        <div className="hero-art">
          <LandscapeArt className="hero-landscape" />
          <div className="hero-card hero-card-a"><Leaf size={16} /><span><b>Steady Lantern</b><small>“I finally slept properly.”</small></span></div>
          <div className="hero-card hero-card-b"><MessageCircle size={16} /><span><b>Companion</b><small>“Let's take one slow breath…”</small></span></div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-heading">
          <span className="kicker">WHAT YOU'LL FIND INSIDE</span>
          <h2>A calm toolkit for the whole student journey</h2>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, body }) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section how-band">
        <div className="landing-heading">
          <span className="kicker">HOW IT WORKS</span>
          <h2>Three gentle steps</h2>
        </div>
        <ol className="steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="step-number">{index + 1}</span>
              <div><b>{step.title}</b><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="crisis-band">
        <ShieldCheck size={22} />
        <div>
          <b>In an emergency, please reach a human right now.</b>
          <p>Tele-MANAS 14416 · KIRAN 1800-599-0019 · Emergency 112. Inner Circle is supportive, not a crisis service.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <Brand compact />
        <p>Made with care for student wellbeing. This is a research prototype — please verify all support contacts before launch.</p>
        <div className="landing-footer-links">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/privacy">Privacy & safety</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
