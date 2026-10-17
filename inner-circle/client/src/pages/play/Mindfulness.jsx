import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Leaf } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const STEPS = [
  {
    title: 'Notice three things you can hear',
    body: 'Wherever you are right now, let your ears do a little work. One near sound, one further away, and one you had not noticed until this moment.',
    cue: 'You do not need to name them perfectly — just let them arrive.',
  },
  {
    title: 'Feel two points of contact',
    body: 'Notice your feet resting on the floor, and your back or shoulders touching the chair. Let those points hold you for a few slow seconds.',
    cue: 'Nothing to fix. Just two places where the world is holding you up.',
  },
  {
    title: 'Take one unhurried breath',
    body: 'Breathe in gently, and let the out-breath be a little longer than the in-breath. Once is enough. Twice, if it feels nice.',
    cue: 'That is the whole exercise — short, quiet, and entirely yours.',
  },
]

export default function Mindfulness() {
  const { toast } = useApp()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  const back = () => setStep((s) => Math.max(0, s - 1))
  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }
    setDone(true)
    toast('Nice work taking a moment for yourself.')
  }
  const restart = () => {
    setStep(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="game-shell">
        <div className="mind-panel center">
          <span className="mind-done-icon"><Check size={22} /></span>
          <h3 style={{ marginTop: '0.6rem' }}>That is your pause, complete</h3>
          <p className="small muted" style={{ maxWidth: '38ch', margin: '0 auto' }}>
            Three small steps, about a minute of your day. You showed up for yourself — that
            genuinely counts. Come back whenever the day feels loud.
          </p>
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: '1rem' }} onClick={restart}>
            <Leaf size={14} /> Do it again
          </button>
        </div>
      </div>
    )
  }

  const current = STEPS[step]

  return (
    <div className="game-shell">
      <div className="mind-dots" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.title} className={`mind-dot ${i === step ? 'mind-dot-on' : ''}`} />
        ))}
      </div>
      <p className="tiny muted center" style={{ margin: '0 0 0.5rem' }}>
        Step {step + 1} of {STEPS.length}
      </p>
      <div className="mind-panel">
        <h3>{current.title}</h3>
        <p>{current.body}</p>
        <p className="small muted" style={{ margin: 0 }}>{current.cue}</p>
      </div>
      <div className="mind-nav">
        <button type="button" className="btn btn-outline btn-sm" onClick={back} disabled={step === 0}>
          <ArrowLeft size={14} /> Back
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={next}>
          {step === STEPS.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
