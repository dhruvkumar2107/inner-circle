import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'
import { SIZE, TILES, adjacent, findMatches, makeBoard, resolveBoard, swap } from '../../lib/matchThree'

export default function MatchThree({ best = 0, onBest, onBack }) {
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
    const { board: settled, gained, chain } = resolveBoard(startBoard)
    setBoard(settled)
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
    const next = swap(board, a, i)
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
        {onBack && (
          <button type="button" className="btn btn-soft btn-sm" onClick={onBack}>
            <ArrowLeft size={14} /> {t('play.buttons.backToGames')}
          </button>
        )}
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
