import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const SIZE = 6
const TILES = ['#6e9169', '#a7c9a4', '#efe2bc', '#a9c6d9', '#dcae55', '#c07f7a']

const pick = () => Math.floor(Math.random() * TILES.length)

function makeBoard() {
  const b = []
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const row = Math.floor(i / SIZE)
    const col = i % SIZE
    const banned = new Set()
    if (col >= 2 && b[i - 1] === b[i - 2]) banned.add(b[i - 1])
    if (row >= 2 && b[i - SIZE] === b[i - SIZE * 2]) banned.add(b[i - SIZE])
    let v = pick()
    while (banned.has(v)) v = pick()
    b.push(v)
  }
  return b
}

function findMatches(b) {
  const hit = new Set()
  for (let r = 0; r < SIZE; r += 1) {
    let run = 1
    for (let c = 1; c < SIZE; c += 1) {
      const i = r * SIZE + c
      if (b[i] !== null && b[i] === b[i - 1]) run += 1
      else {
        if (run >= 3) for (let k = 1; k <= run; k += 1) hit.add(i - k)
        run = 1
      }
    }
    if (run >= 3) for (let k = 1; k <= run; k += 1) hit.add(SIZE * (r + 1) - k)
  }
  for (let c = 0; c < SIZE; c += 1) {
    let run = 1
    for (let r = 1; r < SIZE; r += 1) {
      const i = r * SIZE + c
      if (b[i] !== null && b[i] === b[i - SIZE]) run += 1
      else {
        if (run >= 3) for (let k = 1; k <= run; k += 1) hit.add(i - k * SIZE)
        run = 1
      }
    }
    if (run >= 3) for (let k = 1; k <= run; k += 1) hit.add((SIZE - 1) * SIZE + c - (k - 1) * SIZE)
  }
  return hit
}

function collapse(b, matched) {
  const out = b.slice()
  matched.forEach((i) => { out[i] = null })
  for (let c = 0; c < SIZE; c += 1) {
    const stack = []
    for (let r = SIZE - 1; r >= 0; r -= 1) {
      const v = out[r * SIZE + c]
      if (v !== null) stack.push(v)
    }
    for (let r = SIZE - 1; r >= 0; r -= 1) {
      out[r * SIZE + c] = stack[SIZE - 1 - r] ?? pick()
    }
  }
  return out
}

const adjacent = (a, b) => {
  const ar = Math.floor(a / SIZE)
  const ac = a % SIZE
  const br = Math.floor(b / SIZE)
  const bc = b % SIZE
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1
}

export default function MatchThree({ best = 0, onBest }) {
  const { toast } = useApp()
  const t = useT()
  const [board, setBoard] = useState(makeBoard)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [busy, setBusy] = useState(false)
  const [bestScore, setBestScore] = useState(best)
  const timers = useRef([])
  const scoreRef = useRef(0)
  const bestRef = useRef(best)

  useEffect(() => { bestRef.current = best; setBestScore(best) }, [best])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const newGame = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    scoreRef.current = 0
    setBoard(makeBoard())
    setSelected(null)
    setScore(0)
    setMoves(0)
    setBusy(false)
  }, [])

  const resolve = useCallback((startBoard) => {
    let b = startBoard
    let gained = 0
    let chain = 0
    for (;;) {
      const matched = findMatches(b)
      if (matched.size === 0) break
      chain += 1
      gained += matched.size * chain
      b = collapse(b, matched)
    }
    setBoard(b)
    const next = scoreRef.current + gained
    scoreRef.current = next
    setScore(next)
    if (next > bestRef.current) {
      bestRef.current = next
      setBestScore(next)
      onBest?.(next)
    }
    setBusy(false)
    if (chain > 1) toast(t('play.toast.chain'))
  }, [onBest, toast, t])

  const clickTile = (i) => {
    if (busy) return
    if (selected === null) {
      setSelected(i)
      return
    }
    if (selected === i) {
      setSelected(null)
      return
    }
    if (!adjacent(selected, i)) {
      setSelected(i)
      return
    }
    const a = selected
    const next = board.slice()
    ;[next[a], next[i]] = [next[i], next[a]]
    setSelected(null)
    if (findMatches(next).size === 0) {
      setBusy(true)
      setBoard(next)
      setMoves((m) => m + 1)
      timers.current.push(setTimeout(() => {
        setBoard(board)
        setBusy(false)
      }, 320))
      return
    }
    setMoves((m) => m + 1)
    setBusy(true)
    setBoard(next)
    timers.current.push(setTimeout(() => resolve(next), 180))
  }

  return (
    <div className="game-shell">
      <div className="game-hud">
        <span className="game-score">{t('play.hud.score')} <b>{score}</b></span>
        <span className="game-score">{t('play.hud.moves')} <b>{moves}</b></span>
        {bestScore > 0 && <span className="game-score">{t('play.hud.best')} <b>{bestScore}</b></span>}
        <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={newGame}>
          <RotateCcw size={14} /> {t('play.match.newGame')}
        </button>
      </div>
      <div className="match-grid" role="group" aria-label={t('play.match.boardLabel')}>
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`match-tile ${selected === i ? 'match-tile-on' : ''}`}
            style={{ background: TILES[v] }}
            aria-label={`${t('play.match.tileLabel', { row: Math.floor(i / SIZE) + 1, col: (i % SIZE) + 1 })}${selected === i ? t('play.match.tileSelected') : ''}`}
            aria-pressed={selected === i}
            disabled={busy}
            onClick={() => clickTile(i)}
          />
        ))}
      </div>
      <p className="tiny muted center" style={{ margin: '0.7rem 0 0' }}>
        {t('play.match.footer')}
      </p>
    </div>
  )
}
