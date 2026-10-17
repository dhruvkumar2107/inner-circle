import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const STEPS = [
  { title: 'Notice your breath', body: 'Feel the natural flow, no need to change it.' },
  { title: 'Notice sounds', body: 'Gently notice sounds near and far.' },
  { title: 'Notice one sensation', body: 'Find one gentle sensation to rest your attention on.' },
  { title: 'Choose one gentle intention', body: 'Pick a word like "calm", "kind", or one of your own.' },
]

export default function Mindfulness() {
  const { toast } = useApp()
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)

  const next = () => {
    if (index < STEPS.length - 1) {
      setIndex(index + 1)
    } else {
      setDone(true)
      toast('Nice work taking a moment for yourself.')
    }
  }
  const back = () => {
    if (index > 0) setIndex(index - 1)
  }
  const reset = () => {
    setIndex(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="card card-pad">
        <div className="breath-stage">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Settled</h2>
          <p className="breath-instruction">You are here. That's enough for now.</p>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Do it again
          </button>
        </div>
      </div>
    )
  }

  const step = STEPS[index]
  return (
    <div className="card card-pad">
      <div className="step-card">
        <h3>
          {step.title} · {index + 1}/{STEPS.length}
        </h3>
        <p>{step.body}</p>
        <div className="ctrl-row" style={{ justifyContent: 'space-between', marginTop: '0.8rem' }}>
          <button type="button" className="btn btn-ghost" onClick={back} disabled={index === 0}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={next}>
            {index === STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
      <div className="breath-instruction">You can stop and return to normal breathing whenever you like.</div>
    </div>
  )
}
