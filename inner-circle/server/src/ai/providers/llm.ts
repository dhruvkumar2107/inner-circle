/**
 * Optional real-LLM provider.
 *
 * Only used when a server-side API key is configured (OPENAI_API_KEY,
 * ANTHROPIC_API_KEY or OPENROUTER_API_KEY). Keys are NEVER exposed to the
 * client. Returns null on any failure so the caller can decide what to do —
 * we never fabricate an LLM reply in its place.
 */

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const TIMEOUT_MS = 20_000

const withTimeout = async (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const callOpenAICompatible = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LlmMessage[],
  extraHeaders: Record<string, string> = {},
): Promise<string | null> => {
  const response = await withTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 500 }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content?.trim() ?? null
}

const callAnthropic = async (apiKey: string, model: string, messages: LlmMessage[], system: string): Promise<string | null> => {
  const response = await withTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 500, system, messages: messages.filter(m => m.role !== 'system') }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { content?: Array<{ text?: string }> }
  return data.content?.map(part => part.text ?? '').join('').trim() || null
}

/**
 * Attempt a real LLM completion. Returns the text, or null if no provider is
 * configured / the call failed (caller must handle the null case explicitly).
 */
export const tryLLM = async (history: LlmMessage[], system: string): Promise<string | null> => {
  try {
    if (process.env.OPENAI_API_KEY) {
      return await callOpenAICompatible(
        'https://api.openai.com/v1',
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_MODEL || 'gpt-4o-mini',
        [{ role: 'system', content: system }, ...history],
      )
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(
        process.env.ANTHROPIC_API_KEY,
        process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        [{ role: 'system', content: system }, ...history],
        system,
      )
    }
    if (process.env.OPENROUTER_API_KEY) {
      return await callOpenAICompatible(
        'https://openrouter.ai/api/v1',
        process.env.OPENROUTER_API_KEY,
        process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        [{ role: 'system', content: system }, ...history],
      )
    }
    return null
  } catch {
    return null
  }
}

export const llmConfigured = (): boolean =>
  Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY)
