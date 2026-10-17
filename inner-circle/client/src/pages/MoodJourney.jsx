import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarHeart, NotebookPen, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { EmptyState, Note, PageHeader, SectionTitle } from '../components/ui'
import { MOODS, moodMeta } from '../lib/moods'
import { lastDays, shortDate, todayKey } from '../lib/storage'
import './MoodJourney.css'

const TREND_HEIGHT = { happy: 100, calm: 88, okay: 66, stressed: 44, anxious: 33, sad: 22, overwhelmed: 12 }

const WIN_PROMPTS = [
  'I completed an assignment',
  'I went for a walk',
  'I spoke to a friend',
  'I took a break when I needed one',
]

export default function MoodJourney() {
  const { moods, entries, wins, addEntry, removeEntry, addWin, removeWin, toast } = useApp()
  const [searchParams] = useSearchParams()
  const [entryText, setEntryText] = useState('')
  const [winText, setWinText] = useState('')
  const [pending, setPending] = useState(null)
  const winInputRef = useRef(null)

  const focusWins = searchParams.get('wins') === '1'

  useEffect(() => {
    if (!focusWins) return
    winInputRef.current?.focus()
    winInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusWins])

  const week = lastDays(7).map((day) => {
    const date = todayKey(day)
    return { date, day, checkin: moods.find((m) => m.date === date) || null }
  })
  const todayDate = todayKey()
  const history = [...moods].sort((a, b) => b.date.localeCompare(a.date))
  const weekEmpty = week.every((slot) => !slot.checkin)

  const saveEntry = (event) => {
    event.preventDefault()
    const text = entryText.trim()
    if (!text) return
    addEntry(text)
    setEntryText('')
    toast('Reflection saved — just for you.')
  }

  const saveWin = (event) => {
    event.preventDefault()
    const text = winText.trim()
    if (!text) return
    addWin(text)
    setWinText('')
    toast('Tiny win noted.')
  }

  const removeItem = (kind, id) => {
    if (kind === 'entry') removeEntry(id)
    else removeWin(id)
    setPending(null)
  }

  const deleteControl = (kind, id, label) => {
    const asking = pending && pending.kind === kind && pending.id === id
    if (!asking) {
      return (
        <button
          type="button"
          className="icon-btn"
          aria-label={`Delete ${label}`}
          title={`Delete ${label}`}
          onClick={() => setPending({ kind, id })}
        >
          <Trash2 size={16} />
        </button>
      )
    }
    return (
      <span className="mj-confirm">
        <span className="tiny muted">Delete?</span>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(kind, id)}>Delete</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending(null)}>Keep</button>
      </span>
    )
  }

  return (
    <div className="page">
      <PageHeader
        kicker="REFLECTION"
        title="My Mood Journey"
        sub="A gentle look back at how you've been. Yours to read, yours to delete."
        action={<Link className="btn btn-primary" to="/home">Log today's mood</Link>}
      />

      <section className="card card-pad">
        <SectionTitle
          title="Your last seven days"
          sub="One square for each day. A dash means no check-in — and that's completely fine."
        />

        <div className="week-grid">
          {week.map(({ date, day, checkin }) => {
            const meta = checkin ? moodMeta(checkin.mood) : null
            const name = day.toLocaleDateString([], { weekday: 'short' })
            return (
              <div
                key={date}
                className={`day-cell ${date === todayDate ? 'today' : ''}`}
                title={`${name} ${day.getDate()} — ${meta ? meta.label : 'no check-in'}`}
              >
                <span className="day-name">{name}</span>
                <span className="day-num">{day.getDate()}</span>
                {meta
                  ? <span className="day-mood" role="img" aria-label={meta.label}>{meta.emoji}</span>
                  : <span className="day-empty">—</span>}
              </div>
            )
          })}
        </div>

        <ul className="mj-legend" aria-label="Mood legend">
          {MOODS.map((mood) => (
            <li key={mood.key}><span aria-hidden="true">{mood.emoji}</span>{mood.label}</li>
          ))}
        </ul>

        {weekEmpty && (
          <p className="tiny muted mj-hint">
            Nothing checked in this week yet. The squares fill in whenever you feel like it.
          </p>
        )}

        <hr className="mj-sep" />

        <div className="trend-row" aria-hidden="true">
          {week.map(({ date, checkin }) => {
            const height = checkin ? TREND_HEIGHT[checkin.mood] : null
            return height
              ? <span key={date} className="trend-bar on" style={{ height: `${height}%` }} />
              : <span key={date} className="trend-bar" />
          })}
        </div>
        <p className="mj-trend-caption">A rough shape of your week — not a score, and not a diagnosis.</p>
      </section>

      <SectionTitle
        title="Mood history"
        sub="Newest first. A mood is a moment, not a verdict."
      />
      <section className="card card-pad">
        {history.length ? (
          history.map((m) => {
            const meta = moodMeta(m.mood)
            if (!meta) return null
            return (
              <div className="list-row" key={m.id}>
                <span className="mood-emoji" aria-hidden="true">{meta.emoji}</span>
                <div className="list-copy"><b>{meta.label}</b></div>
                <span className="list-date">{shortDate(m.date)}</span>
              </div>
            )
          })
        ) : (
          <EmptyState
            icon={CalendarHeart}
            title="No check-ins yet"
            action={<Link className="btn btn-primary btn-sm" to="/home">Log today's mood</Link>}
          >
            Your story starts with one small moment, whenever you're ready.
          </EmptyState>
        )}
      </section>

      <SectionTitle
        title="Reflections"
        sub="Optional. A few words are enough, whenever you feel like writing."
      />
      <section className="card card-pad">
        <form className="mj-form" onSubmit={saveEntry}>
          <label className="field" htmlFor="mj-reflection">
            <span>Your reflection</span>
            <textarea
              id="mj-reflection"
              rows={3}
              placeholder="What's sitting with you today?"
              value={entryText}
              onChange={(event) => setEntryText(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!entryText.trim()}>Save reflection</button>
        </form>

        {entries.length ? (
          entries.map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-copy">
                <span className="mj-row-date">{shortDate(entry.date)}</span>
                <p className="mj-row-text">{entry.text}</p>
              </div>
              {deleteControl('entry', entry.id, 'reflection')}
            </div>
          ))
        ) : (
          <EmptyState icon={NotebookPen} title="No reflections yet.">
            One line is enough, whenever you feel like it.
          </EmptyState>
        )}
      </section>

      <SectionTitle
        title="Tiny Wins"
        sub="Something you did that you're okay with. No one's counting — it's just nice to see them."
      />
      <section className="card card-pad">
        <div className="chip-row" role="group" aria-label="Example tiny wins">
          {WIN_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="chip"
              onClick={() => {
                setWinText(prompt)
                winInputRef.current?.focus()
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="mj-form" onSubmit={saveWin}>
          <label className="field" htmlFor="mj-win">
            <span>Add a tiny win</span>
            <input
              id="mj-win"
              type="text"
              ref={winInputRef}
              placeholder="I took a break when I needed one."
              value={winText}
              onChange={(event) => setWinText(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!winText.trim()}>Add win</button>
        </form>

        {wins.length ? (
          wins.map((win) => (
            <div className="list-row" key={win.id}>
              <span className="mj-row-icon" aria-hidden="true"><Sparkles size={15} /></span>
              <div className="list-copy">
                <span className="mj-row-date">{shortDate(win.date)}</span>
                <p className="mj-row-text">{win.text}</p>
              </div>
              {deleteControl('win', win.id, 'tiny win')}
            </div>
          ))
        ) : (
          <EmptyState icon={Sparkles} title="No tiny wins yet.">
            Big or small — making tea counts. Add one whenever something goes okay.
          </EmptyState>
        )}
      </section>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey" icon={ShieldCheck}>
          Your mood history helps you reflect. It is not used to label you or to decide whether you
          have a condition.
        </Note>
      </div>
    </div>
  )
}
