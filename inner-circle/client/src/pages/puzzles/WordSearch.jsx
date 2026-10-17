import { useEffect, useRef, useState } from 'react'

const SIZE = 12
const WORDS = ['CALM', 'FOCUS', 'BREATHE', 'GENTLE', 'STEADY', 'LISTEN', 'REFLECT', 'RESET']
const DIRS = [[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]]

const randChar = () => String.fromCharCode(65 + Math.floor(Math.random() * 26))

function reverse(value) {
  return value.split('').reverse().join('')
}

function generateGrid() {
  const grid = Array(SIZE).fill().map(() => Array(SIZE).fill(''))
  for (const word of WORDS) {
    for (let tries = 0; tries < 200; tries++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)]
      const r0 = Math.floor(Math.random() * SIZE)
      const c0 = Math.floor(Math.random() * SIZE)
      const endR = r0 + dr * (word.length - 1)
      const endC = c0 + dc * (word.length - 1)
      if (endR < 0 || endR >= SIZE || endC < 0 || endC >= SIZE) continue
      let fits = true
      for (let i = 0; i < word.length; i++) {
        const cell = grid[r0 + dr * i][c0 + dc * i]
        if (cell && cell !== word[i]) { fits = false; break }
      }
      if (!fits) continue
      for (let i = 0; i < word.length; i++) grid[r0 + dr * i][c0 + dc * i] = word[i]
      break
    }
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = randChar()
    }
  }
  return grid
}

function pathBetween(a, b) {
  const dr = Math.sign(b.r - a.r)
  const dc = Math.sign(b.c - a.c)
  if (dr === 0 && dc === 0) return null
  if (dr !== 0 && dc !== 0 && Math.abs(b.r - a.r) !== Math.abs(b.c - a.c)) return null
  const len = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c))
  const cells = []
  for (let i = 0; i <= len; i++) cells.push({ r: a.r + dr * i, c: a.c + dc * i })
  return cells
}

export default function WordSearch({ onComplete }) {
  const [grid, setGrid] = useState(generateGrid)
  const [selected, setSelected] = useState([])
  const [found, setFound] = useState([])
  const completedRef = useRef(false)

  useEffect(() => {
    if (found.length === WORDS.length && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [found, onComplete])

  const reset = () => {
    setGrid(generateGrid())
    setSelected([])
    setFound([])
    completedRef.current = false
  }

  const handleClick = (r, c) => {
    const cell = { r, c }
    if (selected.length === 1) {
      const path = pathBetween(selected[0], cell)
      if (path) {
        const text = path.map((p) => grid[p.r][p.c]).join('')
        const match = WORDS.find((w) => w === text || w === reverse(text))
        if (match && !found.some((f) => f.word === match)) {
          setFound((list) => [...list, { word: match, cells: path }])
          setSelected([])
          return
        }
      }
    }
    setSelected([cell])
  }

  const isSelected = (r, c) => selected.some((p) => p.r === r && p.c === c)
  const isFoundCell = (r, c) => found.some((f) => f.cells.some((p) => p.r === r && p.c === c))
  const isFoundWord = (word) => found.some((f) => f.word === word)

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <span className="puzzle-stat">Found: {found.length}/{WORDS.length}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={reset}>New puzzle</button>
      </div>

      {found.length === WORDS.length && <div className="status-message">All words found</div>}

      <div className="puzzle-board ws-grid" role="grid" aria-label="Word search grid">
        {Array(SIZE).fill().map((_, r) =>
          Array(SIZE).fill().map((_, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              className={`tile-btn ${isSelected(r, c) ? 'ws-selected' : ''} ${isFoundCell(r, c) ? 'ws-found' : ''}`}
              onClick={() => handleClick(r, c)}
              aria-label={`Letter ${grid[r][c]}`}
            >
              {grid[r][c]}
            </button>
          ))
        )}
      </div>

      <div className="word-list">
        {WORDS.map((word) => (
          <span key={word} className={`word-pill ${isFoundWord(word) ? 'found' : ''}`}>{word}</span>
        ))}
      </div>
      <p className="puzzle-hint">Click the first letter, then the last letter of a word along a straight line.</p>
    </div>
  )
}
