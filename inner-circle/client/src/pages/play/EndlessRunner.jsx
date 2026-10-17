import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const W = 640
const H = 260
const GROUND_Y = 212
const PLAYER_X = 88
const GRAVITY = 2100
const JUMP_V = -640
const BASE_SPEED = 235

const COL = {
  ground: '#dcecdf',
  groundLine: '#cfe4d4',
  sage: '#6e9169',
  sageDark: '#4c6a49',
  mint: '#eaf4eb',
  mintDeep: '#cfe4d4',
  cream: '#fbf7ee',
  obstacle: '#8fb589',
  obstacleTop: '#6e9169',
}

const rand = (min, max) => min + Math.random() * (max - min)

function makeObstacle(x) {
  const tall = Math.random() < 0.45
  return {
    x,
    w: tall ? rand(20, 26) : rand(34, 52),
    h: tall ? rand(38, 52) : rand(22, 30),
  }
}

export default function EndlessRunner({ best = 0, onBest }) {
  const { toast } = useApp()
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const rafRef = useRef(0)
  const stateRef = useRef(null)
  const [phase, setPhase] = useState('ready')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(best)
  const bestRef = useRef(best)
  const onBestRef = useRef(onBest)

  const initWorld = useCallback(() => ({
    y: GROUND_Y,
    vy: 0,
    grounded: true,
    speed: BASE_SPEED,
    dist: 0,
    obstacles: [makeObstacle(W + 180)],
    phase: 'ready',
    lastScoreShown: 0,
  }), [])

  if (!stateRef.current) stateRef.current = initWorld()

  useEffect(() => { bestRef.current = best; setBestScore(best) }, [best])
  useEffect(() => { onBestRef.current = onBest })

  const setPhaseBoth = useCallback((next) => {
    stateRef.current.phase = next
    setPhase(next)
  }, [])

  const jump = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing') return
    if (s.grounded) {
      s.vy = JUMP_V
      s.grounded = false
    }
  }, [])

  const start = useCallback(() => {
    stateRef.current = initWorld()
    setScore(0)
    setPhaseBoth('playing')
    stateRef.current.phase = 'playing'
  }, [initWorld, setPhaseBoth])

  const gameOver = useCallback(() => {
    const s = stateRef.current
    s.phase = 'over'
    setPhase('over')
    const final = Math.floor(s.dist / 10)
    setScore(final)
    if (final > bestRef.current) {
      bestRef.current = final
      setBestScore(final)
      onBestRef.current?.(final)
    }
    toast('Nice work taking a moment for yourself.')
  }, [toast])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return undefined
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssW = wrap.clientWidth
      const cssH = Math.round(cssW * (H / W))
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    const frame = (now) => {
      rafRef.current = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const s = stateRef.current

      if (s.phase === 'playing') {
        s.speed = Math.min(BASE_SPEED * 1.55, s.speed + dt * 6)
        s.dist += s.speed * dt
        s.vy += GRAVITY * dt
        s.y += s.vy * dt
        if (s.y >= GROUND_Y) {
          s.y = GROUND_Y
          s.vy = 0
          s.grounded = true
        }
        s.obstacles.forEach((o) => { o.x -= s.speed * dt })
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > -30)
        const lastOb = s.obstacles[s.obstacles.length - 1]
        if (!lastOb || lastOb.x < W - rand(200, 330)) {
          s.obstacles.push(makeObstacle(W + 20))
        }
        const pr = 15
        for (const o of s.obstacles) {
          const hit =
            PLAYER_X + pr > o.x &&
            PLAYER_X - pr < o.x + o.w &&
            s.y > GROUND_Y - o.h
          if (hit) { gameOver(); break }
        }
        const shown = Math.floor(s.dist / 10)
        if (shown !== s.lastScoreShown) {
          s.lastScoreShown = shown
          setScore(shown)
        }
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = COL.mint
      ctx.beginPath()
      ctx.arc(W - 70, 52, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = COL.cream
      ctx.beginPath()
      ctx.arc(120, 64, 16, 0, Math.PI * 2)
      ctx.arc(142, 64, 20, 0, Math.PI * 2)
      ctx.arc(166, 66, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = COL.ground
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
      ctx.strokeStyle = COL.groundLine
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, GROUND_Y)
      ctx.lineTo(W, GROUND_Y)
      ctx.stroke()
      for (const o of s.obstacles) {
        ctx.fillStyle = COL.obstacle
        ctx.beginPath()
        ctx.roundRect(o.x, GROUND_Y - o.h, o.w, o.h, 8)
        ctx.fill()
        ctx.fillStyle = COL.obstacleTop
        ctx.beginPath()
        ctx.arc(o.x + o.w / 2, GROUND_Y - o.h + 3, o.w / 3.4, Math.PI, 0)
        ctx.fill()
      }
      const pr = 15
      ctx.fillStyle = COL.sage
      ctx.beginPath()
      ctx.arc(PLAYER_X, s.y - pr, pr, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = COL.mint
      ctx.beginPath()
      ctx.arc(PLAYER_X, s.y - pr, pr - 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = COL.sageDark
      ctx.beginPath()
      ctx.arc(PLAYER_X + 5, s.y - pr - 2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(PLAYER_X + 11, s.y - pr - 2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = COL.sageDark
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(PLAYER_X + 8, s.y - pr + 2, 5, 0.2, Math.PI - 0.6)
      ctx.stroke()
    }
    rafRef.current = requestAnimationFrame(frame)

    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        const s = stateRef.current
        if (s.phase === 'playing') {
          e.preventDefault()
          jump()
        } else if (s.phase === 'ready' && !e.repeat) {
          e.preventDefault()
          start()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
    }
  }, [jump, start, gameOver])

  const onTap = () => {
    const s = stateRef.current
    if (s.phase === 'playing') jump()
    else if (s.phase === 'ready') start()
  }

  return (
    <div className="game-shell">
      <div className="game-hud">
        <span className="game-score">Score <b>{score}</b></span>
        <span className="game-score">Best <b>{Math.max(bestScore, score)}</b></span>
        {phase === 'playing' && (
          <span className="tiny muted nowrap">Space / tap to jump</span>
        )}
      </div>
      <div className="runner-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="runner-canvas"
          role="img"
          aria-label="Endless runner: a small round character jumping over bushes"
          onPointerDown={(e) => { e.preventDefault(); onTap() }}
        />
        {phase === 'ready' && (
          <div className="runner-overlay" onPointerDown={(e) => e.stopPropagation()}>
            <div className="game-over">
              <b>A gentle hop</b>
              <p className="small muted" style={{ margin: '0.3rem 0 0.9rem' }}>
                Press Space or tap to jump over the bushes. No pressure — go as far as you like.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                <Play size={14} /> Start
              </button>
            </div>
          </div>
        )}
        {phase === 'over' && (
          <div className="runner-overlay" onPointerDown={(e) => e.stopPropagation()}>
            <div className="game-over">
              <b>That was a nice run</b>
              <p className="small muted" style={{ margin: '0.3rem 0 0.2rem' }}>
                You covered <b>{score}</b> points{score >= bestScore && score > 0 ? ' — a new best!' : ` · best ${bestScore}`}.
              </p>
              <p className="tiny muted" style={{ margin: '0 0 0.9rem' }}>
                Take a breath, then go again whenever you're ready.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                <RotateCcw size={14} /> Restart
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="tiny muted center" style={{ margin: '0.6rem 0 0' }}>
        Space, Arrow&nbsp;Up or a tap to jump. The speed picks up a little as you go.
      </p>
    </div>
  )
}
