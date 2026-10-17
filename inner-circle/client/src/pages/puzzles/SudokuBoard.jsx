import { useCallback, useEffect, useRef, useState } from 'react'

const SIZE = 9
const BOX = 3
const EMPTY = 0
const VISIBLE = 40

function clone(board) {
  return board.map(row => [...row])
}

function isValid(board, row, col, num) {
  for (let i = 0; i < SIZE; i++) {
    if (board[row][i] === num) return false
    if (board[i][col] === num) return false
  }
  const br = Math.floor(row/BOX)*BOX, bc = Math.floor(col/BOX)*BOX
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      if (board[br+r][bc+c] === num) return false
    }
  }
  return true
}

function shuffledNumbers() {
  const nums = []
  for (let n = 1; n <= SIZE; n++) nums.push(n)
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[nums[i], nums[j]] = [nums[j], nums[i]]
  }
  return nums
}

function solve(board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY) {
        for (const num of shuffledNumbers()) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num
            if (solve(board)) return true
            board[r][c] = EMPTY
          }
        }
        return false
      }
    }
  }
  return true
}

function hasConflict(grid, row, col, fixed) {
  const val = grid[row][col]
  if (val === EMPTY || fixed[row][col]) return false
  for (let i = 0; i < SIZE; i++) {
    if (i !== col && grid[row][i] === val) return true
    if (i !== row && grid[i][col] === val) return true
  }
  const br = Math.floor(row / BOX) * BOX
  const bc = Math.floor(col / BOX) * BOX
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      if ((br + r !== row || bc + c !== col) && grid[br + r][bc + c] === val) return true
    }
  }
  return false
}

function generatePuzzle() {
  const solution = Array(SIZE).fill().map(() => Array(SIZE).fill(EMPTY))
  solve(solution)
  const puzzle = clone(solution)
  const cells = []
  for (let i = 0; i < SIZE*SIZE; i++) cells.push(i)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  let removed = 0
  const toRemove = SIZE*SIZE - VISIBLE
  for (const idx of cells) {
    if (removed >= toRemove) break
    const r = Math.floor(idx/SIZE), c = idx%SIZE
    if (puzzle[r][c] !== EMPTY) {
      puzzle[r][c] = EMPTY
      removed++
    }
  }
  return { puzzle, solution }
}

export default function SudokuBoard({ onComplete }) {
  const [{ puzzle, solution }, setPuzzle] = useState(() => generatePuzzle())
  const [grid, setGrid] = useState(() => clone(puzzle))
  const [fixed, setFixed] = useState(() => {
    const f = Array(SIZE).fill().map(() => Array(SIZE).fill(false))
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        f[r][c] = puzzle[r][c] !== EMPTY
      }
    }
    return f
  })
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(null)
  const completedRef = useRef(false)

  const checkComplete = useCallback((g) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] !== solution[r][c]) return false
      }
    }
    return true
  }, [solution])

  useEffect(() => {
    if (checkComplete(grid) && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [grid, checkComplete, onComplete])

  const newPuzzle = () => {
    const p = generatePuzzle()
    setPuzzle(p)
    setGrid(clone(p.puzzle))
    setFixed(p.puzzle.map(row => row.map(v => v !== EMPTY)))
    setSelected(null)
    setCorrectCount(null)
    completedRef.current = false
  }

  const setValue = (num) => {
    if (selected == null) return
    const [r,c] = selected
    if (fixed[r][c]) return
    const next = clone(grid)
    next[r][c] = num
    setGrid(next)
    setCorrectCount(null)
  }

  const clearCell = () => {
    if (selected == null) return
    const [r,c] = selected
    if (fixed[r][c]) return
    const next = clone(grid)
    next[r][c] = EMPTY
    setGrid(next)
    setCorrectCount(null)
  }

  const check = () => {
    let c = 0
    for (let r = 0; r < SIZE; r++) {
      for (let c2 = 0; c2 < SIZE; c2++) {
        if (grid[r][c2] === solution[r][c2] && grid[r][c2] !== EMPTY) c++
      }
    }
    setCorrectCount(c)
  }

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <div className="puzzle-controls">
          <button type="button" className="btn btn-outline btn-sm" onClick={newPuzzle}>New puzzle</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={check}>Check</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearCell}>Clear</button>
        </div>
        {correctCount != null && <span className="puzzle-stat">Correct: {correctCount}</span>}
      </div>
      <div className="puzzle-board sudoku-grid" role="grid" aria-label="Sudoku board">
        {Array(SIZE*SIZE).fill().map((_, i) => {
          const r = Math.floor(i/SIZE), c = i%SIZE
          const val = grid[r][c] === EMPTY ? '' : grid[r][c]
          const isSel = selected && selected[0] === r && selected[1] === c
          const conflict = hasConflict(grid, r, c, fixed)
          return (
            <button
              key={i}
              type="button"
              className={`tile-btn ${isSel ? 'selected' : ''} ${conflict ? 'conflict' : ''}`}
              onClick={() => setSelected([r,c])}
              aria-label={`Cell ${r+1},${c+1}`}
            >
              {val}
            </button>
          )
        })}
      </div>
      <div className="puzzle-controls">
        {Array(SIZE).fill().map((_, i) => (
          <button key={i} type="button" className="piece-btn" onClick={() => setValue(i+1)}>{i+1}</button>
        ))}
      </div>
      <p className="puzzle-hint">Click cell, then number. Check compares against solution.</p>
    </div>
  )
}
