import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const ROUND = 20
const TARGET_LIFE = 1600
const TONES = ['tone-sage', 'tone-mint', 'tone-amber', 'tone-rose', 'tone-sky']

export default function FocusReaction({ best = 0, onBest }) {
  const { toast } = useApp()
  const [phase, setPhase] = useState('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND)
  const [targets, setTargets] = useState([])
  const [bestScore, setBestScore] = useState(best)
  const stageRef = useRef(null)
  const spawnTimer = useRef(0)
  const tickTimer = useRef(0)
  const endTimer = useRef(0)
  const expiryTimers = useRef([])
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const bestRef = useRef(best)

  useEffect(() => { bestRef.current = best; setBestScore(best) }, [best])

  const clearAll = useCallback(() => {
    clearInterval(spawnTimer.current)
    clearInterval(tickTimer.current)
    clearTimeout(endTimer.current)
    expiryTimers.current.forEach(clearTimeout)
    expiryTimers.current = []
  }, [])

  useEffect(() => () => clearAll(), [clearAll])

  const finish = useCallback(() => {
    clearAll()
    setTargets([])
    setPhase('over')
    const final = scoreRef.current
    if (final > bestRef.current) {
      bestRef.current = final
      setBestScore(final)
      onBest?.(final)
    }
    toast('Nice work taking a moment for yourself.')
  }, [clearAll, onBest, toast])

  const spawn = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const size = 52
    const x = 8 + Math.random() * Math.max(1, rect.width - size - 16)
    const y = 8 + Math.random() * Math.max(1, rect.height - size - 16)
    idRef.current += 1
    const id = idRef.current
    setTargets((list) => [...list, { id, x, y, tone: TONES[id % TONES.length] }])
    expiryTimers.current.push(setTimeout(() => {
      setTargets((list) => list.filter((t) => t.id !== id))
    }, TARGET_LIFE))
  }, [])

  const start = useCallback(() => {
    clearAll()
    scoreRef.current = 0
    setScore(0)
    setTargets([])
    setTimeLeft(ROUND)
    setPhase('playing')
    spawn()
    spawnTimer.current = setInterval(spawn, 950)
    let left = ROUND
    tickTimer.current = setInterval(() => {
      left -= 1
      setTimeLeft(left)
    }, 1000)
    endTimer.current = setTimeout(finish, ROUND * 1000)
  }, [clearAll, finish, spawn])

  const hit = (id) => {
    if (phase !== 'playing') return
    setTargets((list) => list.filter((t) => t.id !== id))
    scoreRef.current += 1
    setScore(scoreRef.current)
  }

  return (
    <div className="game-shell">
      <div className="game-hud">
        <span className="game-score">Score <b>{score}</b></span>
        <span className="game-score">
          Time <b>{phase === 'ready' ? ROUND : timeLeft}s</b>
        </span>
        {bestScore > 0 && <span className="game-score">Best <b>{bestScore}</b></span>}
        {phase === 'playing' && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={finish}
          >
            End early
          </button>
        )}
      </div>
      <div className="reaction-stage" ref={stageRef}>
        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`reaction-target ${t.tone}`}
            style={{ left: t.x, top: t.y }}
            aria-label="Soft target, click for a point"
            onPointerDown={(e) => { e.preventDefault(); hit(t.id) }}
          />
        ))}
        {phase === 'ready' && (
          <div className="reaction-overlay">
            <div className="game-over">
              <b>Soft focus, 20 seconds</b>
              <p className="small muted" style={{ margin: '0.3rem 0 0.9rem' }}>
                Gentle targets drift in — tap them for a point. Nothing flashes, nothing is lost.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                <Play size={14} /> Start
              </button>
            </div>
          </div>
        )}
        {phase === 'over' && (
          <div className="reaction-overlay">
            <div className="game-over">
              <b>Round complete</b>
              <p className="small muted" style={{ margin: '0.3rem 0 0.9rem' }}>
                You caught <b>{score}</b> targets{score >= bestScore && score > 0 ? ' — a new best!' : ` · best ${bestScore}`}.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                <RotateCcw size={14} /> Play again
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="tiny muted center" style={{ margin: '0.6rem 0 0' }}>
        A short, gentle round — just tap whatever appears. Stop whenever you like.
      </p>
    </div>
  )
}
