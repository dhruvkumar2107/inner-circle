import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  initialState,
  generateMoves,
  makeMove,
  getGameStatus,
  positionKey,
  chooseMove,
  inCheck,
  WHITE,
  BLACK,
} from '../src/pages/puzzles/chess/engine.js'

const COLS = 'abcdefgh'
const sq = (name) => [8 - Number(name[1]), COLS.indexOf(name[0])]

function fromFEN(fen) {
  const [placement, turn, castling, ep, halfmove, fullmove] = fen.split(' ')
  const board = placement.split('/').map((row) => {
    const out = []
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') for (let i = 0; i < Number(ch); i++) out.push('')
      else out.push(ch)
    }
    assert.equal(out.length, 8, `FEN rank "${row}" must fill 8 squares`)
    return out
  })
  let enPassant = null
  if (ep && ep !== '-') enPassant = sq(ep)
  return {
    board,
    turn: turn === 'w' ? WHITE : BLACK,
    castling: {
      wK: castling.includes('K'),
      wQ: castling.includes('Q'),
      bK: castling.includes('k'),
      bQ: castling.includes('q'),
    },
    enPassant,
    halfmove: Number(halfmove ?? 0),
    fullmove: Number(fullmove ?? 1),
    captured: { w: [], b: [] },
    lastMove: null,
  }
}

/** Finds a legal move by from/to square names (and promotion piece when given). */
function moveBy(state, from, to, promotion) {
  const [fr, fc] = sq(from)
  const [tr, tc] = sq(to)
  const match = generateMoves(state).find(
    (m) =>
      m.from[0] === fr &&
      m.from[1] === fc &&
      m.to[0] === tr &&
      m.to[1] === tc &&
      (promotion ? m.promotion === promotion : !m.promotion || promotion),
  )
  assert.ok(match, `expected a legal move ${from}-${to}${promotion ? ` promoting to ${promotion}` : ''}`)
  return match
}

test('initial position is playable with the standard 20 legal moves', () => {
  const state = initialState()
  assert.equal(state.turn, WHITE)
  assert.equal(generateMoves(state).length, 20)
  assert.equal(getGameStatus(state).type, 'playing')
  assert.equal(inCheck(state.board, WHITE), false)
})

test('makeMove returns a fresh state and flips the turn', () => {
  const before = initialState()
  const snapshot = positionKey(before)
  const after = makeMove(before, moveBy(before, 'e2', 'e4'))

  assert.equal(before.turn, WHITE, 'original state must not be mutated')
  assert.equal(positionKey(before), snapshot, 'original position key must be unchanged')
  assert.equal(after.turn, BLACK)
  assert.notEqual(positionKey(after), snapshot)
})

test('no generated move ever leaves the mover in check', () => {
  for (const fen of [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    'rnbqkbnr/pp1ppppp/8/2pP4/8/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 3',
  ]) {
    const state = fromFEN(fen)
    for (const move of generateMoves(state)) {
      const next = makeMove(state, move)
      assert.equal(
        inCheck(next.board, state.turn),
        false,
        `${move.from.join(',')}->${move.to.join(',')} leaves ${state.turn} in check`,
      )
    }
  }
})

test('fools mate is recognised as checkmate with the right winner', () => {
  let state = initialState()
  const sequence = [
    ['f2', 'f3'],
    ['e7', 'e5'],
    ['g2', 'g4'],
    ['d8', 'h4'],
  ]
  for (const [from, to] of sequence) state = makeMove(state, moveBy(state, from, to))

  const status = getGameStatus(state)
  assert.equal(status.type, 'checkmate')
  assert.equal(status.winner, BLACK, 'black delivers mate in fools mate')
  assert.equal(state.turn, WHITE, 'the mated side is still on move')
})

test('a blocked king with no legal moves is stalemate, not checkmate', () => {
  const state = fromFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
  assert.equal(inCheck(state.board, BLACK), false, 'stalemate must not be check')
  assert.equal(generateMoves(state).length, 0)
  assert.deepEqual(getGameStatus(state), { type: 'stalemate' })
})

test('bare kings are an insufficient-material draw', () => {
  const state = fromFEN('8/8/8/4k3/8/8/8/4K3 w - - 0 1')
  assert.deepEqual(getGameStatus(state), { type: 'draw', reason: 'material' })
})

test('the fifty-move rule produces a draw', () => {
  const state = { ...initialState(), halfmove: 100 }
  assert.deepEqual(getGameStatus(state), { type: 'draw', reason: 'fifty' })
})

test('castling is offered for both sides and moves king and rook', () => {
  const state = fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
  const moves = generateMoves(state)

  const kingSide = moves.find((m) => m.castle === 'K' && m.from[1] === 4 && m.to[1] === 6)
  const queenSide = moves.find((m) => m.castle === 'Q' && m.from[1] === 4 && m.to[1] === 2)
  assert.ok(kingSide, 'king-side castling must be legal')
  assert.ok(queenSide, 'queen-side castling must be legal')

  const afterKing = makeMove(state, kingSide)
  assert.equal(afterKing.board[7][6], 'K', 'king ends on g1')
  assert.equal(afterKing.board[7][5], 'R', 'rook ends on f1')
  assert.equal(afterKing.board[7][7], '', 'h1 is vacated')
  assert.equal(afterKing.castling.wK, false, 'castling rights are lost')

  const afterQueen = makeMove(state, queenSide)
  assert.equal(afterQueen.board[7][2], 'K', 'king ends on c1')
  assert.equal(afterQueen.board[7][3], 'R', 'rook ends on d1')
  assert.equal(afterQueen.board[7][0], '', 'a1 is vacated')
})

test('en passant capture removes the passed pawn and records the capture', () => {
  const state = fromFEN('rnbqkbnr/pp1ppppp/8/2pP4/8/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 3')
  const capture = generateMoves(state).find(
    (m) => m.enPassant && m.from[0] === 3 && m.from[1] === 3 && m.to[0] === 2 && m.to[1] === 2,
  )
  assert.ok(capture, 'en passant from d5 to c6 must be generated')

  const after = makeMove(state, capture)
  assert.equal(after.board[2][2], 'P', 'capturing pawn lands on c6')
  assert.equal(after.board[2][3], '', 'the capturing pawn leaves d5')
  assert.equal(after.board[3][2], '', 'the passed black pawn on c5 is removed')
  assert.deepEqual(after.captured.w, ['p'], 'the pawn is recorded as captured by white')
})

test('promotion places a piece of the chosen kind on the last rank', () => {
  const state = fromFEN('8/P7/8/8/8/8/8/k1K5 w - - 0 1')
  const move = moveBy(state, 'a7', 'a8', 'q')
  const after = makeMove(state, move)

  assert.equal(after.board[0][0], 'Q', 'pawn promotes to a queen')
  assert.equal(after.board[1][0], '', 'the pawn leaves a7')

  for (const kind of ['q', 'r', 'b', 'n']) {
    assert.ok(
      generateMoves(state).some((m) => m.promotion === kind),
      `all four promotion choices must be generated (${kind})`,
    )
  }
})

test('the computer only ever picks a legal move', () => {
  const state = fromFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')
  const legal = generateMoves(state)
  const isLegal = (move) =>
    legal.some(
      (m) =>
        m.from[0] === move.from[0] &&
        m.from[1] === move.from[1] &&
        m.to[0] === move.to[0] &&
        m.to[1] === move.to[1],
    )

  for (let i = 0; i < 25; i += 1) {
    const pick = chooseMove(state, 2)
    assert.ok(pick, 'the engine must return a move')
    assert.ok(isLegal(pick), `the engine chose an illegal move: ${JSON.stringify(pick)}`)
  }
})

test('castling rights are dropped once the king moves', () => {
  const state = fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
  const after = makeMove(state, moveBy(state, 'e1', 'd1'))
  assert.equal(after.castling.wK, false)
  assert.equal(after.castling.wQ, false)
  assert.equal(after.castling.bK, true, 'black rights are untouched')
})
