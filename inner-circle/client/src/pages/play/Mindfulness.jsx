import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Leaf } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const STEPS = [0, 1, 2]

export default function Mindfulness() {
  const { toast } = useApp()
  const t = useT()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  const back = () => setStep((s) => Math.max(0, s - 1))
  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }
    setDone(true)
    toast(t('play.toast.niceWork'))
  }
  const restart = () => {
    setStep(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="game-shell">
        <div className="mind-panel center">
          <span className="mind-done-icon"><Check size={22} /></span>
          <h3 style={{ marginTop: '0.6rem' }}>{t('play.mindful.doneTitle')}</h3>
          <p className="small muted" style={{ maxWidth: '38ch', margin: '0 auto' }}>
            {t('play.mindful.doneBody')}
          </p>
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: '1rem' }} onClick={restart}>
            <Leaf size={14} /> {t('play.mindful.again')}
          </button>
        </div>
      </div>
    )
  }

  const current = STEPS[step]

  return (
    <div className="game-shell">
      <div className="mind-dots" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={`mind-dot ${i === step ? 'mind-dot-on' : ''}`} />
        ))}
      </div>
      <p className="tiny muted center" style={{ margin: '0 0 0.5rem' }}>
        {t('play.mindful.stepOf', { step: step + 1, total: STEPS.length })}
      </p>
      <div className="mind-panel">
        <h3>{t(`play.mindful.steps.${current}.title`)}</h3>
        <p>{t(`play.mindful.steps.${current}.body`)}</p>
        <p className="small muted" style={{ margin: 0 }}>{t(`play.mindful.steps.${current}.cue`)}</p>
      </div>
      <div className="mind-nav">
        <button type="button" className="btn btn-outline btn-sm" onClick={back} disabled={step === 0}>
          <ArrowLeft size={14} /> {t('common.back')}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={next}>
          {step === STEPS.length - 1 ? t('common.finish') : t('common.next')} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
