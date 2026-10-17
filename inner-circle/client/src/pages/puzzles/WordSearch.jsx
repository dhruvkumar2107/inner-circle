import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'

const SIZE = 12
const WORD_COUNT = 8
const DIRS = [[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]]

function reverse(value) {
  return value.split('').reverse().join('')
}

function generateGrid(words, fill) {
  const randChar = () => fill[Math.floor(Math.random() * fill.length)]
  const grid = Array(SIZE).fill().map(() => Array(SIZE).fill(''))
  for (const word of words) {
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
  const { t, lang } = useI18n()
  const words = useMemo(
    () => Array.from({ length: WORD_COUNT }, (_, i) => t(`puzzles.wordSearch.words.${i}`)),
    [t],
  )
  const fill = t('puzzles.wordSearch.fill')
  const [grid, setGrid] = useState(() => generateGrid(words, fill))
  const [selected, setSelected] = useState([])
  const [found, setFound] = useState([])
  const completedRef = useRef(false)

  useEffect(() => {
    setGrid(generateGrid(words, fill))
    setSelected([])
    setFound([])
    completedRef.current = false
  }, [lang, words, fill])

  useEffect(() => {
    if (found.length === words.length && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [found, words, onComplete])

  const reset = () => {
    setGrid(generateGrid(words, fill))
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
        const match = words.find((w) => w === text || w === reverse(text))
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
        <span className="puzzle-stat">{t('puzzles.wordSearch.found', { found: found.length, total: words.length })}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={reset}>{t('puzzles.wordSearch.newPuzzle')}</button>
      </div>

      {found.length === words.length && <div className="status-message">{t('puzzles.wordSearch.allFound')}</div>}

      <div className="puzzle-board ws-grid" role="grid" aria-label={t('puzzles.wordSearch.gridLabel')}>
        {Array(SIZE).fill().map((_, r) =>
          Array(SIZE).fill().map((_, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              className={`tile-btn ${isSelected(r, c) ? 'ws-selected' : ''} ${isFoundCell(r, c) ? 'ws-found' : ''}`}
              onClick={() => handleClick(r, c)}
              aria-label={t('puzzles.wordSearch.letterLabel', { letter: grid[r][c] })}
            >
              {grid[r][c]}
            </button>
          ))
        )}
      </div>

      <div className="word-list">
        {words.map((word) => (
          <span key={word} className={`word-pill ${isFoundWord(word) ? 'found' : ''}`}>{word}</span>
        ))}
      </div>
      <p className="puzzle-hint">{t('puzzles.wordSearch.hint')}</p>
    </div>
  )
}
