import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../../i18n'
import './ChessPreview.css'
import {
  WHITE,
  BLACK,
  colorOf,
  initialState,
  generateMoves,
  makeMove,
  getGameStatus,
  chooseMove,
  positionKey,
  squareName,
} from './chess/engine'

const GLYPHS = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const PROMOTION_PIECES = ['q', 'r', 'b', 'n']
const PROMOTION_NAMES = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }

const glyphFor = (piece) => GLYPHS[piece.toLowerCase()]
const keyOf = (piece) => piece.toLowerCase()
const sameSquare = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

export default function ChessPreview({ onComplete }) {
  const t = useT()
  const [mode, setMode] = useState('cpu')
  const [states, setStates] = useState(() => [initialState()])
  const [selected, setSelected] = useState(null)
  const [pendingPromotion, setPendingPromotion] = useState(null)
  const [thinking, setThinking] = useState(false)
  const completedRef = useRef(false)

  const game = states[states.length - 1]
  const myColor = WHITE
  const status = useMemo(() => getGameStatus(game), [game])

  const repetition = useMemo(() => {
    const key = positionKey(game)
    return states.filter((state) => positionKey(state) === key).length >= 3
  }, [states, game])

  const gameOver =
    status.type === 'checkmate' ||
    status.type === 'stalemate' ||
    status.type === 'draw' ||
    repetition

  const selectedMoves = useMemo(() => {
    if (!selected) return []
    return generateMoves(game).filter(
      (move) => sameSquare(move.from, selected),
    )
  }, [game, selected])

  const targets = useMemo(() => {
    const map = new Map()
    for (const move of selectedMoves) map.set(move.to[0] * 8 + move.to[1], move)
    return map
  }, [selectedMoves])

  const checkedKing = useMemo(() => {
    if (status.type !== 'check' && status.type !== 'checkmate') return null
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = game.board[r][c]
        if (piece && piece.toLowerCase() === 'k' && colorOf(piece) === game.turn) return [r, c]
      }
    }
    return null
  }, [game, status])

  const applyMove = useCallback((move) => {
    setStates((prev) => [...prev, makeMove(prev[prev.length - 1], move)])
    setSelected(null)
    setPendingPromotion(null)
  }, [])

  const isHumanTurn = () => {
    if (gameOver || pendingPromotion) return false
    if (mode === 'cpu' && game.turn !== myColor) return false
    return true
  }

  const handleSquare = (r, c) => {
    if (!isHumanTurn()) return
    const piece = game.board[r][c]

    if (selected) {
      if (sameSquare(selected, [r, c])) {
        setSelected(null)
        return
      }
      const matches = selectedMoves.filter((move) => move.to[0] === r && move.to[1] === c)
      if (matches.length) {
        if (matches.some((move) => move.promotion)) {
          setPendingPromotion({ to: [r, c], options: matches })
        } else {
          applyMove(matches[0])
        }
        return
      }
    }

    const canPick = piece && colorOf(piece) === game.turn && (mode !== 'cpu' || game.turn === myColor)
    setSelected(canPick ? [r, c] : null)
  }

  const choosePromotion = (promotion) => {
    if (!pendingPromotion) return
    const move = pendingPromotion.options.find((option) => option.promotion === promotion)
    if (move) applyMove(move)
  }

  const undo = () => {
    setSelected(null)
    setPendingPromotion(null)
    setStates((prev) => {
      if (prev.length <= 1) return prev
      let next = prev.slice(0, -1)
      if (mode === 'cpu') {
        while (next.length > 1 && next[next.length - 1].turn !== myColor) {
          next = next.slice(0, -1)
        }
      }
      return next
    })
  }

  const reset = () => {
    setStates([initialState()])
    setSelected(null)
    setPendingPromotion(null)
    setThinking(false)
    completedRef.current = false
  }

  const changeMode = (nextMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setStates([initialState()])
    setSelected(null)
    setPendingPromotion(null)
    setThinking(false)
    completedRef.current = false
  }

  // The computer replies on its own turn.
  useEffect(() => {
    const shouldThink =
      mode === 'cpu' &&
      !pendingPromotion &&
      !repetition &&
      game.turn === BLACK &&
      (status.type === 'playing' || status.type === 'check')
    if (!shouldThink) {
      setThinking(false)
      return undefined
    }

    let cancelled = false
    setThinking(true)
    const timer = setTimeout(() => {
      if (cancelled) return
      const move = chooseMove(game, 2)
      if (move) {
        setStates((prev) => [...prev, makeMove(prev[prev.length - 1], move)])
      }
      setThinking(false)
    }, 420)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mode, game, pendingPromotion, repetition, status.type])

  useEffect(() => {
    if (completedRef.current) return
    if (status.type === 'checkmate' && mode === 'cpu' && status.winner === myColor) {
      completedRef.current = true
      if (onComplete) onComplete()
    }
  }, [status, mode, myColor, onComplete])

  const sideName = (color) => t(`chess.side.${color === WHITE ? 'white' : 'black'}`)
  const pieceName = (piece) => t(`chess.piece.${keyOf(piece)}`)

  const squareLabel = (r, c) => {
    const piece = game.board[r][c]
    const square = squareName(r, c)
    const base = piece
      ? t('chess.board.square', { piece: pieceName(piece), side: sideName(colorOf(piece)), square })
      : t('chess.board.emptySquare', { square })
    if (sameSquare(selected, [r, c])) return `${base}, ${t('chess.board.selected')}`
    if (targets.has(r * 8 + c)) return `${base}, ${t('chess.board.legalTarget')}`
    return base
  }

  let statusKey
  if (status.type === 'checkmate') {
    if (mode === 'cpu') {
      statusKey = status.winner === myColor ? 'chess.status.checkmateYouWin' : 'chess.status.checkmateYouLose'
    } else {
      statusKey = status.winner === WHITE ? 'chess.status.checkmateWhite' : 'chess.status.checkmateBlack'
    }
  } else if (status.type === 'stalemate') {
    statusKey = 'chess.status.stalemate'
  } else if (status.type === 'draw' || repetition) {
    statusKey = 'chess.status.draw'
  } else if (thinking || (mode === 'cpu' && game.turn !== myColor)) {
    statusKey = 'chess.status.computerTurn'
  } else if (status.type === 'check') {
    statusKey = 'chess.status.check'
  } else if (mode === 'cpu') {
    statusKey = 'chess.status.yourTurn'
  } else {
    statusKey = game.turn === WHITE ? 'chess.status.whiteTurn' : 'chess.status.blackTurn'
  }
  const statusText = t(statusKey)

  const capturedRow = (color) => {
    const pieces = game.captured[color]
    return (
      <div className="ic-chess-captured" aria-label={t(`chess.captured.${color === WHITE ? 'white' : 'black'}`)}>
        <span className="ic-chess-captured-label">
          {t(`chess.captured.${color === WHITE ? 'white' : 'black'}`)}
        </span>
        {pieces.length === 0
          ? <span className="small muted">{t('chess.captured.none')}</span>
          : pieces.map((piece, index) => (
            <span
              key={`${piece}-${index}`}
              className={`ic-chess-cap-piece ${colorOf(piece) === WHITE ? 'white' : 'black'}`}
              aria-hidden="true"
            >
              {glyphFor(piece)}
            </span>
          ))}
      </div>
    )
  }

  return (
    <div className="ic-chess puzzle-view">
      <div className="ic-chess-toolbar">
        <div className="ic-chess-modes" role="group" aria-label={t('chess.mode.label')}>
          <button
            type="button"
            className={`chip ${mode === 'cpu' ? 'chip-on' : ''}`}
            aria-pressed={mode === 'cpu'}
            onClick={() => changeMode('cpu')}
          >
            {t('chess.mode.cpu')}
          </button>
          <button
            type="button"
            className={`chip ${mode === 'local' ? 'chip-on' : ''}`}
            aria-pressed={mode === 'local'}
            onClick={() => changeMode('local')}
          >
            {t('chess.mode.local')}
          </button>
        </div>
        <div className="ic-chess-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={undo} disabled={states.length <= 1}>
            {t('chess.actions.undo')}
          </button>
          <button type="button" className="btn btn-soft btn-sm" onClick={reset}>
            {t('chess.actions.reset')}
          </button>
        </div>
      </div>

      <div className="ic-chess-status" role="status" aria-live="polite">
        <span className={`ic-chess-turn-dot ${game.turn === WHITE ? 'white' : 'black'}`} aria-hidden="true" />
        <span>{statusText}</span>
      </div>

      {capturedRow(BLACK)}

      <div className="ic-chess-board" role="group" aria-label={t('chess.board.label')}>
        {Array.from({ length: 64 }, (_, index) => {
          const r = Math.floor(index / 8)
          const c = index % 8
          const piece = game.board[r][c]
          const dark = (r + c) % 2 === 1
          const isSelected = sameSquare(selected, [r, c])
          const isTarget = targets.has(index)
          const isCapture = isTarget && Boolean(piece)
          const isLast = game.lastMove
            ? sameSquare(game.lastMove.from, [r, c]) || sameSquare(game.lastMove.to, [r, c])
            : false
          const isCheck = sameSquare(checkedKing, [r, c])
          const classes = [
            'ic-chess-sq',
            dark ? 'dark' : 'light',
            isSelected ? 'sel' : '',
            isTarget ? 'target' : '',
            isCapture ? 'capture' : '',
            isLast ? 'last' : '',
            isCheck ? 'check' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={index}
              type="button"
              className={classes}
              aria-label={squareLabel(r, c)}
              aria-pressed={isSelected || undefined}
              onClick={() => handleSquare(r, c)}
            >
              {piece && (
                <span
                  className={`ic-chess-piece ${colorOf(piece) === WHITE ? 'white' : 'black'}`}
                  aria-hidden="true"
                >
                  {glyphFor(piece)}
                </span>
              )}
              {isTarget && !piece && <span className="ic-chess-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      {capturedRow(WHITE)}

      {pendingPromotion && (
        <div className="ic-chess-promo" role="group" aria-label={t('chess.promotion.title')}>
          <span>{t('chess.promotion.title')}</span>
          <div className="ic-chess-promo-row">
            {PROMOTION_PIECES.map((promotion) => (
              <button
                key={promotion}
                type="button"
                className="btn btn-soft btn-sm ic-chess-promo-btn"
                onClick={() => choosePromotion(promotion)}
              >
                <span className="ic-chess-piece white" aria-hidden="true">{GLYPHS[promotion]}</span>
                {t(`chess.promotion.${PROMOTION_NAMES[promotion]}`)}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setPendingPromotion(null)
                setSelected(null)
              }}
            >
              {t('chess.promotion.cancel')}
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="ic-chess-over">
          <b>{statusText}</b>
          <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
            {t('chess.actions.newGame')}
          </button>
        </div>
      )}

      <p className="puzzle-hint">{t('chess.hint')}</p>
    </div>
  )
}
