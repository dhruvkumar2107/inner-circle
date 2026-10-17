import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'

const ICONS = ['🌿', '🍃', '🌸', '🌙', '⭐', '☁️', '🕊️', '🌻']
const FLIP_BACK_MS = 800
const MATCH_MS = 500

function buildDeck() {
  const deck = [...ICONS, ...ICONS].map((emoji, i) => ({ id: i, emoji, matched: false }))
  for (let i = deck.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export default function MemoryPuzzle({ onComplete }) {
  const { t } = useI18n()
  const [deck, setDeck] = useState(buildDeck)
  const [flipped, setFlipped] = useState([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const completedRef = useRef(false)
  const timers = useRef([])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  useEffect(() => {
    if (deck.every(c => c.matched) && !completedRef.current) {
      completedRef.current = true
      setWon(true)
      onComplete()
    }
  }, [deck, onComplete])

  const flip = (idx) => {
    if (flipped.length === 2) return
    const card = deck[idx]
    if (card.matched || flipped.includes(idx)) return
    const next = [...flipped, idx]
    setFlipped(next)
    if (next.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = next
      if (deck[a].emoji === deck[b].emoji) {
        timers.current.push(setTimeout(() => {
          setDeck(d => d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)))
          setFlipped([])
        }, MATCH_MS))
      } else {
        timers.current.push(setTimeout(() => setFlipped([]), FLIP_BACK_MS))
      }
    }
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setDeck(buildDeck())
    setFlipped([])
    setMoves(0)
    setWon(false)
    completedRef.current = false
  }

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <span className="puzzle-stat">{t('puzzles.memory.moves', { moves })}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={restart}>{t('puzzles.memory.newGame')}</button>
      </div>
      <div className="puzzle-board memory-grid" role="grid" aria-label={t('puzzles.memory.boardLabel')}>
        {deck.map((card, i) => {
          const shown = card.matched || flipped.includes(i)
          return (
            <button
              key={i}
              type="button"
              className={`tile-btn memory-tile ${shown ? 'memory-revealed' : ''} ${card.matched ? 'memory-matched' : ''}`}
              onClick={() => flip(i)}
              aria-label={shown ? card.emoji : t('puzzles.memory.hidden')}
            >
              {shown ? card.emoji : ''}
            </button>
          )
        })}
      </div>
      {won && <div className="status-message">{t('puzzles.memory.won', { moves })}</div>}
    </div>
  )
}
