import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hasRemoteChat,
  hasRemoteSentiment,
  chatEndpoint,
  sentimentEndpoint,
  requestChat,
  requestSentiment,
  analyzeRemote,
} from '../src/lib/remote.js'
import { analyze } from '../src/lib/sentiment.js'

test('the remote layer is inert when no endpoint is configured', () => {
  assert.equal(chatEndpoint(), '')
  assert.equal(sentimentEndpoint(), '')
  assert.equal(hasRemoteChat(), false)
  assert.equal(hasRemoteSentiment(), false)
})

test('requestChat refuses to run without a configured endpoint', async () => {
  await assert.rejects(() => requestChat({ text: 'hello', lang: 'en' }), /VITE_CHAT_ENDPOINT/)
})

test('requestSentiment refuses to run without a configured endpoint', async () => {
  await assert.rejects(() => requestSentiment({ text: 'hello' }), /VITE_SENTIMENT_ENDPOINT/)
})

test('analyzeRemote falls back to the local analyzer byte-for-byte', async () => {
  const text = 'I am so stressed about my exams'
  assert.deepEqual(await analyzeRemote(text), analyze(text))
})
