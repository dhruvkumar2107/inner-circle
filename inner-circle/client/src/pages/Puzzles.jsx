import { useState } from 'react'
import { Brain, ChessKnight, Gamepad2, Grid3X3, Puzzle, Search, Sparkles, Leaf } from 'lucide-react'
import { Badge, Modal, Note, PageHeader } from '../components/ui'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
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
    Component: BlockPuzzle,
  },
  {
    key: 'sudoku',
    icon: Puzzle,
    Component: SudokuBoard,
  },
  {
    key: 'wordsearch',
    icon: Search,
    Component: WordSearch,
  },
  {
    key: 'jigsaw',
    icon: Sparkles,
    Component: Jigsaw,
  },
  {
    key: 'riddles',
    icon: Brain,
    Component: RiddleGame,
  },
  {
    key: 'memory',
    icon: Gamepad2,
    Component: MemoryPuzzle,
  },
  {
    key: 'chess',
    icon: ChessKnight,
    Component: ChessPreview,
  },
]

export default function Puzzles() {
  const [open, setOpen] = useState(null)
  const { toast } = useApp()
  const t = useT()

  const active = open ? ACTIVITIES.find((a) => a.key === open) : null

  const handleComplete = () => {
    toast(t('puzzles.toast.niceWork'))
  }

  return (
    <div className="page">
      <PageHeader
        kicker={t('puzzles.header.kicker')}
        title={t('puzzles.header.title')}
        sub={t('puzzles.header.sub')}
      />

      <div className="grid grid-auto puzzle-grid">
        {ACTIVITIES.map(({ key, icon: Icon }) => (
          <div key={key} className="card card-click feature-card puzzle-card" onClick={() => setOpen(key)}>
            <span className="puzzle-card-top">
              <span className="feature-icon"><Icon size={19} /></span>
            </span>
            <b>{key === 'chess' ? t('puzzles.chessCard.title') : t(`puzzles.activities.${key}.title`)}</b>
            <p>{key === 'chess' ? t('puzzles.chessCard.subtitle') : t(`puzzles.activities.${key}.body`)}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(key)}>
              {t('puzzles.play')}
            </button>
          </div>
        ))}
      </div>

      {active && (
        <Modal
          kicker={t('puzzles.kicker.activity')}
          title={keyTitle(active.key, t)}
          wide={active.key !== 'chess'}
          onClose={() => setOpen(null)}
        >
          <active.Component onComplete={handleComplete} />
        </Modal>
      )}

      <div style={{ marginTop: '1.6rem' }}>
        <Note tone="mint" icon={Leaf}>
          {t('puzzles.note')}
        </Note>
      </div>
    </div>
  )
}

function keyTitle(key, t) {
  return key === 'chess' ? t('puzzles.chessCard.title') : t(`puzzles.activities.${key}.title`)
}
