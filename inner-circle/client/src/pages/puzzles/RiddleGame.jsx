import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'

const RIDDLE_COUNT = 5
const CHOICE_COUNT = 3

export default function RiddleGame({ onComplete }) {
  const { t, lang } = useI18n()
  const riddles = useMemo(
    () => Array.from({ length: RIDDLE_COUNT }, (_, i) => ({
      id: i,
      question: t(`puzzles.riddles.${i}.question`),
      answer: t(`puzzles.riddles.${i}.answer`),
      choices: Array.from({ length: CHOICE_COUNT }, (_, c) => t(`puzzles.riddles.${i}.choices.${c}`)),
    })),
    [t],
  )
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const completedRef = useRef(false)

  const r = riddles[i]
  const correct = input.trim().toLowerCase() === r.answer

  const next = () => {
    if (correct && !showAnswer) setScore(s => s + 1)
    if (i + 1 < riddles.length) {
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

  useEffect(() => {
    restart()
  }, [lang])

  return (
    <div className="puzzle-view">
      <div className="puzzle-controls spread">
        <span className="puzzle-stat">
          {done
            ? t('puzzles.riddleGame.scoreStat', { score, total: riddles.length })
            : t('puzzles.riddleGame.stat', { n: i + 1, total: riddles.length, score })}
        </span>
        <button type="button" className="btn btn-outline btn-sm" onClick={restart}>{t('puzzles.riddleGame.restart')}</button>
      </div>
      {!done ? (
        <div className="riddle-box">
          <div className="riddle-q">{r.question}</div>
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
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHint(h => !h)}>{t('puzzles.riddleGame.hintButton')}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAnswer(a => !a)}>{t('puzzles.riddleGame.reveal')}</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={next} disabled={!input}>{t('puzzles.riddleGame.check')}</button>
          </div>
          {showHint && <div className="puzzle-hint">{t('puzzles.riddleGame.hint')}</div>}
          {showAnswer && <div className="riddle-answer">{r.answer}</div>}
        </div>
      ) : (
        <div className="status-message">{t('puzzles.riddleGame.done', { score, total: riddles.length })}</div>
      )}
    </div>
  )
}
