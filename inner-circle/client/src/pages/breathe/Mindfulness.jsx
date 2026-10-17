import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const STEPS = [
  { titleKey: 'breathe.mindfulness.steps.breath.title', bodyKey: 'breathe.mindfulness.steps.breath.body' },
  { titleKey: 'breathe.mindfulness.steps.sounds.title', bodyKey: 'breathe.mindfulness.steps.sounds.body' },
  { titleKey: 'breathe.mindfulness.steps.sensation.title', bodyKey: 'breathe.mindfulness.steps.sensation.body' },
  { titleKey: 'breathe.mindfulness.steps.intention.title', bodyKey: 'breathe.mindfulness.steps.intention.body' },
]

export default function Mindfulness() {
  const t = useT()
  const { toast } = useApp()
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)

  const next = () => {
    if (index < STEPS.length - 1) {
      setIndex(index + 1)
    } else {
      setDone(true)
      toast(t('breathe.toastNiceWork'))
    }
  }
  const back = () => {
    if (index > 0) setIndex(index - 1)
  }
  const reset = () => {
    setIndex(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="card card-pad">
        <div className="breath-stage">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{t('breathe.mindfulness.doneTitle')}</h2>
          <p className="breath-instruction">{t('breathe.mindfulness.doneBody')}</p>
          <button type="button" className="btn btn-primary" onClick={reset}>
            {t('breathe.controls.doAgain')}
          </button>
        </div>
      </div>
    )
  }

  const step = STEPS[index]
  return (
    <div className="card card-pad">
      <div className="step-card">
        <h3>
          {t(step.titleKey)} · {index + 1}/{STEPS.length}
        </h3>
        <p>{t(step.bodyKey)}</p>
        <div className="ctrl-row" style={{ justifyContent: 'space-between', marginTop: '0.8rem' }}>
          <button type="button" className="btn btn-ghost" onClick={back} disabled={index === 0}>
            {t('common.back')}
          </button>
          <button type="button" className="btn btn-primary" onClick={next}>
            {index === STEPS.length - 1 ? t('common.finish') : t('common.next')}
          </button>
        </div>
      </div>
      <div className="breath-instruction">{t('breathe.safetyStop')}</div>
    </div>
  )
}
