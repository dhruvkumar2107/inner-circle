/**
 * Pure match-three rules, kept out of the React component so the board logic
 * (generation, match detection, collapse/refill and adjacency) can be unit
 * tested directly. The board is a flat array of SIZE * SIZE tile indices,
 * read row-major.
 */

export const SIZE = 6
export const TILES = ['#6e9169', '#a7c9a4', '#efe2bc', '#a9c6d9', '#dcae55', '#c07f7a']

export const pick = () => Math.floor(Math.random() * TILES.length)

export const rowOf = (i) => Math.floor(i / SIZE)
export const colOf = (i) => i % SIZE

/** True only for orthogonally neighbouring tiles (no diagonals). */
export const adjacent = (a, b) => {
  const ar = rowOf(a)
  const ac = colOf(a)
  const br = rowOf(b)
  const bc = colOf(b)
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1
}

/** A fresh board with no pre-existing runs of three. */
export function makeBoard() {
  const b = []
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const row = rowOf(i)
    const col = colOf(i)
    const banned = new Set()
    if (col >= 2 && b[i - 1] === b[i - 2]) banned.add(b[i - 1])
    if (row >= 2 && b[i - SIZE] === b[i - SIZE * 2]) banned.add(b[i - SIZE])
    let v = pick()
    while (banned.has(v)) v = pick()
    b.push(v)
  }
  return b
}

/** Set of indices that belong to a horizontal or vertical run of three or more. */
export function findMatches(b) {
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

/** Clears matched tiles and lets the rest fall, refilling the top of each column. */
export function collapse(b, matched) {
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

/** Returns a new board with two tiles swapped. */
export function swap(board, a, b) {
  const next = board.slice()
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

/** Resolves every match, cascading, and returns the final board plus score. */
export function resolveBoard(startBoard) {
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
  return { board: b, gained, chain }
}
