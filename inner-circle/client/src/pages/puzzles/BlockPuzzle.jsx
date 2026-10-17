import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'

const GRID_SIZE = 9
const EMPTY = 0
const FILLED = 1

const SHAPES = [
  { key: 'I3', cells: [[0,0],[0,1],[0,2]] },
  { key: 'L', cells: [[0,0],[1,0],[2,0],[2,1]] },
  { key: 'O', cells: [[0,0],[0,1],[1,0],[1,1]] },
  { key: 'I2', cells: [[0,0],[0,1]] },
]

function cloneGrid(grid) {
  return grid.map(row => [...row])
}

function rotateShape(cells) {
  const rotated = cells.map(([r, c]) => [c, -r])
  const minR = Math.min(...rotated.map(([r]) => r))
  const minC = Math.min(...rotated.map(([, c]) => c))
  return rotated.map(([r, c]) => [r - minR, c - minC])
}

function getRandomPieces(count = 3) {
  const pieces = []
  for (let i = 0; i < count; i++) {
    const base = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    let cells = base.cells.map((cell) => [...cell])
    const turns = Math.floor(Math.random() * 4)
    for (let t = 0; t < turns; t++) cells = rotateShape(cells)
    pieces.push({ key: `${base.key}-${i}`, cells })
  }
  return pieces
}

function canPlace(grid, piece, dr, dc) {
  for (const [r,c] of piece.cells) {
    const nr = r + dr, nc = c + dc
    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false
    if (grid[nr][nc] !== EMPTY) return false
  }
  return true
}

export default function BlockPuzzle({ onComplete }) {
  const { t } = useI18n()
  const [grid, setGrid] = useState(() => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY)))
  const [pieces, setPieces] = useState(() => getRandomPieces(3))
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const completedRef = useRef(false)

  const checkGameOver = useCallback((g, p) => {
    for (let pr = 0; pr < p.length; pr++) {
      const piece = p[pr]
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlace(g, piece, r, c)) return false
        }
      }
    }
    return true
  }, [])

  useEffect(() => {
    if (!gameOver && checkGameOver(grid, pieces)) {
      setGameOver(true)
    }
  }, [grid, pieces, gameOver, checkGameOver])

  useEffect(() => {
    if (gameOver && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [gameOver, onComplete])

  const handleCellClick = (r, c) => {
    if (gameOver) return
    if (selected == null) return
    const piece = pieces[selected]
    if (!piece) return
    if (canPlace(grid, piece, r, c)) {
      const nextGrid = cloneGrid(grid)
      for (const [pr, pc] of piece.cells) {
        nextGrid[r + pr][c + pc] = FILLED
      }
      let cleared = 0
      for (let i = 0; i < GRID_SIZE; i++) {
        const fullRow = nextGrid[i].every(v => v === FILLED)
        if (fullRow) {
          for (let j = 0; j < GRID_SIZE; j++) nextGrid[i][j] = EMPTY
          cleared += 10
        }
        const fullCol = Array(GRID_SIZE).fill().every((_, rr) => nextGrid[rr][i] === FILLED)
        if (fullCol) {
          for (let rr = 0; rr < GRID_SIZE; rr++) nextGrid[rr][i] = EMPTY
          cleared += 10
        }
      }
      setScore(s => s + 5 + cleared)
      const remaining = pieces.filter((_, i) => i !== selected)
      setPieces(remaining.length ? remaining : getRandomPieces(3))
      setSelected(null)
      setGrid(nextGrid)
    }
  }

  const validCells = useMemo(() => {
    if (gameOver || selected == null) return new Set()
    const piece = pieces[selected]
    const set = new Set()
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlace(grid, piece, r, c)) set.add(r * GRID_SIZE + c)
      }
    }
    return set
  }, [grid, pieces, selected, gameOver])

  const newGame = () => {
    completedRef.current = false
    setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY)))
    setPieces(getRandomPieces(3))
    setScore(0)
    setSelected(null)
    setGameOver(false)
  }

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <div className="puzzle-controls">
          <span className="puzzle-stat">{t('puzzles.block.stat', { score })}</span>
          {gameOver && <span className="error-message">{t('puzzles.block.noMoves')}</span>}
        </div>
        <div className="puzzle-controls">
          <button type="button" className="btn btn-ghost btn-sm" onClick={newGame}>
            {t('puzzles.block.newGame')}
          </button>
        </div>
      </div>

      <div className="puzzle-board block-grid" role="grid" aria-label={t('puzzles.block.boardLabel')}>
        {Array(GRID_SIZE * GRID_SIZE).fill().map((_, i) => {
          const r = Math.floor(i / GRID_SIZE), c = i % GRID_SIZE
          const filled = grid[r][c] === FILLED
          const valid = validCells.has(i)
          return (
            <button
              key={i}
              type="button"
              className={`tile-btn ${filled ? 'filled' : ''} ${valid ? 'valid' : ''}`}
              onClick={() => handleCellClick(r, c)}
              aria-label={t('puzzles.block.cellLabel', { row: r + 1, col: c + 1 })}
              disabled={gameOver}
            />
          )
        })}
      </div>

      <div className="puzzle-controls">
        {pieces.map((piece, idx) => (
          <button
            key={piece.key}
            type="button"
            className={`btn btn-outline btn-sm ${selected === idx ? 'btn-primary' : ''}`}
            onClick={() => setSelected(selected === idx ? null : idx)}
            disabled={gameOver}
          >
            {t('puzzles.block.piece', { n: idx + 1, cells: piece.cells.length })}
          </button>
        ))}
      </div>
      <p className="puzzle-hint">{t('puzzles.block.hint')}</p>
    </div>
  )
}
