import { useState } from 'react'
import { Grid2x2, Heart, Layers, Leaf, Palette, Rabbit, Sparkles, Target, Trophy } from 'lucide-react'
import { Badge, Modal, Note, PageHeader, SectionTitle } from '../components/ui'
import { useT } from '../i18n'
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
  { key: 'runner', icon: Rabbit },
  { key: 'match', icon: Grid2x2 },
  { key: 'memory', icon: Layers },
  { key: 'focus', icon: Target },
]

const ACTIVITIES = [
  { key: 'colour', icon: Palette },
  { key: 'jar', icon: Sparkles },
  { key: 'mindful', icon: Leaf },
  { key: 'moment', icon: Heart },
]

const MODAL_META = {
  runner: { kicker: 'miniGame', wide: true },
  match: { kicker: 'miniGame' },
  memory: { kicker: 'miniGame' },
  focus: { kicker: 'miniGame' },
  colour: { kicker: 'relax', wide: true },
  jar: { kicker: 'relax' },
  mindful: { kicker: 'relax' },
  moment: { kicker: 'relax' },
}

export default function PlayRelax() {
  const t = useT()
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
        {key === 'memory' ? t('play.best.moves', { value }) : t('play.best.score', { value })}
      </Badge>
    )
  }

  const meta = open ? MODAL_META[open] : null

  return (
    <div className="page">
      <PageHeader
        kicker={t('play.header.kicker')}
        title={t('play.header.title')}
        sub={t('play.header.sub')}
      />

      <div className="play-note">
        <Note tone="mint" icon={Leaf}>
          {t('play.note')}
        </Note>
      </div>

      <SectionTitle title={t('play.sections.games.title')} sub={t('play.sections.games.sub')} />
      <div className="grid grid-2">
        {GAMES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="card card-click feature-card play-card"
            onClick={() => setOpen(key)}
          >
            <span className="play-card-top">
              <span className="feature-icon"><Icon size={19} /></span>
              {bestChip(key)}
            </span>
            <b>{t(`play.games.${key}.title`)}</b>
            <p>{t(`play.games.${key}.body`)}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(key)}>
              {t('common.start')}
            </button>
          </div>
        ))}
      </div>

      <SectionTitle title={t('play.sections.relax.title')} sub={t('play.sections.relax.sub')} />
      <div className="grid grid-2">
        {ACTIVITIES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="card card-click feature-card play-card"
            onClick={() => setOpen(key)}
          >
            <span className="play-card-top">
              <span className="feature-icon"><Icon size={19} /></span>
            </span>
            <b>{t(`play.games.${key}.title`)}</b>
            <p>{t(`play.games.${key}.body`)}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(key)}>
              {t('play.buttons.open')}
            </button>
          </div>
        ))}
      </div>

      {open && meta && (
        <Modal
          kicker={t(`play.kicker.${meta.kicker}`)}
          title={t(`play.games.${open}.title`)}
          wide={Boolean(meta.wide)}
          onClose={() => setOpen(null)}
        >
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
          {t('play.footerNote')}
        </Note>
      </div>
    </div>
  )
}
