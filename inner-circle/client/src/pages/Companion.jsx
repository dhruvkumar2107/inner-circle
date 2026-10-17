import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mic, Send, Sparkles, Trash2, Volume2, VolumeX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, Mascot, Note } from '../components/ui'
import { generateReply, QUICK_PROMPTS } from '../lib/chatEngine'
import { analyze, emotionLabel } from '../lib/sentiment'
import { speechSupport, startListening, speak, stopSpeaking, STT_UNAVAILABLE_NOTE } from '../lib/voice'
import { timeOf } from '../lib/storage'

const TONE_WORD = (score) => (score > 0.12 ? 'positive' : score < -0.12 ? 'negative' : 'neutral')

export default function Companion() {
  const {
    messages, pushMessage, clearMessages, toast, settings, updateSettings,
    openSafety, recentSentiment,
  } = useApp()

  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [support] = useState(() => speechSupport())

  const threadRef = useRef(null)
  const replyTimer = useRef(null)
  const recognition = useRef(null)

  const last = messages[messages.length - 1] || null
  const lastUser = [...messages].reverse().find((m) => m.role === 'user') || null

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current)
    stopSpeaking()
    try { recognition.current?.stop() } catch { /* already ended */ }
  }, [])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, typing])

  const send = (raw) => {
    const text = String(raw || '').trim()
    if (!text || typing) return

    const result = analyze(text)
    pushMessage({
      role: 'user',
      text,
      sentiment: result.sentiment.score,
      sentimentLabel: result.sentiment.label,
      emotion: result.emotion.primary,
      topic: result.topics.primary,
      crisis: result.crisis.isCrisis,
    })
    setDraft('')

    const reply = generateReply({ text, history: messages })

    if (reply.crisis) {
      pushMessage({ role: 'ai', text: reply.text, prompts: reply.prompts, suggestion: reply.suggestion, crisis: true, intent: 'crisis' })
      openSafety('companion')
      return
    }

    setTyping(true)
    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = setTimeout(() => {
      pushMessage({ role: 'ai', text: reply.text, prompts: reply.prompts, suggestion: reply.suggestion, intent: reply.intent })
      setTyping(false)
      if (settings.tts) speak(reply.text)
    }, 750)
  }

  const toggleMic = () => {
    if (listening) {
      try { recognition.current?.stop() } catch { /* noop */ }
      setListening(false)
      return
    }
    if (!support.stt) {
      toast(STT_UNAVAILABLE_NOTE, 'warn')
      return
    }
    const rec = startListening({
      onInterim: (text) => setDraft(text),
      onFinal: (text) => {
        setListening(false)
        send(text)
      },
      onError: (message) => {
        setListening(false)
        toast(message, 'warn')
      },
    })
    if (rec) {
      recognition.current = rec
      setListening(true)
    } else {
      toast(STT_UNAVAILABLE_NOTE, 'warn')
    }
  }

  const toggleReadAloud = () => {
    const next = !settings.tts
    updateSettings({ tts: next })
    if (!next) stopSpeaking()
    toast(next ? 'Replies will be read aloud.' : 'Read-aloud turned off.')
  }

  const doClear = () => {
    clearMessages()
    stopSpeaking()
    setConfirmClear(false)
    toast('Conversation cleared.')
  }

  const showQuick = !last || (last.role === 'ai' && !typing)
  const followPrompts = last && last.role === 'ai' && !typing ? last.prompts || [] : []

  return (
    <div className="chat-wrap">
      <header className="chat-head">
        <span className="feature-icon" aria-hidden="true"><Sparkles size={19} /></span>
        <div className="chat-head-copy">
          <h1>Your AI companion</h1>
          <p>A supportive conversation, whenever you want it. Type or speak.</p>
        </div>
        <div className="chat-head-actions">
          <Badge tone="demo">Simulated AI</Badge>
          <button
            type="button"
            className={`icon-btn ${settings.tts ? 'active' : ''}`}
            onClick={toggleReadAloud}
            aria-pressed={settings.tts}
            aria-label={settings.tts ? 'Turn read-aloud off' : 'Turn read-aloud on'}
            title={settings.tts ? 'Read replies aloud: on' : 'Read replies aloud: off'}
          >
            {settings.tts ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => (confirmClear ? doClear() : setConfirmClear(true))}
            onBlur={() => setConfirmClear(false)}
            aria-label="Clear conversation"
            title={confirmClear ? 'Click again to clear' : 'Clear conversation'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div style={{ padding: '0.7rem 1.5rem 0' }}>
        <div className="analysis-strip">
          <b>Simulated sentiment analysis</b>
          <span className={`meter ${recentSentiment < -0.12 ? 'neg' : ''}`} aria-hidden="true">
            <i style={{ width: `${Math.round(((recentSentiment + 1) / 2) * 100)}%` }} />
          </span>
          <span>last 5 messages read as {TONE_WORD(recentSentiment)} (score {recentSentiment})</span>
          {lastUser && (
            <span>
              · latest: <b>{emotionLabel(lastUser.emotion)}</b>
              {lastUser.topic && lastUser.topic !== 'General' ? ` · ${lastUser.topic}` : ''}
            </span>
          )}
          <Badge tone="demo">Demo</Badge>
        </div>
      </div>

      <div className="chat-thread" ref={threadRef}>
        {messages.length === 0 && (
          <div className="empty" style={{ margin: 'auto 0' }}>
            <span className="empty-icon"><Mascot size={26} /></span>
            <b>Say hello, or share what's on your mind</b>
            <p className="small">
              I can listen, help you put words to things and suggest an activity. I'm a simulated
              companion in this prototype — I don't diagnose, and I'm not a replacement for a person.
            </p>
            <div className="chip-row" style={{ justifyContent: 'center', marginTop: '0.6rem' }}>
              {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                <button key={prompt} type="button" className="chip" onClick={() => send(prompt)}>{prompt}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, index) => {
          const isLast = index === messages.length - 1
          const showFollow = isLast && m.role === 'ai' && !typing
          return (
            <div key={m.id} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-ai'} ${m.crisis ? 'msg-crisis' : ''}`}>
              <div className="msg-bubble">{m.text}</div>
              <div className="msg-meta">
                <span>{m.role === 'user' ? 'You' : 'Companion'} · {timeOf(m.at)}</span>
                {m.role === 'ai' && support.tts && (
                  <button type="button" onClick={() => speak(m.text)} aria-label="Read this reply aloud" title="Read aloud">
                    <Volume2 size={13} />
                  </button>
                )}
              </div>

              {showFollow && followPrompts.length > 0 && (
                <div className="quick-prompts" style={{ marginTop: '0.45rem' }}>
                  {followPrompts.map((prompt) => (
                    <button key={prompt} type="button" className="quick-prompt" onClick={() => send(prompt)}>{prompt}</button>
                  ))}
                </div>
              )}

              {showFollow && m.suggestion && (
                <div className="inline-suggestion" style={{ marginTop: '0.45rem' }}>
                  <span><b>Suggested:</b> {m.suggestion.label}</span>
                  <Link className="btn btn-soft btn-sm" to={m.suggestion.to}>
                    Open <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )
        })}

        {typing && (
          <div className="msg msg-ai" aria-live="polite">
            <div className="msg-bubble">
              <span className="typing-row"><i /><i /><i /></span>
            </div>
            <div className="msg-meta">Companion is thinking…</div>
          </div>
        )}
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => { event.preventDefault(); send(draft) }}
      >
        {showQuick && messages.length === 0 && (
          <div className="quick-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="quick-prompt" onClick={() => send(prompt)}>{prompt}</button>
            ))}
          </div>
        )}
        <div className="composer-row">
          <div className="composer-field">
            <textarea
              rows={1}
              value={draft}
              placeholder="Type what's on your mind…"
              aria-label="Your message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send(draft)
                }
              }}
            />
            <button
              type="button"
              className={`mic-btn ${listening ? 'mic-listening' : ''}`}
              onClick={toggleMic}
              aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              aria-pressed={listening}
              title={support.stt ? (listening ? 'Stop' : 'Speak') : 'Voice input not supported in this browser'}
            >
              <Mic size={17} />
            </button>
          </div>
          <button className="send-btn" type="submit" disabled={!draft.trim() || typing} aria-label="Send message">
            <Send size={17} />
          </button>
        </div>
        <p className="composer-hint">
          {listening
            ? 'Listening — speak now, then pause. Your words appear here before sending.'
            : !support.stt
              ? STT_UNAVAILABLE_NOTE
              : 'Enter to send · Shift + Enter for a new line · Use the microphone to speak instead.'}
        </p>
      </form>

      <div style={{ padding: '0 1.5rem 1rem' }}>
        <Note tone="grey">
          <b>Demo:</b> responses come from a scripted companion and a rule-based sentiment analysis
          running entirely in your browser. Crisis words always open urgent support straight away —
          never a score, never a wait.
        </Note>
      </div>
    </div>
  )
}
