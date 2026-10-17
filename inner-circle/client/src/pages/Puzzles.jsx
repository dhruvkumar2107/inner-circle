import { useState } from 'react'
import { Brain, ChessKnight, Gamepad2, Grid3X3, Puzzle, Search, Sparkles, Leaf } from 'lucide-react'
import { Badge, Modal, Note, PageHeader } from '../components/ui'
import { useApp } from '../context/AppContext'
import './Puzzles.css'

import BlockPuzzle from './puzzles/BlockPuzzle'
import SudokuBoard from './puzzles/SudokuBoard'
import WordSearch from './puzzles/WordSearch'
import Jigsaw from './puzzles/Jigsaw'
import RiddleGame from './puzzles/RiddleGame'
import MemoryPuzzle from './puzzles/MemoryPuzzle'
import ChessPreview from './puzzles/ChessPreview'

const ACTIVITIES = [
  {
    key: 'block',
    icon: Grid3X3,
    title: 'Block puzzle',
    body: 'Drop simple shapes onto a 9x9 board and clear full rows and columns.',
    kicker: 'BRAIN ACTIVITY',
    Component: BlockPuzzle,
  },
  {
    key: 'sudoku',
    icon: Puzzle,
    title: 'Sudoku',
    body: 'A gentle 9x9 puzzle with a fresh grid each time and a check button.',
    kicker: 'BRAIN ACTIVITY',
    Component: SudokuBoard,
  },
  {
    key: 'wordsearch',
    icon: Search,
    title: 'Word search',
    body: 'Find eight calm, study-themed words hidden in a 12x12 grid.',
    kicker: 'BRAIN ACTIVITY',
    Component: WordSearch,
  },
  {
    key: 'jigsaw',
    icon: Sparkles,
    title: 'Jigsaw',
    body: 'Swap the tiles of a soothing picture until it all comes together.',
    kicker: 'BRAIN ACTIVITY',
    Component: Jigsaw,
  },
  {
    key: 'riddles',
    icon: Brain,
    title: 'Riddles',
    body: 'Five little riddles to turn over, with hints whenever you like.',
    kicker: 'BRAIN ACTIVITY',
    Component: RiddleGame,
  },
  {
    key: 'memory',
    icon: Gamepad2,
    title: 'Memory puzzles',
    body: 'Match the calming pairs on a 4x4 board at your own pace.',
    kicker: 'BRAIN ACTIVITY',
    Component: MemoryPuzzle,
  },
  {
    key: 'chess',
    icon: ChessKnight,
    title: 'Chess',
    body: 'Planned for v2.',
    kicker: 'COMING SOON',
    planned: true,
    Component: ChessPreview,
  },
]

export default function Puzzles() {
  const [open, setOpen] = useState(null)
  const { toast } = useApp()

  const active = open ? ACTIVITIES.find((a) => a.key === open) : null

  const handleComplete = () => {
    toast('Nice work taking a moment for yourself.')
  }

  return (
    <div className="page">
      <PageHeader kicker="BRAIN ACTIVITIES" title="Puzzles" sub="Quiet mental exercises — play one, or come back later." />

      <div className="grid grid-auto puzzle-grid">
        {ACTIVITIES.map(({ key, icon: Icon, title, body, planned }) => (
          <div key={key} className="card card-click feature-card puzzle-card" onClick={() => setOpen(key)}>
            <span className="puzzle-card-top">
              <span className="feature-icon"><Icon size={19} /></span>
              {planned && <Badge tone="demo">Planned</Badge>}
            </span>
            <b>{title}</b>
            <p>{body}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(key)}>
              {planned ? 'Preview' : 'Play'}
            </button>
          </div>
        ))}
      </div>

      {active && (
        <Modal
          kicker={active.kicker}
          title={plannedTitle(active)}
          wide={active.key !== 'chess'}
          onClose={() => setOpen(null)}
        >
          <active.Component onComplete={handleComplete} planned={Boolean(active.planned)} />
        </Modal>
      )}

      <div style={{ marginTop: '1.6rem' }}>
        <Note tone="mint" icon={Leaf}>
          These puzzles are here for a calm pause. They are not treatment — take your time, and there is
          nothing to prove.
        </Note>
      </div>
    </div>
  )
}

function plannedTitle(activity) {
  return activity.planned ? 'Chess — planned for v2' : activity.title
}
