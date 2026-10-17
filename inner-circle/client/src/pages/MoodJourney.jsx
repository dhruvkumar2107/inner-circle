import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarHeart, NotebookPen, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { EmptyState, Note, PageHeader, SectionTitle } from '../components/ui'
import { MOODS, moodMeta } from '../lib/moods'
import { lastDays, shortDate, todayKey } from '../lib/storage'
import './MoodJourney.css'

const TREND_HEIGHT = { happy: 100, calm: 88, okay: 66, stressed: 44, anxious: 33, sad: 22, overwhelmed: 12 }

const WIN_PROMPTS = [
  'mood.wins.prompts.assignment',
  'mood.wins.prompts.walk',
  'mood.wins.prompts.friend',
  'mood.wins.prompts.break',
]

export default function MoodJourney() {
  const { moods, entries, wins, addEntry, removeEntry, addWin, removeWin, toast } = useApp()
  const t = useT()
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
    toast(t('mood.reflections.savedToast'))
  }

  const saveWin = (event) => {
    event.preventDefault()
    const text = winText.trim()
    if (!text) return
    addWin(text)
    setWinText('')
    toast(t('mood.wins.addedToast'))
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
          aria-label={t('mood.delete.aria', { label })}
          title={t('mood.delete.aria', { label })}
          onClick={() => setPending({ kind, id })}
        >
          <Trash2 size={16} />
        </button>
      )
    }
    return (
      <span className="mj-confirm">
        <span className="tiny muted">{t('mood.delete.ask')}</span>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(kind, id)}>{t('common.delete')}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending(null)}>{t('mood.delete.keep')}</button>
      </span>
    )
  }

  return (
    <div className="page">
      <PageHeader
        kicker={t('mood.kicker')}
        title={t('mood.title')}
        sub={t('mood.sub')}
        action={<Link className="btn btn-primary" to="/home">{t('mood.logToday')}</Link>}
      />

      <section className="card card-pad">
        <SectionTitle
          title={t('mood.week.title')}
          sub={t('mood.week.sub')}
        />

        <div className="week-grid">
          {week.map(({ date, day, checkin }) => {
            const meta = checkin ? moodMeta(checkin.mood) : null
            const name = day.toLocaleDateString([], { weekday: 'short' })
            return (
              <div
                key={date}
                className={`day-cell ${date === todayDate ? 'today' : ''}`}
                title={`${name} ${day.getDate()} — ${meta ? t(meta.labelKey) : t('mood.week.noCheckin')}`}
              >
                <span className="day-name">{name}</span>
                <span className="day-num">{day.getDate()}</span>
                {meta
                  ? <span className="day-mood" role="img" aria-label={t(meta.labelKey)}>{meta.emoji}</span>
                  : <span className="day-empty">—</span>}
              </div>
            )
          })}
        </div>

        <ul className="mj-legend" aria-label={t('mood.week.legendLabel')}>
          {MOODS.map((mood) => (
            <li key={mood.key}><span aria-hidden="true">{mood.emoji}</span>{t(mood.labelKey)}</li>
          ))}
        </ul>

        {weekEmpty && (
          <p className="tiny muted mj-hint">
            {t('mood.week.hint')}
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
        <p className="mj-trend-caption">{t('mood.week.trendCaption')}</p>
      </section>

      <SectionTitle
        title={t('mood.history.title')}
        sub={t('mood.history.sub')}
      />
      <section className="card card-pad">
        {history.length ? (
          history.map((m) => {
            const meta = moodMeta(m.mood)
            if (!meta) return null
            return (
              <div className="list-row" key={m.id}>
                <span className="mood-emoji" aria-hidden="true">{meta.emoji}</span>
                <div className="list-copy"><b>{t(meta.labelKey)}</b></div>
                <span className="list-date">{shortDate(m.date)}</span>
              </div>
            )
          })
        ) : (
          <EmptyState
            icon={CalendarHeart}
            title={t('mood.history.emptyTitle')}
            action={<Link className="btn btn-primary btn-sm" to="/home">{t('mood.logToday')}</Link>}
          >
            {t('mood.history.emptyBody')}
          </EmptyState>
        )}
      </section>

      <SectionTitle
        title={t('mood.reflections.title')}
        sub={t('mood.reflections.sub')}
      />
      <section className="card card-pad">
        <form className="mj-form" onSubmit={saveEntry}>
          <label className="field" htmlFor="mj-reflection">
            <span>{t('mood.reflections.label')}</span>
            <textarea
              id="mj-reflection"
              rows={3}
              placeholder={t('mood.reflections.placeholder')}
              value={entryText}
              onChange={(event) => setEntryText(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!entryText.trim()}>{t('mood.reflections.save')}</button>
        </form>

        {entries.length ? (
          entries.map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-copy">
                <span className="mj-row-date">{shortDate(entry.date)}</span>
                <p className="mj-row-text">{entry.text}</p>
              </div>
              {deleteControl('entry', entry.id, t('mood.entryKind.reflection'))}
            </div>
          ))
        ) : (
          <EmptyState icon={NotebookPen} title={t('mood.reflections.emptyTitle')}>
            {t('mood.reflections.emptyBody')}
          </EmptyState>
        )}
      </section>

      <SectionTitle
        title={t('mood.wins.title')}
        sub={t('mood.wins.sub')}
      />
      <section className="card card-pad">
        <div className="chip-row" role="group" aria-label={t('mood.wins.groupLabel')}>
          {WIN_PROMPTS.map((promptKey) => (
            <button
              key={promptKey}
              type="button"
              className="chip"
              onClick={() => {
                setWinText(t(promptKey))
                winInputRef.current?.focus()
              }}
            >
              {t(promptKey)}
            </button>
          ))}
        </div>

        <form className="mj-form" onSubmit={saveWin}>
          <label className="field" htmlFor="mj-win">
            <span>{t('mood.wins.addLabel')}</span>
            <input
              id="mj-win"
              type="text"
              ref={winInputRef}
              placeholder={t('mood.wins.placeholder')}
              value={winText}
              onChange={(event) => setWinText(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!winText.trim()}>{t('mood.wins.add')}</button>
        </form>

        {wins.length ? (
          wins.map((win) => (
            <div className="list-row" key={win.id}>
              <span className="mj-row-icon" aria-hidden="true"><Sparkles size={15} /></span>
              <div className="list-copy">
                <span className="mj-row-date">{shortDate(win.date)}</span>
                <p className="mj-row-text">{win.text}</p>
              </div>
              {deleteControl('win', win.id, t('mood.entryKind.tinyWin'))}
            </div>
          ))
        ) : (
          <EmptyState icon={Sparkles} title={t('mood.wins.emptyTitle')}>
            {t('mood.wins.emptyBody')}
          </EmptyState>
        )}
      </section>

      <div style={{ marginTop: '1.4rem' }}>
        <Note tone="grey" icon={ShieldCheck}>
          {t('mood.privacyNote')}
        </Note>
      </div>
    </div>
  )
}
