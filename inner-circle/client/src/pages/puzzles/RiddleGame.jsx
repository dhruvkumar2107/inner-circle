import { useEffect, useRef, useState } from 'react'

const RIDDLES = [
  { q: 'What gets wetter as it dries?', a: 'a towel', choices: ['a towel', 'a rock', 'a leaf'] },
  { q: 'What has to be broken before you can use it?', a: 'an egg', choices: ['an egg', 'a box', 'a key'] },
  { q: 'The more you take, the more you leave behind. What are they?', a: 'footsteps', choices: ['footsteps', 'bubbles', 'shadows'] },
  { q: 'What can fill a room but takes no space?', a: 'light', choices: ['light', 'air', 'dust'] },
  { q: 'What goes up but never comes down?', a: 'age', choices: ['age', 'smoke', 'rain'] },
]

export default function RiddleGame({ onComplete }) {
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const completedRef = useRef(false)

  const r = RIDDLES[i]
  const correct = input.trim().toLowerCase() === r.a

  const next = () => {
    if (correct && !showAnswer) setScore(s => s + 1)
    if (i + 1 < RIDDLES.length) {
      setI(i + 1)
      setInput('')
      setShowHint(false)
      setShowAnswer(false)
    } else {
      setDone(true)
    }
  }

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [done, onComplete])

  const restart = () => {
    setI(0)
    setInput('')
    setShowHint(false)
    setShowAnswer(false)
    setScore(0)
    setDone(false)
    completedRef.current = false
  }

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <span className="puzzle-stat">{done ? `Score ${score}/${RIDDLES.length}` : `Riddle ${i+1}/${RIDDLES.length} • Score ${score}`}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={restart}>Restart</button>
      </div>
      {!done ? (
        <div className="riddle-box">
          <div className="riddle-q">{r.q}</div>
          <div className="choice-grid">
            {r.choices.map(c => (
              <button
                key={c}
                type="button"
                className={`choice-btn ${input === c ? 'selected' : ''}`}
                onClick={() => setInput(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="puzzle-controls">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHint(h => !h)}>Hint</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAnswer(a => !a)}>Reveal answer</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={next} disabled={!input}>Check answer</button>
          </div>
          {showHint && <div className="puzzle-hint">Think gently about the common answer.</div>}
          {showAnswer && <div className="riddle-answer">{r.a}</div>}
        </div>
      ) : (
        <div className="status-message">Great job! You got {score}/{RIDDLES.length}</div>
      )}
    </div>
  )
}
