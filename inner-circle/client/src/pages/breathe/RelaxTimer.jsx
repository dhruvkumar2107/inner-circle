import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'

const OPTIONS = [
  { label: '1 min', ms: 60 * 1000 },
  { label: '3 min', ms: 3 * 60 * 1000 },
  { label: '5 min', ms: 5 * 60 * 1000 },
]

export default function RelaxTimer() {
  const { toast } = useApp()
  const [choice, setChoice] = useState(OPTIONS[0].ms)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(choice)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)
  const startRef = useRef(null)
  const totalRef = useRef(choice)

  useEffect(() => () => clearInterval(timerRef.current), [])

  useEffect(() => {
    totalRef.current = choice
    setRemaining(choice)
    setFinished(false)
  }, [choice])

  useEffect(() => {
    if (!running || paused) return undefined
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = totalRef.current - elapsed
      if (left <= 0) {
        complete()
      } else {
        setRemaining(left)
      }
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [running, paused])

  const start = () => {
    if (finished) {
      setRemaining(choice)
      setFinished(false)
    }
    totalRef.current = remaining
    setRunning(true)
    setPaused(false)
    startRef.current = Date.now()
  }

  const pause = () => {
    if (!running) return
    setPaused(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resume = () => {
    if (!running) return
    totalRef.current = remaining
    setPaused(false)
    startRef.current = Date.now()
  }

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setPaused(false)
    setFinished(false)
    setRemaining(choice)
  }

  const complete = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setPaused(false)
    setFinished(true)
    setRemaining(0)
    toast('Nice work taking a moment for yourself.')
  }

  const secs = Math.max(0, Math.ceil(remaining / 1000))
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="card card-pad">
      <div className="breath-stage">
        <div className={`breath-circle ${running && !paused ? 'breathe-in' : ''}`} aria-hidden="true" />
        <div className="breath-label" aria-live="polite">
          {running ? 'Gentle breathing' : finished ? 'Done' : 'Relaxation timer'}
        </div>
        <div className="breath-timer" aria-live="polite">
          {mm}:{ss}
        </div>
        <div className="chip-row">
          {OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              type="button"
              className={`chip ${choice === opt.ms && !running ? 'chip-on' : ''}`}
              onClick={() => {
                if (!running) {
                  setChoice(opt.ms)
                  setRemaining(opt.ms)
                }
              }}
              disabled={running}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ctrl-row">
          {!running && !finished && (
            <button type="button" className="btn btn-primary" onClick={start}>
              Start
            </button>
          )}
          {running && !paused && (
            <button type="button" className="btn btn-soft" onClick={pause}>
              Pause
            </button>
          )}
          {running && paused && (
            <button type="button" className="btn btn-soft" onClick={resume}>
              Resume
            </button>
          )}
          {running && (
            <button type="button" className="btn btn-outline" onClick={stop}>
              Stop
            </button>
          )}
          {finished && (
            <>
              <button type="button" className="btn btn-primary" onClick={start}>
                Start again
              </button>
              <button type="button" className="btn btn-outline" onClick={stop}>
                Reset
              </button>
            </>
          )}
        </div>
        <div className="breath-instruction" style={{ marginTop: '0.4rem' }}>
          You can stop and return to normal breathing whenever you like.
        </div>
      </div>
    </div>
  )
}
