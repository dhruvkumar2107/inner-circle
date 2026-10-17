/**
 * Voice support: speech-to-text for the composer and optional text-to-speech
 * for companion replies. Uses the browser's Web Speech API — no audio is
 * recorded continuously and nothing is sent anywhere by this code; the browser
 * handles transcription. Availability is reported so the UI can explain it
 * instead of showing a dead microphone button.
 */

const getRecognitionCtor = () =>
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined

export const speechSupport = () => ({
  stt: Boolean(getRecognitionCtor()),
  tts: typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined',
})

export const STT_UNAVAILABLE_NOTE =
  "Voice input isn't supported in this browser. Try Chrome or Edge, or type your message instead."

/**
 * Starts a single recognition session. Interim results are forwarded so the
 * recognised text appears in the composer for the user to correct before sending.
 * Returns null when the browser has no support.
 */
export const startListening = ({ onInterim, onFinal, onError, lang = 'en-IN' }) => {
  const Ctor = getRecognitionCtor()
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = lang
  recognition.interimResults = true
  recognition.continuous = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    let interim = ''
    let finalText = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const chunk = event.results[i][0].transcript
      if (event.results[i].isFinal) finalText += chunk
      else interim += chunk
    }
    if (interim && onInterim) onInterim(interim)
    if (finalText && onFinal) onFinal(finalText.trim())
  }
  recognition.onerror = (event) => {
    if (onError) onError(event.error === 'not-allowed' ? 'Microphone permission was blocked by the browser.' : 'I could not catch that — please try again.')
  }
  recognition.onend = () => {
    /* the caller restarts if the user is still holding the mic */
  }

  try {
    recognition.start()
  } catch {
    return null
  }
  return recognition
}

let currentUtterance = null

export const speak = (text, { onEnd } = {}) => {
  if (!speechSupport().tts) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(String(text).slice(0, 700))
  utterance.rate = 0.98
  utterance.pitch = 1
  utterance.onend = () => {
    currentUtterance = null
    if (onEnd) onEnd()
  }
  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
  return true
}

export const stopSpeaking = () => {
  if (speechSupport().tts) window.speechSynthesis.cancel()
  currentUtterance = null
}

export const isSpeaking = () => Boolean(currentUtterance)

/** Optional spoken guidance for breathing exercises. */
export const speakGuide = (line) => {
  if (!speechSupport().tts) return false
  return speak(line)
}
