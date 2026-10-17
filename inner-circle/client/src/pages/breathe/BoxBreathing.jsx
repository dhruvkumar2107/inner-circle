import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { speakGuide, speechSupport } from '../../lib/voice'
import VoiceToggle from './VoiceToggle'

const BOX = [
  { label: 'Inhale…', type: 'breathe-in', ms: 4000 },
  { label: 'Hold…', type: 'breathe-hold', ms: 4000 },
  { label: 'Exhale…', type: 'breathe-out', ms: 4000 },
  { label: 'Hold…', type: 'breathe-hold', ms: 4000 },
]

export default function BoxBreathing({ durationMs = 90 * 1000 }) {
  const { settings, updateSettings, toast } = useApp()
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(durationMs)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)
  const phaseStartRef = useRef(null)
  const lastSpokenRef = useRef(null)
  const totalElapsedRef = useRef(0)

  useEffect(() => () => clearInterval(timerRef.current), [])

  useEffect(() => {
    if (!running || paused) return undefined
    phaseStartRef.current = Date.now()
    timerRef.current = setInterval(tick, 200)
    return () => clearInterval(timerRef.current)
  }, [running, paused, phaseIndex])

  const tick = () => {
    if (phaseStartRef.current == null) return
    const phase = BOX[phaseIndex]
    const elapsedPhase = Date.now() - phaseStartRef.current
    if (elapsedPhase >= phase.ms) {
      const nextIndex = (phaseIndex + 1) % BOX.length
      setPhaseIndex(nextIndex)
      speakIfNeeded(BOX[nextIndex].label)
      return
    }
    const newRemaining = Math.max(0, remaining - 200)
    setRemaining(newRemaining)
    if (newRemaining === 0) {
      complete()
    }
  }

  const speakIfNeeded = (text) => {
    if (!settings.voiceGuidance || !speechSupport().tts) return
    if (lastSpokenRef.current === text) return
    lastSpokenRef.current = text
    speakGuide(text)
  }

  const start = () => {
    if (finished) setRemaining(durationMs)
    setFinished(false)
    setRunning(true)
    setPaused(false)
    setPhaseIndex(0)
    totalElapsedRef.current = 0
    lastSpokenRef.current = null
    phaseStartRef.current = Date.now()
    speakIfNeeded(BOX[0].label)
  }

  const pause = () => {
    if (!running) return
    setPaused(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resume = () => {
    if (!running) return
    setPaused(false)
    phaseStartRef.current = Date.now()
  }

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setPaused(false)
    setFinished(false)
    setRemaining(durationMs)
    setPhaseIndex(0)
    lastSpokenRef.current = null
  }

  const complete = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setPaused(false)
    setFinished(true)
    setRemaining(0)
    toast('Nice work taking a moment for yourself.')
  }

  const currentPhase = BOX[phaseIndex]
  const secs = Math.max(0, Math.ceil(remaining / 1000))
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="card card-pad">
      <div className="breath-stage">
        <div className={`breath-circle ${running && !paused ? currentPhase.type : ''}`} aria-hidden="true" />
        <div className="breath-label" aria-live="polite">
          {running ? currentPhase.label : finished ? 'Done' : 'Ready'}
        </div>
        <div className="breath-timer" aria-live="polite">
          {mm}:{ss}
        </div>
        <div className="breath-instruction">
          4-4-4-4 box breathing. Holding is optional — return to normal breathing whenever you like.
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
        <VoiceToggle enabled={settings.voiceGuidance} onChange={(v) => updateSettings({ voiceGuidance: v })} />
      </div>
    </div>
  )
}
