import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, HeartHandshake, Leaf, Sparkles, Users } from 'lucide-react'
import { api, getAlias } from '../lib/api'
import { Brand, LandscapeArt } from '../components/common'

const concerns = [
  { id: 'anxiety', label: 'Exam & academic anxiety' },
  { id: 'stress', label: 'Stress & overwhelm' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'mood', label: 'Low mood' },
  { id: 'focus', label: 'Focus & motivation' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'self-esteem', label: 'Self-esteem' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState([])

  const toggle = id => setPicked(value => value.includes(id) ? value.filter(x => x !== id) : [...value, id])

  const finish = () => {
    localStorage.setItem('inner-circle-concerns', JSON.stringify(picked))
    localStorage.setItem('inner-circle-onboarded', '1')
    navigate('/dashboard', { replace: true })
  }

  const requestHelp = async () => {
    try { await api('/safety/help-now', { method: 'POST', body: JSON.stringify({ trigger: 'assessment' }) }) } catch { /* still route them onward */ }
    navigate('/appointments', { replace: true })
  }

  const steps = [
    {
      kicker: 'WELCOME',
      title: `Hello, ${getAlias()}.`,
      body: 'This is your space. Nothing here is a test, and you can take every step at your own pace. We keep you anonymous by default.',
      icon: Leaf,
      content: (
        <ul className="onboard-points">
          <li><Sparkles size={16} /><span><b>Anonymous.</b> You appear as a friendly alias, never your real name.</span></li>
          <li><Users size={16} /><span><b>Private.</b> Chats and check-ins are yours; only safety reviews are visible to trained staff.</span></li>
          <li><HeartHandshake size={16} /><span><b>Supportive, not a substitute.</b> For emergencies we'll always point you to real humans.</span></li>
        </ul>
      ),
    },
    {
      kicker: "WHAT'S ON YOUR MIND",
      title: 'Anything you would like support with?',
      body: 'Choose as many as feel true today. This simply helps us shape your recommendations — you can change it any time.',
      icon: Sparkles,
      content: (
        <div className="chip-grid">
          {concerns.map(item => (
            <button type="button" key={item.id} className={`select-chip ${picked.includes(item.id) ? 'select-chip-on' : ''}`} onClick={() => toggle(item.id)}>
              {picked.includes(item.id) && <Check size={14} />}{item.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      kicker: 'YOU SET THE PACE',
      title: 'You are in charge here.',
      body: 'Whenever things feel heavy you can use the “I need help now” button, talk to the companion, or reach a real person. We will never push you.',
      icon: HeartHandshake,
      content: (
        <div className="onboard-final">
          <button className="btn btn-soft" onClick={requestHelp}><HeartHandshake size={16} /> I'd like to see real support options</button>
          <p className="muted">You can return to this any time from the safety button in the corner.</p>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const Icon = current.icon ?? Leaf
  const last = step === steps.length - 1

  return (
    <div className="onboarding">
      <div className="onboarding-art"><LandscapeArt className="onboard-landscape" /><Brand light /></div>
      <div className="onboarding-card">
        <div className="onboard-progress" aria-hidden="true">
          {steps.map((_, index) => <span key={index} className={index <= step ? 'on' : ''} />)}
        </div>
        <span className="kicker">{current.kicker}</span>
        <h1>{current.title}</h1>
        <p className="onboard-body">{current.body}</p>
        <div className="onboard-content"><span className="onboard-emoji"><Icon size={20} /></span>{current.content}</div>
        <div className="onboard-actions">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>Back</button>}
          <button className="btn btn-primary btn-lg" onClick={() => last ? finish() : setStep(s => s + 1)}>
            {last ? 'Enter Inner Circle' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
