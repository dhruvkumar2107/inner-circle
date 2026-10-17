// A small, dependency-free chess engine for the Inner Circle chess puzzle.
//
// Board model: an 8x8 array of single-character pieces.
//   Uppercase = white (K Q R B N P), lowercase = black (k q r b n p), '' = empty.
// Square model: [row, col], where row 0 is rank 8 (the top row, where black starts)
//   and col 0 is file 'a'. So the white king starts at [7, 4].
//
// Everything here is pure: functions take a state and return a new state.

export const WHITE = 'w'
export const BLACK = 'b'

export const other = (color) => (color === WHITE ? BLACK : WHITE)

const KNIGHT_DELTAS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1],
]
const DIAGONALS = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const ORTHOGONALS = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const KING_DELTAS = [...DIAGONALS, ...ORTHOGONALS]

export const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

export const colorOf = (piece) => (piece === piece.toUpperCase() ? WHITE : BLACK)

const isType = (piece, type, color) =>
  piece !== '' && piece.toLowerCase() === type && (!color || colorOf(piece) === color)

/** `e4`, `d1`, ... for a [row, col] square. */
export const squareName = (r, c) => 'abcdefgh'[c] + (8 - r)

const cloneBoard = (board) => board.map((row) => row.slice())

export function initialState() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(''))
  board[0] = 'rnbqkbnr'.split('')
  board[1] = Array(8).fill('p')
  board[6] = Array(8).fill('P')
  board[7] = 'RNBQKBNR'.split('')
  return {
    board,
    turn: WHITE,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
    captured: { w: [], b: [] },
    lastMove: null,
  }
}

export function cloneState(state) {
  return {
    ...state,
    board: cloneBoard(state.board),
    castling: { ...state.castling },
    enPassant: state.enPassant ? [...state.enPassant] : null,
    captured: { w: state.captured.w.slice(), b: state.captured.b.slice() },
  }
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isType(board[r][c], 'k', color)) return [r, c]
    }
  }
  return null
}

/** Is square [r, c] attacked by any piece of `by`? */
export function isSquareAttacked(board, r, c, by) {
  const pawnRow = by === WHITE ? r + 1 : r - 1
  if (inside(pawnRow, c - 1) && isType(board[pawnRow][c - 1], 'p', by)) return true
  if (inside(pawnRow, c + 1) && isType(board[pawnRow][c + 1], 'p', by)) return true

  for (const [dr, dc] of KNIGHT_DELTAS) {
    const rr = r + dr
    const cc = c + dc
    if (inside(rr, cc) && isType(board[rr][cc], 'n', by)) return true
  }

  for (const [dr, dc] of KING_DELTAS) {
    const rr = r + dr
    const cc = c + dc
    if (inside(rr, cc) && isType(board[rr][cc], 'k', by)) return true
  }

  for (const [dr, dc] of ORTHOGONALS) {
    let rr = r + dr
    let cc = c + dc
    while (inside(rr, cc)) {
      const piece = board[rr][cc]
      if (piece) {
        if ((piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') && colorOf(piece) === by) return true
        break
      }
      rr += dr
      cc += dc
    }
  }

  for (const [dr, dc] of DIAGONALS) {
    let rr = r + dr
    let cc = c + dc
    while (inside(rr, cc)) {
      const piece = board[rr][cc]
      if (piece) {
        if ((piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q') && colorOf(piece) === by) return true
        break
      }
      rr += dr
      cc += dc
    }
  }

  return false
}

export function inCheck(board, color) {
  const king = findKing(board, color)
  if (!king) return false
  return isSquareAttacked(board, king[0], king[1], other(color))
}

function addPawnMove(list, from, to, piece, captured, promote) {
  if (promote) {
    for (const promotion of ['q', 'r', 'b', 'n']) {
      list.push({ from, to, piece, captured, promotion })
    }
  } else {
    list.push({ from, to, piece, captured })
  }
}

function addCastling(list, state, color, r, c) {
  if (c !== 4) return
  const homeRow = color === WHITE ? 7 : 0
  if (r !== homeRow) return
  if (inCheck(state.board, color)) return

  const enemy = other(color)
  const rights = state.castling
  const board = state.board

  if (color === WHITE ? rights.wK : rights.bK) {
    const rook = board[homeRow][7]
    if (!board[homeRow][5] && !board[homeRow][6] && isType(rook, 'r', color)) {
      if (
        !isSquareAttacked(board, homeRow, 5, enemy) &&
        !isSquareAttacked(board, homeRow, 6, enemy)
      ) {
        list.push({ from: [r, c], to: [homeRow, 6], piece: board[r][c], castle: 'K' })
      }
    }
  }

  if (color === WHITE ? rights.wQ : rights.bQ) {
    const rook = board[homeRow][0]
    if (!board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3] && isType(rook, 'r', color)) {
      if (
        !isSquareAttacked(board, homeRow, 3, enemy) &&
        !isSquareAttacked(board, homeRow, 2, enemy)
      ) {
        list.push({ from: [r, c], to: [homeRow, 2], piece: board[r][c], castle: 'Q' })
      }
    }
  }
}

/** Pseudo-legal moves (they may leave the king in check). */
export function generatePseudoMoves(state, color = state.turn) {
  const { board } = state
  const moves = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || colorOf(piece) !== color) continue
      const type = piece.toLowerCase()

      if (type === 'p') {
        const dr = color === WHITE ? -1 : 1
        const startRow = color === WHITE ? 6 : 1
        const promoRow = color === WHITE ? 0 : 7
        const oneR = r + dr

        if (inside(oneR, c) && !board[oneR][c]) {
          addPawnMove(moves, [r, c], [oneR, c], piece, null, oneR === promoRow)
          const twoR = r + 2 * dr
          if (r === startRow && !board[twoR][c]) {
            moves.push({ from: [r, c], to: [twoR, c], piece, captured: null, double: true })
          }
        }

        for (const dc of [-1, 1]) {
          const cc = c + dc
          if (!inside(oneR, cc)) continue
          const target = board[oneR][cc]
          if (target && colorOf(target) !== color) {
            addPawnMove(moves, [r, c], [oneR, cc], piece, target, oneR === promoRow)
          } else if (!target && state.enPassant && state.enPassant[0] === oneR && state.enPassant[1] === cc) {
            moves.push({ from: [r, c], to: [oneR, cc], piece, captured: board[r][cc], enPassant: true })
          }
        }
      } else if (type === 'n' || type === 'k') {
        const deltas = type === 'n' ? KNIGHT_DELTAS : KING_DELTAS
        for (const [dr, dc] of deltas) {
          const rr = r + dr
          const cc = c + dc
          if (!inside(rr, cc)) continue
          const target = board[rr][cc]
          if (target && colorOf(target) === color) continue
          moves.push({ from: [r, c], to: [rr, cc], piece, captured: target || null })
        }
        if (type === 'k') addCastling(moves, state, color, r, c)
      } else {
        const deltas = type === 'b' ? DIAGONALS : type === 'r' ? ORTHOGONALS : KING_DELTAS
        for (const [dr, dc] of deltas) {
          let rr = r + dr
          let cc = c + dc
          while (inside(rr, cc)) {
            const target = board[rr][cc]
            if (!target) {
              moves.push({ from: [r, c], to: [rr, cc], piece, captured: null })
            } else {
              if (colorOf(target) !== color) {
                moves.push({ from: [r, c], to: [rr, cc], piece, captured: target })
              }
              break
            }
            rr += dr
            cc += dc
          }
        }
      }
    }
  }

  return moves
}

/** Apply a move and return a brand-new state. Handles castling, en passant, promotion. */
export function makeMove(state, move) {
  const board = cloneBoard(state.board)
  const piece = board[move.from[0]][move.from[1]]
  const color = colorOf(piece)
  const type = piece.toLowerCase()

  const captured = { w: state.captured.w.slice(), b: state.captured.b.slice() }
  let capturedPiece = null

  if (move.enPassant) {
    capturedPiece = board[move.from[0]][move.to[1]]
    board[move.from[0]][move.to[1]] = ''
  } else if (board[move.to[0]][move.to[1]]) {
    capturedPiece = board[move.to[0]][move.to[1]]
  }
  if (capturedPiece) captured[color].push(capturedPiece)

  board[move.from[0]][move.from[1]] = ''
  board[move.to[0]][move.to[1]] = move.promotion
    ? color === WHITE
      ? move.promotion.toUpperCase()
      : move.promotion
    : piece

  if (move.castle) {
    const homeRow = color === WHITE ? 7 : 0
    if (move.castle === 'K') {
      board[homeRow][5] = board[homeRow][7]
      board[homeRow][7] = ''
    } else {
      board[homeRow][3] = board[homeRow][0]
      board[homeRow][0] = ''
    }
  }

  const castling = { ...state.castling }
  if (type === 'k') {
    if (color === WHITE) {
      castling.wK = false
      castling.wQ = false
    } else {
      castling.bK = false
      castling.bQ = false
    }
  }
  if (type === 'r') {
    if (move.from[1] === 0) {
      if (color === WHITE) castling.wQ = false
      else castling.bQ = false
    }
    if (move.from[1] === 7) {
      if (color === WHITE) castling.wK = false
      else castling.bK = false
    }
  }
  if (capturedPiece && capturedPiece.toLowerCase() === 'r') {
    const rookColor = colorOf(capturedPiece)
    const rookRow = rookColor === WHITE ? 7 : 0
    if (move.to[0] === rookRow && move.to[1] === 0) {
      if (rookColor === WHITE) castling.wQ = false
      else castling.bQ = false
    }
    if (move.to[0] === rookRow && move.to[1] === 7) {
      if (rookColor === WHITE) castling.wK = false
      else castling.bK = false
    }
  }

  const enPassant =
    type === 'p' && Math.abs(move.to[0] - move.from[0]) === 2
      ? [(move.from[0] + move.to[0]) / 2, move.from[1]]
      : null

  return {
    board,
    turn: other(color),
    castling,
    enPassant,
    halfmove: type === 'p' || capturedPiece ? 0 : state.halfmove + 1,
    fullmove: color === BLACK ? state.fullmove + 1 : state.fullmove,
    captured,
    lastMove: move,
  }
}

/** Fully legal moves for the side to move. */
export function generateMoves(state, color = state.turn) {
  const legal = []
  for (const move of generatePseudoMoves(state, color)) {
    const next = makeMove(state, move)
    if (!inCheck(next.board, color)) legal.push(move)
  }
  return legal
}

function insufficientMaterial(board) {
  const pieces = { w: 0, b: 0 }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece) continue
      const type = piece.toLowerCase()
      if (type === 'p' || type === 'r' || type === 'q') return false
      if (type !== 'k') pieces[colorOf(piece)] += 1
    }
  }
  if (pieces.w === 0 && pieces.b === 0) return true
  if (pieces.w <= 1 && pieces.b === 0) return true
  if (pieces.b <= 1 && pieces.w === 0) return true
  return false
}

/** `checkmate`, `stalemate`, `check`, `draw` or `playing`, plus the winner when relevant. */
export function getGameStatus(state) {
  const moves = generateMoves(state)
  const check = inCheck(state.board, state.turn)

  if (moves.length === 0) {
    if (check) return { type: 'checkmate', winner: other(state.turn) }
    return { type: 'stalemate' }
  }
  if (state.halfmove >= 100) return { type: 'draw', reason: 'fifty' }
  if (insufficientMaterial(state.board)) return { type: 'draw', reason: 'material' }
  if (check) return { type: 'check' }
  return { type: 'playing' }
}

/** A string that is identical for identical positions (used for repetition draws). */
export function positionKey(state) {
  const rows = state.board.map((row) => row.map((p) => p || '.').join('')).join('/')
  const rights =
    (state.castling.wK ? 'K' : '') +
    (state.castling.wQ ? 'Q' : '') +
    (state.castling.bK ? 'k' : '') +
    (state.castling.bQ ? 'q' : '')
  return `${rows}|${state.turn}|${rights}|${state.enPassant ? state.enPassant.join('') : '-'}`
}

// ----------------------------- the computer ---------------------------------

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
]
const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
]
const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
]
const ROOK_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
]
const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
]
const KING_PST = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
]
const PST = { p: PAWN_PST, n: KNIGHT_PST, b: BISHOP_PST, r: ROOK_PST, q: QUEEN_PST, k: KING_PST }

/** Static score in centipawns, always from white's point of view. */
function evaluate(state) {
  let score = 0
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c]
      if (!piece) continue
      const type = piece.toLowerCase()
      const white = colorOf(piece) === WHITE
      const pst = white ? PST[type][r][c] : PST[type][7 - r][c]
      score += (white ? 1 : -1) * (VALUE[type] + pst)
    }
  }
  const whiteMoves = generateMoves(state, WHITE).length
  const blackMoves = generateMoves(state, BLACK).length
  score += (whiteMoves - blackMoves) * 2
  return score
}

function evaluateSideToMove(state) {
  const raw = evaluate(state)
  return state.turn === WHITE ? raw : -raw
}

function moveScore(move) {
  let score = 0
  if (move.captured) score += 10 + VALUE[move.captured.toLowerCase()]
  if (move.promotion) score += 800
  if (move.castle) score += 5
  return score
}

function ordered(moves) {
  return moves.slice().sort((a, b) => moveScore(b) - moveScore(a))
}

function negamax(state, depth, alpha, beta) {
  if (depth === 0) return evaluateSideToMove(state)

  const moves = ordered(generateMoves(state))
  if (moves.length === 0) {
    if (inCheck(state.board, state.turn)) return -90000 - depth
    return 0
  }

  let best = -Infinity
  for (const move of moves) {
    const next = makeMove(state, move)
    const score = -negamax(next, depth - 1, -beta, -alpha)
    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

/** Pick the computer's move with an alpha-beta minimax search. */
export function chooseMove(state, depth = 2) {
  const moves = ordered(generateMoves(state))
  if (moves.length === 0) return null

  let best = -Infinity
  let bestMoves = []
  let alpha = -Infinity

  for (const move of moves) {
    const next = makeMove(state, move)
    const score = -negamax(next, depth - 1, -Infinity, -alpha)
    if (score > best) {
      best = score
      bestMoves = [move]
    } else if (score === best) {
      bestMoves.push(move)
    }
    if (best > alpha) alpha = best
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}
