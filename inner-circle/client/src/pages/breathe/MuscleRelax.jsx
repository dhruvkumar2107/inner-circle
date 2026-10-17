import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'

const GROUPS = [
  { id: 'toes', title: 'Toes', text: 'Curl your toes tight, then release.' },
  { id: 'legs', title: 'Legs', text: 'Tighten your legs, then let them go heavy.' },
  { id: 'shoulders', title: 'Shoulders', text: 'Lift and tense your shoulders, then drop them.' },
  { id: 'hands', title: 'Hands', text: 'Make fists, then open and relax.' },
  { id: 'face', title: 'Face', text: 'Scrunch your face, then soften.' },
]

export default function MuscleRelax({ stepMs = 5000 }) {
  const { toast } = useApp()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('tense') // tense or release or done
  const [remaining, setRemaining] = useState(stepMs)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  useEffect(() => {
    if (!running) return undefined
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = stepMs - elapsed
      if (left <= 0) {
        if (phase === 'tense') {
          setPhase('release')
          startRef.current = Date.now()
          setRemaining(stepMs)
        } else if (phase === 'release') {
          goNext()
        }
      } else {
        setRemaining(left)
      }
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [running, phase, index])

  const start = () => {
    if (done) reset()
    setRunning(true)
    setPhase('tense')
    setRemaining(stepMs)
    startRef.current = Date.now()
  }

  const goNext = () => {
    if (index < GROUPS.length - 1) {
      setIndex(index + 1)
      setPhase('tense')
      setRemaining(stepMs)
      startRef.current = Date.now()
    } else {
      finish()
    }
  }

  const back = () => {
    if (index > 0) {
      setIndex(index - 1)
      setPhase('tense')
      setRemaining(stepMs)
      if (running) {
        startRef.current = Date.now()
      }
    }
  }

  const skip = () => {
    goNext()
  }

  const finish = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setDone(true)
    toast('Nice work taking a moment for yourself.')
  }

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIndex(0)
    setPhase('tense')
    setRemaining(stepMs)
    setRunning(false)
    setDone(false)
  }

  const group = GROUPS[index]
  const secs = Math.max(0, Math.ceil(remaining / 1000))

  if (done) {
    return (
      <div className="card card-pad">
        <div className="breath-stage">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>All groups relaxed</h2>
          <p className="breath-instruction">Take a moment. You can stop and return to normal breathing whenever you like.</p>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Start again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-pad">
      <div className="step-card">
        <h3>
          {group.title} · {index + 1}/{GROUPS.length}
        </h3>
        <p>{phase === 'tense' ? `Tense: ${group.text.split(',')[0].toLowerCase()}` : 'Release and soften'}</p>
        <div className="breath-timer" style={{ textAlign: 'center', margin: '0.6rem 0' }}>
          {secs}s
        </div>
        <div className="ctrl-row">
          <button type="button" className="btn btn-ghost" onClick={back} disabled={index === 0}>
            Back
          </button>
          {!running && (
            <button type="button" className="btn btn-primary" onClick={start}>
              {index === 0 ? 'Start' : 'Resume'}
            </button>
          )}
          {running && (
            <button type="button" className="btn btn-soft" onClick={skip}>
              Skip
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={finish}>
            Done
          </button>
        </div>
      </div>
      <div className="breath-instruction">You can stop and return to normal breathing whenever you like.</div>
    </div>
  )
}
