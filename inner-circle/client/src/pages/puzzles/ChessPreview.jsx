import { Badge, Note } from '../../components/ui'

const BOARD = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R'],
]

const PIECES = {
  r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟',
  R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙',
}

export default function ChessPreview() {
  return (
    <div className="puzzle-preview">
      <div className="puzzle-controls spread">
        <Badge tone="demo">Planned</Badge>
        <span className="puzzle-hint">Planned for v2</span>
      </div>
      <div className="preview-board" aria-label="Chess starting position preview">
        {BOARD.flatMap((row, r) =>
          row.map((piece, c) => {
            const dark = (r + c) % 2 === 1
            return (
              <div key={`${r}-${c}`} className={`preview-square ${dark ? 'dark' : 'light'}`} aria-hidden="true">
                {piece ? PIECES[piece] : ''}
              </div>
            )
          })
        )}
      </div>
      <Note tone="grey">
        This prototype does not include a chess engine yet. An authorised integration will be connected later.
      </Note>
    </div>
  )
}
