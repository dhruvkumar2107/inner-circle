import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const EMOJI = ['🌿', '☀️', '🌸', '🐢', '🌈', '⭐', '🍀', '🌊']

function makeDeck() {
  const pairs = [...EMOJI, ...EMOJI]
  for (let i = pairs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs.map((emoji, i) => ({ id: i, emoji }))
}

export default function MemoryGame({ best = null, onBest }) {
  const { toast } = useApp()
  const [deck, setDeck] = useState(makeDeck)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [won, setWon] = useState(false)
  const [fewest, setFewest] = useState(best)
  const timers = useRef([])

  useEffect(() => { setFewest(best) }, [best])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const newGame = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setDeck(makeDeck())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setLocked(false)
    setWon(false)
  }, [])

  const clickCard = (i) => {
    if (locked || won) return
    if (flipped.includes(i) || matched.includes(i)) return
    if (flipped.length === 0) {
      setFlipped([i])
      return
    }
    const first = flipped[0]
    setFlipped([first, i])
    setLocked(true)
    setMoves((m) => m + 1)
    if (deck[first].emoji === deck[i].emoji) {
      timers.current.push(setTimeout(() => {
        const next = [...matched, first, i]
        setMatched(next)
        setFlipped([])
        setLocked(false)
        if (next.length === deck.length) {
          const total = moves + 1
          setWon(true)
          if (fewest === null || total < fewest) {
            setFewest(total)
            onBest?.(total)
          }
          toast('You found every pair — lovely focus. Nice work taking a moment for yourself.')
        }
      }, 380))
    } else {
      timers.current.push(setTimeout(() => {
        setFlipped([])
        setLocked(false)
      }, 750))
    }
  }

  return (
    <div className="game-shell">
      <div className="game-hud">
        <span className="game-score">Moves <b>{moves}</b></span>
        <span className="game-score">Pairs <b>{matched.length / 2}/8</b></span>
        {fewest !== null && fewest !== undefined && (
          <span className="game-score">Fewest <b>{fewest}</b></span>
        )}
        <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={newGame}>
          <RotateCcw size={14} /> New game
        </button>
      </div>
      <div className="memory-grid">
        {deck.map((card, i) => {
          const open = flipped.includes(i) || matched.includes(i)
          const isMatch = matched.includes(i)
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card ${open ? 'memory-card-on' : ''} ${isMatch ? 'memory-card-matched' : ''}`}
              aria-label={open ? `Card ${i + 1}, ${card.emoji}` : `Card ${i + 1}, face down`}
              aria-pressed={open}
              disabled={isMatch}
              onClick={() => clickCard(i)}
            >
              <span className="memory-inner">
                <span className="memory-front" aria-hidden="true">?</span>
                <span className="memory-back" aria-hidden="true">{card.emoji}</span>
              </span>
            </button>
          )
        })}
      </div>
      {won && (
        <div className="game-over" style={{ marginTop: '0.9rem' }}>
          <b>All eight pairs found</b>
          <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
            You did it in {moves} moves. That kind of quiet focus is a genuinely good reset.
          </p>
        </div>
      )}
      {!won && (
        <p className="tiny muted center" style={{ margin: '0.7rem 0 0' }}>
          Flip two cards at a time and try to remember where each pair lives.
        </p>
      )}
    </div>
  )
}
