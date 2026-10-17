import { useState } from 'react'
import { Grid2x2, Heart, Layers, Leaf, Palette, Rabbit, Sparkles, Target, Trophy } from 'lucide-react'
import { Badge, Modal, Note, PageHeader, SectionTitle } from '../components/ui'
import EndlessRunner from './play/EndlessRunner'
import MatchThree from './play/MatchThree'
import MemoryGame from './play/MemoryGame'
import FocusReaction from './play/FocusReaction'
import ColouringCanvas from './play/ColouringCanvas'
import CalmJar from './play/CalmJar'
import Mindfulness from './play/Mindfulness'
import PositiveMoment from './play/PositiveMoment'
import './PlayRelax.css'

const GAMES = [
  { key: 'runner', icon: Rabbit, title: 'Endless runner', body: 'Hop a little round friend over soft bushes. Your score climbs with distance.' },
  { key: 'match', icon: Grid2x2, title: 'Match-three', body: 'Swap neighbouring tiles to line up three or more, all in calm colours.' },
  { key: 'memory', icon: Layers, title: 'Memory match', body: 'Find all eight pairs on a 4×4 board. Slow and steady absolutely counts.' },
  { key: 'focus', icon: Target, title: 'Focus reaction', body: 'A 20-second round of soft targets. Tap them as they drift in — no rush.' },
]

const ACTIVITIES = [
  { key: 'colour', icon: Palette, title: 'Colouring canvas', body: 'Colour a blank page with the Inner Circle palette. No skill required.' },
  { key: 'jar', icon: Sparkles, title: 'Calm jar', body: 'Shake the jar and watch the glitter settle — like thoughts settling too.' },
  { key: 'mindful', icon: Leaf, title: 'Short mindfulness', body: 'Three tiny prompts — sounds, contact, breath. About one quiet minute.' },
  { key: 'moment', icon: Heart, title: 'Positive moment', body: 'Write down one good thing and keep it in your mood journey.' },
]

const MODAL_META = {
  runner: { kicker: 'MINI-GAME', title: 'Endless runner', wide: true },
  match: { kicker: 'MINI-GAME', title: 'Match-three' },
  memory: { kicker: 'MINI-GAME', title: 'Memory match' },
  focus: { kicker: 'MINI-GAME', title: 'Focus reaction' },
  colour: { kicker: 'RELAX', title: 'Colouring canvas', wide: true },
  jar: { kicker: 'RELAX', title: 'Calm jar' },
  mindful: { kicker: 'RELAX', title: 'Short mindfulness' },
  moment: { kicker: 'RELAX', title: 'Positive moment' },
}

export default function PlayRelax() {
  const [open, setOpen] = useState(null)
  const [bests, setBests] = useState({ runner: 0, match: 0, memory: null, focus: 0 })

  const recordBest = (key, value, better) => {
    setBests((prev) => {
      const current = prev[key]
      if (current !== null && current !== undefined && !better(value, current)) return prev
      return { ...prev, [key]: value }
    })
  }

  const bestChip = (key) => {
    const value = bests[key]
    if (!value) return null
    return (
      <Badge tone="mint" className="play-best">
        <Trophy size={12} />
        {key === 'memory' ? `Best: ${value} moves` : `Best: ${value}`}
      </Badge>
    )
  }

  const meta = open ? MODAL_META[open] : null

  return (
    <div className="page">
      <PageHeader
        kicker="ACTIVITIES"
        title="Play & Relax"
        sub="A calm activity corner — take a break, then get on with your day."
      />

      <div className="play-note">
        <Note tone="mint" icon={Leaf}>
          These activities are here for a gentle pause or a bit of distraction. They are not treatment
          and they do not cure anything — if things feel heavy, please talk to someone you trust or
          reach out for professional support.
        </Note>
      </div>

      <SectionTitle title="Mini-games" sub="Light distractions for when you need a few minutes away from everything." />
      <div className="grid grid-2">
        {GAMES.map(({ key, icon: Icon, title, body }) => (
          <div
            key={key}
            className="card card-click feature-card play-card"
            onClick={() => setOpen(key)}
          >
            <span className="play-card-top">
              <span className="feature-icon"><Icon size={19} /></span>
              {bestChip(key)}
            </span>
            <b>{title}</b>
            <p>{body}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(key)}>
              Start
            </button>
          </div>
        ))}
      </div>

      <SectionTitle title="Relaxing activities" sub="Quieter ways to slow down for a moment." />
      <div className="grid grid-2">
        {ACTIVITIES.map(({ key, icon: Icon, title, body }) => (
          <div
            key={key}
            className="card card-click feature-card play-card"
            onClick={() => setOpen(key)}
          >
            <span className="play-card-top">
              <span className="feature-icon"><Icon size={19} /></span>
            </span>
            <b>{title}</b>
            <p>{body}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(key)}>
              Open
            </button>
          </div>
        ))}
      </div>

      {open && meta && (
        <Modal kicker={meta.kicker} title={meta.title} wide={Boolean(meta.wide)} onClose={() => setOpen(null)}>
          {open === 'runner' && (
            <EndlessRunner
              best={bests.runner}
              onBest={(v) => recordBest('runner', v, (a, b) => a > b)}
            />
          )}
          {open === 'match' && (
            <MatchThree
              best={bests.match}
              onBest={(v) => recordBest('match', v, (a, b) => a > b)}
            />
          )}
          {open === 'memory' && (
            <MemoryGame
              best={bests.memory}
              onBest={(v) => recordBest('memory', v, (a, b) => a < b)}
            />
          )}
          {open === 'focus' && (
            <FocusReaction
              best={bests.focus}
              onBest={(v) => recordBest('focus', v, (a, b) => a > b)}
            />
          )}
          {open === 'colour' && <ColouringCanvas />}
          {open === 'jar' && <CalmJar />}
          {open === 'mindful' && <Mindfulness />}
          {open === 'moment' && <PositiveMoment />}
        </Modal>
      )}

      <div style={{ marginTop: '1.6rem' }}>
        <Note tone="grey">
          Everything here runs only on this device. Scores are just for fun — there is nothing to
          lose and no reason to rush.
        </Note>
      </div>
    </div>
  )
}
