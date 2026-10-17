import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Play, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const ROUND = 20
const TARGET_LIFE = 1600
const TONES = ['tone-sage', 'tone-mint', 'tone-amber', 'tone-rose', 'tone-sky']

export default function FocusReaction({ best = 0, onBest, onBack }) {
  const { toast } = useApp()
  const t = useT()
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
    toast(t('play.toast.niceWork'))
  }, [clearAll, onBest, toast, t])

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
        <span className="game-score">{t('play.hud.score')} <b>{score}</b></span>
        <span className="game-score">
          {t('play.hud.time')} <b>{phase === 'ready' ? ROUND : timeLeft}s</b>
        </span>
        {bestScore > 0 && <span className="game-score">{t('play.hud.best')} <b>{bestScore}</b></span>}
        {phase === 'playing' && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={finish}
          >
            {t('play.focus.endEarly')}
          </button>
        )}
      </div>
      <div className="reaction-stage" ref={stageRef}>
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            className={`reaction-target ${target.tone}`}
            style={{ left: target.x, top: target.y }}
            aria-label={t('play.focus.targetLabel')}
            onPointerDown={(e) => { e.preventDefault(); hit(target.id) }}
          />
        ))}
        {phase === 'ready' && (
          <div className="reaction-overlay">
            <div className="game-over">
              <b>{t('play.focus.readyTitle')}</b>
              <p className="small muted" style={{ margin: '0.3rem 0 0.9rem' }}>
                {t('play.focus.readyBody')}
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                <Play size={14} /> {t('common.start')}
              </button>
            </div>
          </div>
        )}
        {phase === 'over' && (
          <div className="reaction-overlay">
            <div className="game-over">
              <b>{t('play.focus.overTitle')}</b>
              <p className="small muted" style={{ margin: '0.3rem 0 0.9rem' }}>
                {score >= bestScore && score > 0
                  ? t('play.focus.overNewBest', { score })
                  : t('play.focus.overBest', { score, best: bestScore })}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                  <RotateCcw size={14} /> {t('play.focus.playAgain')}
                </button>
                {onBack && (
                  <button type="button" className="btn btn-soft btn-sm" onClick={onBack}>
                    <ArrowLeft size={14} /> {t('play.buttons.backToGames')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="tiny muted center" style={{ margin: '0.6rem 0 0' }}>
        {t('play.focus.footer')}
      </p>
    </div>
  )
}
