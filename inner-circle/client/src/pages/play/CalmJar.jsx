import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const DOT_COUNT = 30
const SHAKE_MS = 1500
const SETTLE_MS = 2600

const DOT_COLORS = ['#6e9169', '#a7c9a4', '#dcae55', '#c07f7a', '#a9c6d9', '#e8dcb8']

const rand = (min, max) => min + Math.random() * (max - min)

const makeDots = () =>
  Array.from({ length: DOT_COUNT }, (_, i) => ({
    id: i,
    x: rand(12, 88),
    y: rand(62, 90),
    size: rand(4, 9),
    color: DOT_COLORS[i % DOT_COLORS.length],
    settleX: rand(14, 86),
    settleY: rand(70, 92),
  }))

export default function CalmJar() {
  const { toast } = useApp()
  const [phase, setPhase] = useState('rest')
  const [dots, setDots] = useState(makeDots)
  const timerA = useRef(0)
  const timerB = useRef(0)

  useEffect(() => () => {
    clearTimeout(timerA.current)
    clearTimeout(timerB.current)
  }, [])

  const shake = () => {
    if (phase === 'shaking') return
    clearTimeout(timerA.current)
    clearTimeout(timerB.current)
    setPhase('shaking')
    setDots((list) =>
      list.map((d) => ({
        ...d,
        x: rand(8, 92),
        y: rand(10, 55),
      })),
    )
    timerA.current = setTimeout(() => {
      setPhase('settling')
      setDots((list) => list.map((d) => ({ ...d, x: d.settleX, y: d.settleY })))
    }, SHAKE_MS)
    timerB.current = setTimeout(() => {
      setPhase('rest')
      toast('Watched it settle — nice work taking a moment for yourself.')
    }, SHAKE_MS + SETTLE_MS)
  }

  const label =
    phase === 'shaking'
      ? 'Swirling around…'
      : phase === 'settling'
        ? 'Settling, nice and slowly…'
        : 'All settled. Shake it whenever you need a pause.'

  return (
    <div className="game-shell">
      <div className="jar-stage">
        <div className={`calm-jar ${phase === 'shaking' ? 'calm-jar-shaking' : ''}`} aria-hidden="true">
          <div className="jar-lid" />
          <div className="jar-glass">
            {dots.map((d) => (
              <span
                key={d.id}
                className={`jar-dot ${phase === 'shaking' ? 'jar-dot-fast' : ''}`}
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: d.size,
                  height: d.size,
                  background: d.color,
                }}
              />
            ))}
          </div>
        </div>
        <p className="small muted center" style={{ margin: 0, minHeight: '1.4em' }}>{label}</p>
        <button type="button" className="btn btn-primary" onClick={shake} disabled={phase === 'shaking'}>
          <Sparkles size={15} /> Shake the jar
        </button>
        <p className="tiny muted center" style={{ margin: 0 }}>
          Watch the glitter drift down and find its rest — like thoughts settling on their own.
        </p>
      </div>
    </div>
  )
}
