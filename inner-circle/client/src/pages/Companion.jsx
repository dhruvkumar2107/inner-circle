import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mic, Send, Sparkles, Trash2, Volume2, VolumeX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n'
import { Badge, Mascot, Note } from '../components/ui'
import { generateReply, QUICK_PROMPTS } from '../lib/chatEngine'
import { analyze, emotionLabelKey, sentimentLabelKey, topicKey } from '../lib/sentiment'
import { hasRemoteChat, requestChat } from '../lib/remote'
import {
  speechSupport, startListening, speak, stopSpeaking,
  STT_UNAVAILABLE_KEY, VOICE_ERROR_KEYS, SPEECH_LOCALES,
} from '../lib/voice'
import { timeOf } from '../lib/storage'

const toneLabel = (score) => (score > 0.12 ? 'Positive' : score < -0.12 ? 'Negative' : 'Neutral')

export default function Companion() {
  const {
    messages, pushMessage, clearMessages, toast, settings, updateSettings,
    openSafety, recentSentiment,
  } = useApp()
  const { lang, t } = useI18n()

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
  const lastAi = [...messages].reverse().find((m) => m.role === 'ai') || null
  const liveAi = Boolean(lastAi && lastAi.source === 'live')

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current)
    stopSpeaking()
    try { recognition.current?.stop() } catch { /* already ended */ }
  }, [])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, typing])

  /** Turns a stored reply's vars into interpolation values (topic keys resolved). */
  const resolveVars = (vars) => {
    if (!vars) return undefined
    const next = { ...vars }
    if (next.topicKey) {
      next.topic = t(next.topicKey).toLowerCase()
      delete next.topicKey
    }
    return next
  }

  // Local, scripted replies carry a translation key; live remote replies carry
  // plain text. Either way the bubble renders a string.
  const renderReply = (message) =>
    message.replyKey ? t(message.replyKey, resolveVars(message.replyVars)) : message.text || ''

  const send = async (raw, display) => {
    const seed = String(raw || '').trim()
    if (!seed || typing) return

    // SAFETY + PRIVACY (always first, before any network call): the deterministic
    // local crisis check. If crisis language is present we open the safety
    // pathway and NEVER transmit the message to any remote endpoint — crisis
    // text is never sent anywhere, and no remote call is made at all.
    const result = analyze(seed)
    const crisis = result.crisis.isCrisis

    pushMessage({
      role: 'user',
      text: display || seed,
      probe: seed,
      sentiment: result.sentiment.score,
      sentimentLabel: result.sentiment.label,
      emotion: result.emotion.primary,
      topic: result.topics.primary,
      crisis,
    })
    setDraft('')

    const history = messages.map((m) => ({ role: m.role, text: m.probe || m.text }))
    const reply = generateReply({ text: seed, history })

    if (reply.crisis) {
      pushMessage({ role: 'ai', replyKey: reply.key, replyVars: reply.vars, prompts: reply.prompts, suggestion: reply.suggestion, crisis: true, intent: 'crisis' })
      openSafety('companion')
      return
    }

    setTyping(true)
    if (replyTimer.current) clearTimeout(replyTimer.current)

    // Optional remote model. Only reached when VITE_CHAT_ENDPOINT is configured
    // and the message is not a crisis. On any failure we fall back to the local
    // scripted reply and warn the student.
    if (!crisis && hasRemoteChat()) {
      try {
        const replyText = await requestChat({ text: seed, history, lang })
        replyTimer.current = setTimeout(() => {
          pushMessage({ role: 'ai', text: replyText, source: 'live', intent: reply.intent })
          setTyping(false)
          if (settings.tts) speak(replyText)
        }, 750)
        return
      } catch {
        toast(t('companion.remoteFailed'), 'warn')
      }
    }

    replyTimer.current = setTimeout(() => {
      pushMessage({ role: 'ai', replyKey: reply.key, replyVars: reply.vars, prompts: reply.prompts, suggestion: reply.suggestion, intent: reply.intent })
      setTyping(false)
      if (settings.tts) speak(t(reply.key, resolveVars(reply.vars)))
    }, 750)
  }

  const toggleMic = () => {
    if (listening) {
      try { recognition.current?.stop() } catch { /* noop */ }
      setListening(false)
      return
    }
    if (!support.stt) {
      toast(t(STT_UNAVAILABLE_KEY), 'warn')
      return
    }
    const rec = startListening({
      lang: SPEECH_LOCALES[lang] || 'en-IN',
      onInterim: (text) => setDraft(text),
      onFinal: (text) => {
        setListening(false)
        send(text)
      },
      onError: (code) => {
        setListening(false)
        toast(t(VOICE_ERROR_KEYS[code] || 'common.speechMissed'), 'warn')
      },
    })
    if (rec) {
      recognition.current = rec
      setListening(true)
    } else {
      toast(t(STT_UNAVAILABLE_KEY), 'warn')
    }
  }

  const toggleReadAloud = () => {
    const next = !settings.tts
    updateSettings({ tts: next })
    if (!next) stopSpeaking()
    toast(next ? t('companion.toastTtsOn') : t('companion.toastTtsOff'))
  }

  const doClear = () => {
    clearMessages()
    stopSpeaking()
    setConfirmClear(false)
    toast(t('companion.toastCleared'))
  }

  const showQuick = !last || (last.role === 'ai' && !typing)
  const followPrompts = last && last.role === 'ai' && !typing ? last.prompts || [] : []

  return (
    <div className="chat-wrap">
      <header className="chat-head">
        <span className="feature-icon" aria-hidden="true"><Sparkles size={19} /></span>
        <div className="chat-head-copy">
          <h1>{t('companion.headTitle')}</h1>
          <p>{t('companion.headSub')}</p>
        </div>
        <div className="chat-head-actions">
          <Badge tone="demo">{liveAi ? t('companion.liveAi') : t('companion.simulatedAi')}</Badge>
          <button
            type="button"
            className={`icon-btn ${settings.tts ? 'active' : ''}`}
            onClick={toggleReadAloud}
            aria-pressed={settings.tts}
            aria-label={settings.tts ? t('companion.ttsOff') : t('companion.ttsOn')}
            title={settings.tts ? t('companion.ttsTitleOn') : t('companion.ttsTitleOff')}
          >
            {settings.tts ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => (confirmClear ? doClear() : setConfirmClear(true))}
            onBlur={() => setConfirmClear(false)}
            aria-label={t('companion.clear')}
            title={confirmClear ? t('companion.clearConfirm') : t('companion.clear')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {settings.showSentimentDemo && (
        <div style={{ padding: '0.7rem 1.5rem 0' }}>
          <div className="analysis-strip">
            <b>{t('companion.analysis.title')}</b>
            <span className={`meter ${recentSentiment < -0.12 ? 'neg' : ''}`} aria-hidden="true">
              <i style={{ width: `${Math.round(((recentSentiment + 1) / 2) * 100)}%` }} />
            </span>
            <span>{t('companion.analysis.lastFive', { tone: t(sentimentLabelKey(toneLabel(recentSentiment))), score: recentSentiment })}</span>
            {lastUser && (
              <span>
                · {t('companion.analysis.latest')} <b>{t(emotionLabelKey(lastUser.emotion))}</b>
                {lastUser.topic && lastUser.topic !== 'General' ? ` · ${t(topicKey(lastUser.topic))}` : ''}
              </span>
            )}
            <Badge tone="demo">{t('common.demo')}</Badge>
          </div>
        </div>
      )}

      <div className="chat-thread" ref={threadRef}>
        {messages.length === 0 && (
          <div className="empty" style={{ margin: 'auto 0' }}>
            <span className="empty-icon"><Mascot size={26} /></span>
            <b>{t('companion.empty.title')}</b>
            <p className="small">{t('companion.empty.body')}</p>
            <div className="chip-row" style={{ justifyContent: 'center', marginTop: '0.6rem' }}>
              {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                <button key={prompt.labelKey} type="button" className="chip" onClick={() => send(prompt.seed, t(prompt.labelKey))}>{t(prompt.labelKey)}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, index) => {
          const isLast = index === messages.length - 1
          const showFollow = isLast && m.role === 'ai' && !typing
          return (
            <div key={m.id} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-ai'} ${m.crisis ? 'msg-crisis' : ''}`}>
              <div className="msg-bubble">{m.role === 'ai' ? renderReply(m) : m.text}</div>
              <div className="msg-meta">
                <span>{m.role === 'user' ? t('companion.you') : t('companion.name')} · {timeOf(m.at)}</span>
                {m.role === 'ai' && support.tts && (
                  <button type="button" onClick={() => speak(renderReply(m))} aria-label={t('companion.readAloudAria')} title={t('companion.readAloud')}>
                    <Volume2 size={13} />
                  </button>
                )}
              </div>

              {showFollow && followPrompts.length > 0 && (
                <div className="quick-prompts" style={{ marginTop: '0.45rem' }}>
                  {followPrompts.map((prompt) => (
                    <button key={prompt.labelKey} type="button" className="quick-prompt" onClick={() => send(prompt.seed, t(prompt.labelKey))}>{t(prompt.labelKey)}</button>
                  ))}
                </div>
              )}

              {showFollow && m.suggestion && (
                <div className="inline-suggestion" style={{ marginTop: '0.45rem' }}>
                  <span><b>{t('companion.suggested')}</b> {t(m.suggestion.labelKey)}</span>
                  <Link className="btn btn-soft btn-sm" to={m.suggestion.to}>
                    {t('companion.open')} <ArrowRight size={14} />
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
            <div className="msg-meta">{t('companion.thinking')}</div>
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
              <button key={prompt.labelKey} type="button" className="quick-prompt" onClick={() => send(prompt.seed, t(prompt.labelKey))}>{t(prompt.labelKey)}</button>
            ))}
          </div>
        )}
        <div className="composer-row">
          <div className="composer-field">
            <textarea
              rows={1}
              value={draft}
              placeholder={t('companion.placeholder')}
              aria-label={t('companion.messageAria')}
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
              aria-label={listening ? t('companion.micStop') : t('companion.micStart')}
              aria-pressed={listening}
              title={support.stt ? (listening ? t('companion.stop') : t('companion.speak')) : t(STT_UNAVAILABLE_KEY)}
            >
              <Mic size={17} />
            </button>
          </div>
          <button className="send-btn" type="submit" disabled={!draft.trim() || typing} aria-label={t('companion.send')}>
            <Send size={17} />
          </button>
        </div>
        <p className="composer-hint">
          {listening
            ? t('companion.hint.listening')
            : !support.stt
              ? t(STT_UNAVAILABLE_KEY)
              : t('companion.hint.default')}
        </p>
      </form>

      <div style={{ padding: '0 1.5rem 1rem' }}>
        <Note tone="grey">
          <b>{t('common.demo')}:</b> {t('companion.disclaimer')}
        </Note>
      </div>
    </div>
  )
}
