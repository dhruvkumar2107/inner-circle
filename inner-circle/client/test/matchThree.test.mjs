import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SIZE, adjacent, collapse, findMatches, makeBoard, resolveBoard, swap,
} from '../src/lib/matchThree.js'

const at = (r, c) => r * SIZE + c

/** Builds a board from a string grid, where each character is a tile value. */
function grid(rows) {
  const letters = new Map()
  let next = 0
  return rows.flatMap((row) => [...row].map((ch) => {
    if (!letters.has(ch)) letters.set(ch, next++)
    return letters.get(ch)
  }))
}

test('adjacency accepts edge-sharing neighbours and rejects diagonals and distance', () => {
  assert.ok(adjacent(at(0, 0), at(0, 1)), 'horizontal neighbour is adjacent')
  assert.ok(adjacent(at(0, 0), at(1, 0)), 'vertical neighbour is adjacent')
  assert.ok(!adjacent(at(0, 0), at(1, 1)), 'diagonal is not adjacent')
  assert.ok(!adjacent(at(0, 0), at(0, 2)), 'distance two is not adjacent')
  assert.ok(!adjacent(at(0, 0), at(0, 0)), 'the same tile is not adjacent to itself')
})

test('makeBoard produces a full board with no pre-existing matches', () => {
  for (let i = 0; i < 40; i += 1) {
    const board = makeBoard()
    assert.equal(board.length, SIZE * SIZE, 'board must hold SIZE * SIZE tiles')
    assert.ok(board.every((v) => Number.isInteger(v)), 'every tile holds an index')
    assert.equal(findMatches(board).size, 0, 'a fresh board must not already contain a line of three')
  }
})

test('findMatches detects horizontal and vertical runs of three or more', () => {
  const horizontal = grid([
    'aaabcd',
    'bcdeaf',
    'cdefag',
    'defabh',
    'efabci',
    'fabcde',
  ])
  const hSet = findMatches(horizontal)
  assert.ok(hSet.has(at(0, 0)) && hSet.has(at(0, 1)) && hSet.has(at(0, 2)), 'the horizontal triple is matched')
  assert.ok(!hSet.has(at(0, 3)), 'the fourth tile is not part of a run of three')

  const vertical = grid([
    'abcdef',
    'bbcdef',
    'cbcdef',
    'dbcdef',
    'ebcdef',
    'fbcdef',
  ])
  const vSet = findMatches(vertical)
  assert.ok(vSet.has(at(0, 1)) && vSet.has(at(1, 1)) && vSet.has(at(2, 1)), 'the vertical triple is matched')

  const none = grid([
    'abcabc',
    'bcabca',
    'cabcab',
    'abcabc',
    'bcabca',
    'cabcab',
  ])
  assert.equal(findMatches(none).size, 0, 'a board without runs returns no matches')
})

test('collapse drops surviving tiles and refills from the top', () => {
  const board = grid([
    'aaabcd',
    'bbbbcd',
    'cccddd',
    'dddddd',
    'eeeeee',
    'ffffff',
  ])
  const matched = findMatches(board)
  assert.ok(matched.size > 0, 'the sample board has matches to clear')
  const next = collapse(board, matched)
  assert.equal(next.length, board.length, 'collapse keeps the board size')
  assert.ok(next.every((v) => v !== null && v !== undefined), 'collapse refills every hole')
  assert.notEqual(next, board, 'collapse returns a new board, leaving the input unchanged')
})

test('swap exchanges exactly two tiles and is its own inverse', () => {
  const board = makeBoard()
  const a = at(2, 2)
  const b = at(2, 3)
  const swapped = swap(board, a, b)
  assert.equal(swapped[a], board[b], 'first tile takes the second value')
  assert.equal(swapped[b], board[a], 'second tile takes the first value')
  assert.deepEqual(swap(swapped, a, b), board, 'swapping back restores the original board')
  assert.notEqual(swapped, board, 'swap returns a new array, leaving the input unchanged')
})

test('resolveBoard clears matches, cascades and reports score and chain length', () => {
  const board = grid([
    'aaabcd',
    'bbbecd',
    'cccedd',
    'dddddd',
    'eeeeee',
    'ffffff',
  ])
  const { board: settled, gained, chain } = resolveBoard(board)
  assert.ok(gained > 0, 'clearing matches scores points')
  assert.ok(chain >= 1, 'at least one cascade chain resolved')
  assert.equal(findMatches(settled).size, 0, 'resolution settles the board with no runs left')
})

test('resolveBoard leaves a quiet board untouched', () => {
  const board = makeBoard()
  const { board: settled, gained, chain } = resolveBoard(board)
  assert.equal(gained, 0, 'no matches means no score')
  assert.equal(chain, 0, 'no matches means no chain')
  assert.deepEqual(settled, board, 'a board without matches is returned unchanged')
})
