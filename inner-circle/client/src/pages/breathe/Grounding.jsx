import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const STEPS = [
  { id: 1, title: '5 things you can see', count: 5, placeholder: 'Name something you can see' },
  { id: 2, title: '4 things you can feel', count: 4, placeholder: 'Name something you can feel (touch)' },
  { id: 3, title: '3 things you can hear', count: 3, placeholder: 'Name something you can hear' },
  { id: 4, title: '2 things you can smell', count: 2, placeholder: 'Name something you can smell' },
  { id: 5, title: '1 thing you can taste', count: 1, placeholder: 'Name something you can taste' },
]

export default function Grounding() {
  const { toast } = useApp()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(Array(STEPS.length).fill(''))
  const [done, setDone] = useState(false)

  const current = STEPS[step]
  const progress = `${step + 1} / ${STEPS.length}`

  const updateValue = (v) => {
    const next = [...values]
    next[step] = v
    setValues(next)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setDone(true)
      toast('Nice work taking a moment for yourself.')
    }
  }

  const back = () => {
    if (step > 0) setStep(step - 1)
  }

  const reset = () => {
    setStep(0)
    setValues(Array(STEPS.length).fill(''))
    setDone(false)
  }

  if (done) {
    return (
      <div className="card card-pad">
        <div className="breath-stage">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>You are here</h2>
          <p className="breath-instruction">That's enough for now. You can stop and return to normal breathing whenever you like.</p>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Do it again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-pad">
      <div className="step-card">
        <h3>{current.title}</h3>
        <p className="muted small">Progress: {progress}</p>
        <textarea
          className="ground-input"
          rows={3}
          placeholder={current.placeholder}
          value={values[step]}
          onChange={(e) => updateValue(e.target.value)}
        />
        <div className="ctrl-row" style={{ justifyContent: 'space-between', marginTop: '0.8rem' }}>
          <button type="button" className="btn btn-ghost" onClick={back} disabled={step === 0}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={next}>
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
      <div className="breath-instruction">You can stop and return to normal breathing whenever you like.</div>
    </div>
  )
}
