import { useState } from 'react'
import { Heart, Plus, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const PROMPTS = [
  'A friend messaged at the right moment…',
  'I finished something I had been putting off…',
  'The weather felt good on a walk…',
  'I was kind to myself, just once…',
]

export default function PositiveMoment() {
  const { addWin, toast } = useApp()
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) {
      setError('Write a line or two — even a few words are enough.')
      return
    }
    addWin(value)
    setError('')
    setText('')
    setSaved(true)
    toast('Nice work taking a moment for yourself.')
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
          <h3 style={{ marginTop: '0.6rem' }}>Nice work taking a moment for yourself</h3>
          <p className="small muted" style={{ maxWidth: '40ch', margin: '0 auto' }}>
            Your moment is saved to your mood journey. Small good things are worth writing down —
            they add up more than we expect.
          </p>
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: '1rem' }} onClick={again}>
            <Plus size={14} /> Add another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-shell">
      <form onSubmit={save} noValidate>
        <p className="small muted" style={{ marginTop: 0 }}>
          What is one small good thing from today? It can be tiny — a sip of good chai, a song, a
          message that landed well.
        </p>
        {error && (
          <div className="form-error" role="alert">
            <span>{error}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="win-text">Your positive moment</label>
          <textarea
            id="win-text"
            className="input"
            rows={3}
            placeholder="Today, something good was…"
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
              onClick={() => setText((t) => (t ? `${t} ${p}` : p))}
            >
              {p}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary">
          <Heart size={15} /> Save this moment
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: '0.5rem' }}
          onClick={again}
        >
          <RotateCcw size={14} /> Clear
        </button>
      </form>
      <p className="tiny muted" style={{ marginTop: '0.8rem' }}>
        Saved only in this browser, alongside your other tiny wins.
      </p>
    </div>
  )
}
