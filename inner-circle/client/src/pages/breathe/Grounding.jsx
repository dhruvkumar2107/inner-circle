import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const STEPS = [
  { id: 1, titleKey: 'breathe.grounding.steps.see.title', count: 5, placeholderKey: 'breathe.grounding.steps.see.placeholder' },
  { id: 2, titleKey: 'breathe.grounding.steps.feel.title', count: 4, placeholderKey: 'breathe.grounding.steps.feel.placeholder' },
  { id: 3, titleKey: 'breathe.grounding.steps.hear.title', count: 3, placeholderKey: 'breathe.grounding.steps.hear.placeholder' },
  { id: 4, titleKey: 'breathe.grounding.steps.smell.title', count: 2, placeholderKey: 'breathe.grounding.steps.smell.placeholder' },
  { id: 5, titleKey: 'breathe.grounding.steps.taste.title', count: 1, placeholderKey: 'breathe.grounding.steps.taste.placeholder' },
]

export default function Grounding() {
  const t = useT()
  const { toast } = useApp()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(Array(STEPS.length).fill(''))
  const [done, setDone] = useState(false)

  const current = STEPS[step]

  const updateValue = (v) => {
    const next = [...values]
    next[step] = v
    setValues(next)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setDone(true)
      toast(t('breathe.toastNiceWork'))
    }
  }

  const back = () => {
    if (step > 0) setStep(step - 1)
  }

  const reset = () => {
    setStep(0)
    setValues(Array(STEPS.length).fill(''))
    setDone(false)
  }

  if (done) {
    return (
      <div className="card card-pad">
        <div className="breath-stage">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{t('breathe.grounding.doneTitle')}</h2>
          <p className="breath-instruction">{t('breathe.grounding.doneBody')}</p>
          <button type="button" className="btn btn-primary" onClick={reset}>
            {t('breathe.controls.doAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-pad">
      <div className="step-card">
        <h3>{t(current.titleKey)}</h3>
        <p className="muted small">{t('breathe.grounding.progress', { current: step + 1, total: STEPS.length })}</p>
        <textarea
          className="ground-input"
          rows={3}
          placeholder={t(current.placeholderKey)}
          value={values[step]}
          onChange={(e) => updateValue(e.target.value)}
        />
        <div className="ctrl-row" style={{ justifyContent: 'space-between', marginTop: '0.8rem' }}>
          <button type="button" className="btn btn-ghost" onClick={back} disabled={step === 0}>
            {t('common.back')}
          </button>
          <button type="button" className="btn btn-primary" onClick={next}>
            {step === STEPS.length - 1 ? t('common.finish') : t('common.next')}
          </button>
        </div>
      </div>
      <div className="breath-instruction">{t('breathe.safetyStop')}</div>
    </div>
  )
}
