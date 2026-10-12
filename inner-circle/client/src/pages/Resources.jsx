import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Bookmark, BookmarkCheck, ExternalLink, Music, Play, Search, Sparkles, Wind,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { ErrorBanner, Modal, SectionHeader, Skeleton } from '../components/common'

const keyFor = (resource, item) => `${resource.title}::${item.title}`

const categoryIcon = category => {
  const value = category.toLowerCase()
  if (value.includes('music')) return Music
  if (value.includes('relax') || value.includes('anxiety') || value.includes('mindful')) return Wind
  if (value.includes('library') || value.includes('read')) return BookOpen
  return Sparkles
}

const BREATH_ROUTES = ['breathing', 'box-breathing', 'grounding', 'sleep', 'focus', 'zen-puzzle', 'affirmations']

export default function Resources() {
  const listQuery = useAsync(() => api('/resources'), [])
  const savedQuery = useAsync(() => api('/resources/saved'), [])
  const [saved, setSaved] = useState(new Set())
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [tier, setTier] = useState('all')
  const [language, setLanguage] = useState('all')
  const [practice, setPractice] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => { if (savedQuery.data?.saved) setSaved(new Set(savedQuery.data.saved)) }, [savedQuery.data])

  const resources = listQuery.data?.resources || []
  const categories = useMemo(() => ['all', ...Array.from(new Set(resources.map(item => item.category)))], [resources])

  const filtered = useMemo(() => resources.filter(resource => {
    if (category !== 'all' && resource.category !== category) return false
    if (tier !== 'all' && !resource.tiers?.includes(tier)) return false
    if (language !== 'all' && !resource.languages?.includes(language)) return false
    if (query.trim()) {
      const haystack = `${resource.title} ${resource.description} ${resource.tags?.join(' ')} ${resource.items.map(item => `${item.title} ${item.desc}`).join(' ')}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  }), [resources, category, tier, language, query])

  const toggleSave = async (resource, item) => {
    const key = keyFor(resource, item)
    const isSaved = saved.has(key)
    setSaved(prev => { const next = new Set(prev); if (isSaved) next.delete(key); else next.add(key); return next })
    try {
      await api(isSaved ? `/resources/saved/${encodeURIComponent(key)}` : '/resources/saved', {
        method: isSaved ? 'DELETE' : 'POST',
        ...(isSaved ? {} : { body: JSON.stringify({ resourceKey: key }) }),
      })
      setNotice(isSaved ? 'Removed from your saved items.' : 'Saved to your toolkit.')
    } catch (err) {
      setSaved(prev => { const next = new Set(prev); if (isSaved) next.add(key); else next.delete(key); return next })
      setNotice(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">YOUR CALM TOOLKIT</span>
          <h1>Resources for right now</h1>
          <p>Breathe, ground, read, or just listen. Save what helps so it's waiting when you need it.</p>
        </div>
      </div>

      {notice && <div className="toast-inline" onClick={() => setNotice('')}>{notice}</div>}
      <ErrorBanner message={listQuery.error} onRetry={listQuery.reload} />

      <div className="resource-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search resources…" aria-label="Search resources" />
        </label>
        <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category">
          {categories.map(item => <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>)}
        </select>
        <select value={tier} onChange={event => setTier(event.target.value)} aria-label="Filter by intensity">
          <option value="all">Any intensity</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High support</option>
        </select>
        <select value={language} onChange={event => setLanguage(event.target.value)} aria-label="Filter by language">
          <option value="all">Any language</option>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select>
      </div>

      {listQuery.loading ? (
        <div className="resource-grid">{[0, 1, 2, 3].map(index => <div className="panel" key={index}><Skeleton rows={3} /></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="panel"><p className="muted">No resources match those filters yet — try widening your search.</p></div>
      ) : (
        <div className="resource-grid">
          {filtered.map(resource => {
            const Icon = categoryIcon(resource.category)
            return (
              <article className="resource-card" key={resource.title}>
                <div className="resource-card-head">
                  <span className="resource-icon"><Icon size={18} /></span>
                  <div><span className="resource-tag">{resource.category}</span><h3>{resource.title}</h3></div>
                </div>
                <p className="resource-desc">{resource.description}</p>
                <ul className="resource-items">
                  {resource.items.map(item => {
                    const isSaved = saved.has(keyFor(resource, item))
                    return (
                      <li key={item.title}>
                        <div className="resource-item-copy">
                          <b>{item.title}</b>
                          <small>{item.desc}</small>
                        </div>
                        <div className="resource-item-actions">
                          {item.type === 'in-app' ? (
                            <button className="btn btn-soft btn-sm" onClick={() => setPractice({ resource, item })}><Play size={14} /> Open</button>
                          ) : (
                            <span className="pill pill-muted"><ExternalLink size={12} /> Campus library</span>
                          )}
                          <button className={`icon-button save-button ${isSaved ? 'saved' : ''}`} onClick={() => toggleSave(resource, item)} aria-label={isSaved ? 'Remove bookmark' : 'Save resource'}>
                            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </article>
            )
          })}
        </div>
      )}

      {practice && <PracticeDialog resource={practice.resource} item={practice.item} onClose={() => setPractice(null)} />}
    </div>
  )
}

function PracticeDialog({ resource, item, onClose }) {
  const isBreath = BREATH_ROUTES.includes(item.inAppRoute)
  return (
    <Modal kicker={resource.category} title={item.title} onClose={onClose}
      footer={<>
        <Link className="btn btn-soft" to="/chat" onClick={onClose}>Talk it through with the companion</Link>
        <button className="btn btn-primary" onClick={onClose}>Done</button>
      </>}>
      <p>{item.desc}</p>
      {isBreath ? <BreathingExercise /> : (
        <p className="muted">This is an in-app activity. Follow the gentle prompt above, or open a chat and I'll guide you step by step.</p>
      )}
    </Modal>
  )
}

function BreathingExercise() {
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState('Ready')
  const [count, setCount] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    if (!running) return undefined
    const sequence = [
      { label: 'Breathe in', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Breathe out', seconds: 6 },
      { label: 'Rest', seconds: 2 },
    ]
    let index = 0
    let remaining = sequence[0].seconds
    setPhase(sequence[0].label)
    setCount(remaining)
    timer.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        index = (index + 1) % sequence.length
        remaining = sequence[index].seconds
        setPhase(sequence[index].label)
      }
      setCount(remaining)
    }, 1000)
    return () => clearInterval(timer.current)
  }, [running])

  return (
    <div className="breathing">
      <div className={`breathing-orb ${running ? 'breathing-on' : ''}`}><span>{running ? phase : 'Ready'}</span></div>
      <p className="breathing-count">{running ? count : 'Press start and follow the circle.'}</p>
      <button className="btn btn-primary" onClick={() => setRunning(value => !value)}>{running ? 'Pause' : 'Start 4-4-6 breathing'}</button>
    </div>
  )
}
