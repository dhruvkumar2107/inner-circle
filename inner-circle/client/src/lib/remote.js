/**
 * Optional remote-connection seam for the AI Companion.
 *
 * This module is entirely inert until an endpoint is configured through Vite's
 * environment (VITE_CHAT_ENDPOINT and/or VITE_SENTIMENT_ENDPOINT). With no
 * environment variables set, every getter below returns '' and the companion
 * keeps using the local, scripted engine and the local lexicon analyzer — the
 * behaviour is byte-for-byte identical to a build without this file.
 *
 * It has no React dependency and no side effects at import time, so it is safe
 * to import from anywhere (including during SSR/tests where `fetch` may be
 * absent). All network calls are browser `fetch` + `AbortController` with a
 * timeout, and every failure throws a descriptive Error so the caller can fall
 * back to the local path.
 *
 * PRIVACY: enabling a chat endpoint transmits the student's typed message (and
 * the recent conversation history) to that endpoint. See docs/integration.md.
 * Crisis text is never sent here — the companion runs its deterministic local
 * crisis check first and never calls this module for a crisis message.
 */

import { analyze } from './sentiment'

const env = () => import.meta.env || {}

/** Configured chat endpoint, or '' when remote chat is disabled (the default). */
export const chatEndpoint = () => env().VITE_CHAT_ENDPOINT || ''

/** Configured sentiment endpoint, or '' when remote sentiment is disabled. */
export const sentimentEndpoint = () => env().VITE_SENTIMENT_ENDPOINT || ''

/** True only when a chat endpoint has been configured. Off by default. */
export const hasRemoteChat = () => Boolean(chatEndpoint())

/** True only when a sentiment endpoint has been configured. Off by default. */
export const hasRemoteSentiment = () => Boolean(sentimentEndpoint())

/** Creates an AbortController that is aborted by an external signal and/or a timeout. */
const createAbort = (timeoutMs, signal) => {
  const controller = new AbortController()
  let timedOut = false
  let cleared = false
  const timer = setTimeout(() => {
    timedOut = true
    try { controller.abort() } catch { /* already aborted */ }
  }, timeoutMs)

  const onAbort = () => {
    try { controller.abort() } catch { /* already aborted */ }
  }

  if (signal) {
    if (signal.aborted) onAbort()
    else if (typeof signal.addEventListener === 'function') signal.addEventListener('abort', onAbort, { once: true })
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (cleared) return
      cleared = true
      clearTimeout(timer)
      if (signal && typeof signal.removeEventListener === 'function') signal.removeEventListener('abort', onAbort)
    },
  }
}

const asString = (value) => (typeof value === 'string' ? value.trim() : '')

/**
 * Accepts any of the documented reply shapes and returns a plain string:
 * `{ reply }`, `{ text }`, `{ message }`, `{ content }` or
 * `{ choices: [{ message: { content } }] }`.
 */
const normalizeReply = (body) => {
  if (typeof body === 'string') return asString(body)
  if (!body || typeof body !== 'object') return ''

  for (const value of [body.reply, body.text, body.message, body.content]) {
    const candidate = asString(value)
    if (candidate) return candidate
  }

  const choice = Array.isArray(body.choices) ? body.choices[0] : null
  const content = choice && choice.message ? choice.message.content : ''
  const candidate = asString(content)
  return candidate
}

/**
 * POST a message to the configured chat endpoint.
 *
 * Sends JSON `{ message, history, lang }` and resolves with the assistant's
 * plain-text reply. Throws a descriptive Error on a non-OK status, on abort or
 * timeout, or when the body cannot be parsed into text.
 *
 * @param {{ text: string, history?: Array<{role: string, text: string}>, lang?: string, signal?: AbortSignal, timeoutMs?: number }} params
 * @returns {Promise<string>}
 */
export async function requestChat({ text, history = [], lang, signal, timeoutMs = 15000 } = {}) {
  const endpoint = chatEndpoint()
  if (!endpoint) throw new Error('No chat endpoint is configured (VITE_CHAT_ENDPOINT).')

  const abort = createAbort(timeoutMs, signal)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: Array.isArray(history) ? history : [], lang }),
      signal: abort.signal,
    })

    if (!response.ok) throw new Error(`Chat request failed with status ${response.status}.`)

    let body
    try {
      body = await response.json()
    } catch {
      throw new Error('Chat response was not valid JSON.')
    }

    const reply = normalizeReply(body)
    if (!reply) throw new Error('Chat response did not contain a usable text reply.')
    return reply
  } catch (error) {
    if (abort.didTimeout()) throw new Error(`Chat request timed out after ${timeoutMs}ms.`)
    if (signal && signal.aborted) throw new Error('Chat request was aborted.')
    if (error instanceof Error) throw error
    throw new Error(`Chat request failed: ${String(error)}`)
  } finally {
    abort.cleanup()
  }
}

const pickNumber = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
const pickString = (value, fallback) => (asString(value) || fallback)
const pickObject = (value, fallback) => (value && typeof value === 'object' ? value : fallback)

/**
 * POST text to the configured sentiment endpoint.
 *
 * Sends JSON `{ text }` and expects `{ score, label, confidence, emotion,
 * topics, crisis }`. Any field the remote omits is filled from the local
 * `analyze()` bundle so the caller always receives a complete result. Throws a
 * descriptive Error on a non-OK status, abort/timeout or an unparseable body.
 *
 * Note: the returned shape is the flat remote contract used above; use
 * `analyzeRemote()` when you want the same nested shape as `analyze()`.
 *
 * @param {{ text: string, signal?: AbortSignal, timeoutMs?: number }} params
 * @returns {Promise<{ score: number, label: string, confidence: number, emotion: unknown, topics: unknown, crisis: unknown }>}
 */
export async function requestSentiment({ text, signal, timeoutMs = 8000 } = {}) {
  const endpoint = sentimentEndpoint()
  if (!endpoint) throw new Error('No sentiment endpoint is configured (VITE_SENTIMENT_ENDPOINT).')

  const local = analyze(text)
  const abort = createAbort(timeoutMs, signal)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: abort.signal,
    })

    if (!response.ok) throw new Error(`Sentiment request failed with status ${response.status}.`)

    let body
    try {
      body = await response.json()
    } catch {
      throw new Error('Sentiment response was not valid JSON.')
    }
    if (!body || typeof body !== 'object') throw new Error('Sentiment response was not an object.')

    return {
      score: pickNumber(body.score, local.sentiment.score),
      label: pickString(body.label, local.sentiment.label),
      confidence: pickNumber(body.confidence, local.sentiment.confidence),
      emotion: pickObject(body.emotion, local.emotion),
      topics: pickObject(body.topics, local.topics),
      crisis: pickObject(body.crisis, local.crisis),
    }
  } catch (error) {
    if (abort.didTimeout()) throw new Error(`Sentiment request timed out after ${timeoutMs}ms.`)
    if (signal && signal.aborted) throw new Error('Sentiment request was aborted.')
    if (error instanceof Error) throw error
    throw new Error(`Sentiment request failed: ${String(error)}`)
  } finally {
    abort.cleanup()
  }
}

const asEmotion = (value) => {
  if (value && typeof value === 'object') return value
  const primary = asString(value) || 'neutral'
  return { primary, secondary: [], intensity: 0 }
}

const asTopics = (value) => {
  if (value && typeof value === 'object') return value
  const primary = asString(value) || 'General'
  return { primary, secondary: [], confidence: 0.3 }
}

const asCrisis = (value) => {
  if (value && typeof value === 'object') {
    const isCrisis = Boolean(value.isCrisis)
    return { isCrisis, phrase: value.phrase || null, severity: value.severity || (isCrisis ? 'high' : 'none') }
  }
  return { isCrisis: Boolean(value), phrase: null, severity: value ? 'high' : 'none' }
}

/**
 * Remote-aware analysis returning the same nested shape as `analyze()`:
 * `{ sentiment: { score, label, confidence }, emotion, topics, crisis }`.
 *
 * When a sentiment endpoint is configured it is tried first and the local
 * analyzer is used if anything goes wrong; when it is not configured the local
 * analyzer is used directly. This function never throws.
 */
export async function analyzeRemote(text) {
  if (!hasRemoteSentiment()) return analyze(text)
  try {
    const remote = await requestSentiment({ text })
    return {
      sentiment: { score: remote.score, label: remote.label, confidence: remote.confidence },
      emotion: asEmotion(remote.emotion),
      topics: asTopics(remote.topics),
      crisis: asCrisis(remote.crisis),
    }
  } catch {
    return analyze(text)
  }
}
