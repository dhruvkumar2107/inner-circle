import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'

const SIZE = 3
const TILE_COUNT = SIZE*SIZE
const SVG_DATA = "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22240%22%20height=%22240%22%3E%3Crect%20width=%22240%22%20height=%22240%22%20fill=%22%23eaf4eb%22/%3E%3Ccircle%20cx=%22120%22%20cy=%2290%22%20r=%2240%22%20fill=%22%236e9169%22/%3E%3Cpath%20d=%22M60%20180%20Q120%20140%20180%20180%20L180%20240%20L60%20240%20Z%22%20fill=%22%23cfe4d4%22/%3E%3Ccircle%20cx=%22110%22%20cy=%2280%22%20r=%228%22%20fill=%22%23fff%22/%3E%3C/svg%3E"

function getSolved() {
  return Array(TILE_COUNT).fill().map((_, i) => i)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isSolved(order) {
  for (let i = 0; i < TILE_COUNT; i++) if (order[i] !== i) return false
  return true
}

export default function Jigsaw({ onComplete }) {
  const { t } = useI18n()
  const [order, setOrder] = useState(() => shuffle(getSolved()))
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const completedRef = useRef(false)

  const swap = (a,b) => {
    if (a === b) return
    const next = [...order]
    ;[next[a], next[b]] = [next[b], next[a]]
    setOrder(next)
    setMoves(m => m + 1)
    setSelected(null)
  }

  useEffect(() => {
    if (isSolved(order) && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [order, onComplete])

  const newGame = () => {
    setOrder(shuffle(getSolved()))
    setMoves(0)
    setSelected(null)
    completedRef.current = false
  }

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <span className="puzzle-stat">{t('puzzles.jigsaw.moves', { moves })}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={newGame}>{t('puzzles.jigsaw.newPuzzle')}</button>
      </div>
      {isSolved(order) && <div className="status-message">{t('puzzles.jigsaw.solved')}</div>}
      <div className="puzzle-board jigsaw-grid">
        {order.map((tileIdx, pos) => {
          const tr = (Math.floor(tileIdx / SIZE) / (SIZE - 1)) * 100
          const tc = ((tileIdx % SIZE) / (SIZE - 1)) * 100
          return (
            <button
              key={pos}
              type="button"
              className={`tile-btn jigsaw-tile ${selected === pos ? 'selected' : ''}`}
              onClick={() => selected === null ? setSelected(pos) : swap(selected, pos)}
              style={{
                backgroundImage: `url('${SVG_DATA}')`,
                backgroundPosition: `${tc}% ${tr}%`,
                backgroundSize: '300% 300%'
              }}
              aria-label={t('puzzles.jigsaw.tileLabel', { n: tileIdx + 1 })}
            />
          )
        })}
      </div>
      <p className="puzzle-hint">{t('puzzles.jigsaw.hint')}</p>
    </div>
  )
}
