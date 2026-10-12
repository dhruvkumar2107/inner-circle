import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, Leaf, MessageCircle, Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import { api, formatTime } from '../lib/api'
import { ErrorBanner, SafetyPathway, Spinner } from '../components/common'

const deriveSuggestions = (messages, fallback) => {
  const last = [...messages].reverse().find(item => item.role === 'assistant')
  return last?.suggestions?.length ? last.suggestions : fallback
}

export default function Chat() {
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [starters, setStarters] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [error, setError] = useState('')
  const [safetyOpen, setSafetyOpen] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) })
  }, [])

  useEffect(() => { scrollToEnd() }, [messages, sending, scrollToEnd])

  const loadSession = useCallback(async id => {
    setLoadingConversation(true)
    setError('')
    try {
      const data = await api(`/chat/sessions/${id}`)
      setActiveId(id)
      setMessages(data.messages.map(message => ({ ...message, at: message.createdAt })))
      setSuggestions(deriveSuggestions(data.messages, starters))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingConversation(false)
    }
  }, [starters])

  const refreshSessions = useCallback(async () => api('/chat/sessions').then(data => data.sessions), [])

  useEffect(() => {
    let alive = true
    Promise.all([api('/chat/suggestions').catch(() => ({ suggestions: [] })), refreshSessions()])
      .then(([starter, list]) => {
        if (!alive) return
        setStarters(starter.suggestions || [])
        setSuggestions(starter.suggestions || [])
        setSessions(list)
        if (list.length) loadSession(list[0].id)
      })
      .catch(err => alive && setError(err.message))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newConversation = async () => {
    setError('')
    try {
      const data = await api('/chat/sessions', { method: 'POST', body: JSON.stringify({}) })
      setSessions(list => [data.session, ...list])
      setActiveId(data.session.id)
      setMessages([])
      setSuggestions(starters)
      inputRef.current?.focus()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeConversation = async id => {
    try {
      await api(`/chat/sessions/${id}`, { method: 'DELETE' })
      setSessions(list => list.filter(session => session.id !== id))
      if (activeId === id) { setActiveId(null); setMessages([]); setSuggestions(starters) }
    } catch (err) {
      setError(err.message)
    }
  }

  const send = async text => {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setError('')
    setInput('')
    setSending(true)

    let sessionId = activeId
    try {
      if (!sessionId) {
        const created = await api('/chat/sessions', { method: 'POST', body: JSON.stringify({ title: content.slice(0, 60) }) })
        sessionId = created.session.id
        setActiveId(sessionId)
        setSessions(list => [created.session, ...list])
      }

      const optimistic = { id: `temp-${Date.now()}`, role: 'user', text: content, at: new Date().toISOString() }
      setMessages(list => [...list, optimistic])

      const data = await api('/chat', { method: 'POST', body: JSON.stringify({ message: content, sessionId }) })
      setMessages(list => [
        ...list.filter(item => item.id !== optimistic.id),
        { ...data.userMessage, at: data.userMessage.createdAt },
        { ...data.message, at: data.message.createdAt },
      ])
      setSuggestions(data.suggestions?.length ? data.suggestions : starters)
      if (data.crisis?.isCrisis) setSafetyOpen(true)
      refreshSessions().then(setSessions).catch(() => {})
    } catch (err) {
      setMessages(list => list.filter(item => !String(item.id).startsWith('temp-')))
      setInput(content)
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() }
  }

  const activeSession = sessions.find(session => session.id === activeId)

  return (
    <div className="page chat-page">
      <aside className="chat-sessions">
        <button className="btn btn-primary full" onClick={newConversation}><Plus size={16} /> New conversation</button>
        <div className="chat-sessions-list">
          {sessions.length === 0 && <p className="muted small">Your conversations will appear here.</p>}
          {sessions.map(session => (
            <div key={session.id} className={`session-item ${session.id === activeId ? 'session-active' : ''}`}>
              <button className="session-open" onClick={() => loadSession(session.id)}>
                <MessageCircle size={15} /><span>{session.title}</span>
              </button>
              <button className="session-delete" onClick={() => removeConversation(session.id)} aria-label="Delete conversation"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-head">
          <span className="chat-avatar"><Leaf size={18} /></span>
          <div><b>Your companion</b><small>Here to listen, at any hour · replies are supportive, not medical advice</small></div>
        </header>

        <div className="chat-scroll" ref={scrollRef}>
          {loadingConversation ? (
            <div className="chat-loading"><Spinner label="Loading your conversation…" /></div>
          ) : messages.length === 0 ? (
            <div className="chat-welcome">
              <span className="chat-welcome-icon"><Sparkles size={22} /></span>
              <h2>{activeSession ? "This is a new, quiet space." : "Hi — I'm glad you're here."}</h2>
              <p>You can say anything. There's no wrong way to start, and I'll keep track of our conversation so you don't have to repeat yourself.</p>
              <div className="starter-grid">
                {(starters.length ? starters : []).map(item => (
                  <button key={item.label} className="starter-chip" disabled={sending} onClick={() => send(item.prompt)}>{item.label}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bubbles">
              {messages.map(message => (
                <div key={message.id} className={`bubble-row bubble-${message.role}`}>
                  <div className="bubble">
                    {message.text.split('\n').map((line, index) => <p key={index}>{renderInline(line)}</p>)}
                    <span className="bubble-time">{formatTime(message.at)}{message.provider ? ` · ${message.provider === 'llm' ? 'AI' : 'guided'}` : ''}</span>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="bubble-row bubble-assistant">
                  <div className="bubble typing"><i /><i /><i /></div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="chat-error"><ErrorBanner message={error} /></div>}

        {messages.length > 0 && suggestions.length > 0 && !sending && (
          <div className="suggestion-row">
            {suggestions.map(item => (
              <button key={item.label} className="suggestion-chip" onClick={() => send(item.prompt)}>{item.label}</button>
            ))}
          </div>
        )}

        <form className="chat-composer" onSubmit={event => { event.preventDefault(); send() }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Share what's on your mind…"
            rows={1}
            maxLength={2000}
            aria-label="Message"
          />
          <button className="btn btn-primary send-button" disabled={sending || !input.trim()} aria-label="Send message"><Send size={18} /></button>
        </form>
        <button className="chat-help" onClick={() => setSafetyOpen(true)}><Heart size={14} /> I need help now</button>
      </section>

      {safetyOpen && <SafetyPathway onClose={() => setSafetyOpen(false)} />}
    </div>
  )
}

function renderInline(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : <span key={index}>{part}</span>)
}
