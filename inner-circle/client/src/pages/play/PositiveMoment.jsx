import { useState } from 'react'
import { Heart, Plus, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const PROMPTS = [0, 1, 2, 3]

export default function PositiveMoment() {
  const { addWin, toast } = useApp()
  const t = useT()
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) {
      setError(t('play.moment.error'))
      return
    }
    addWin(value)
    setError('')
    setText('')
    setSaved(true)
    toast(t('play.toast.niceWork'))
  }

  const again = () => {
    setSaved(false)
    setText('')
    setError('')
  }

  if (saved) {
    return (
      <div className="game-shell">
        <div className="mind-panel center">
          <span className="mind-done-icon"><Heart size={22} /></span>
          <h3 style={{ marginTop: '0.6rem' }}>{t('play.moment.savedTitle')}</h3>
          <p className="small muted" style={{ maxWidth: '40ch', margin: '0 auto' }}>
            {t('play.moment.savedBody')}
          </p>
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: '1rem' }} onClick={again}>
            <Plus size={14} /> {t('play.moment.addAnother')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-shell">
      <form onSubmit={save} noValidate>
        <p className="small muted" style={{ marginTop: 0 }}>
          {t('play.moment.intro')}
        </p>
        {error && (
          <div className="form-error" role="alert">
            <span>{error}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="win-text">{t('play.moment.label')}</label>
          <textarea
            id="win-text"
            className="input"
            rows={3}
            placeholder={t('play.moment.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="chip-row" style={{ marginBottom: '0.9rem' }}>
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className="chip"
              onClick={() => setText((val) => (val ? `${val} ${t(`play.moment.prompts.${p}`)}` : t(`play.moment.prompts.${p}`)))}
            >
              {t(`play.moment.prompts.${p}`)}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary">
          <Heart size={15} /> {t('play.moment.save')}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: '0.5rem' }}
          onClick={again}
        >
          <RotateCcw size={14} /> {t('play.moment.clear')}
        </button>
      </form>
      <p className="tiny muted" style={{ marginTop: '0.8rem' }}>
        {t('play.moment.footer')}
      </p>
    </div>
  )
}
