import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, ShieldAlert, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, Note, PageHeader } from '../components/ui'
import {
  DIFFICULTY_RESPONSES, DISCLAIMER, GAD7_INTRO, GAD7_ITEMS, GAD7_MAX,
  PHQ9_INTRO, PHQ9_ITEMS, PHQ9_MAX, PHQ9_SAFETY_INDEX, RESPONSES,
  difficultyToFunctional, scoreOf, severityFor,
} from '../lib/screening'

const TYPES = {
  phq9: {
    title: 'PHQ-9',
    subtitle: 'Depression screening',
    intro: PHQ9_INTRO,
    items: PHQ9_ITEMS,
    max: PHQ9_MAX,
    safetyIndex: PHQ9_SAFETY_INDEX,
  },
  gad7: {
    title: 'GAD-7',
    subtitle: 'Anxiety screening',
    intro: GAD7_INTRO,
    items: GAD7_ITEMS,
    max: GAD7_MAX,
    safetyIndex: -1,
  },
}

const TOTAL_STEPS = (items) => items.length + 1

export default function AssessmentRunner() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { addAssessment, openSafety, toast } = useApp()

  const config = TYPES[type]
  const [stage, setStage] = useState('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(() => config ? config.items.map(() => null) : [])
  const [difficulty, setDifficulty] = useState(null)
  const [safety, setSafety] = useState(false)
  const advanceTimer = useRef(null)

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
  }, [])

  if (!config) return <Navigate to="/assessments" replace />

  const total = TOTAL_STEPS(config.items)
  const answeredCount = answers.filter((a) => a !== null).length + (difficulty !== null ? 1 : 0)
  const progress = stage === 'questions'
    ? ((index) / total) * 100
    : stage === 'difficulty'
      ? ((config.items.length) / total) * 100
      : stage === 'done' ? 100 : 0

  const chooseAnswer = (value) => {
    if (stage !== 'questions') return
    const isSafetyQuestion = index === config.safetyIndex
    setAnswers((list) => {
      const next = [...list]
      next[index] = value
      return next
    })

    if (isSafetyQuestion && value > 0 && !safety) {
      setSafety(true)
      openSafety('assessment')
    }

    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      if (index + 1 < config.items.length) setIndex(index + 1)
      else setStage('difficulty')
    }, 280)
  }

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (stage === 'difficulty') {
      setStage('questions')
      setIndex(config.items.length - 1)
      return
    }
    if (index === 0) setStage('intro')
    else setIndex((i) => i - 1)
  }

  const finish = (difficultyValue) => {
    const score = scoreOf(answers)
    const functional = difficultyToFunctional(difficultyValue)
    const severity = severityFor(type, score)
    const record = addAssessment({
      type,
      answers,
      score,
      max: config.max,
      severity,
      difficulty: difficultyValue,
      functional,
      safety,
    })
    toast('Check-in saved on this device.')
    navigate(`/assessments/${type}/result`, { state: { id: record.id }, replace: true })
  }

  const chooseDifficulty = (value) => {
    setDifficulty(value)
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      setStage('done')
      finish(value)
    }, 300)
  }

  return (
    <div className="page">
      <div className="assess-shell">
        <PageHeader
          kicker={stage === 'intro' ? 'BEFORE YOU BEGIN' : config.title}
          title={stage === 'intro' ? `${config.title} — ${config.subtitle}` : stage === 'difficulty' ? 'One last question' : config.title}
          sub={stage === 'intro' ? 'Read this, then start when you are ready.' : undefined}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assessments')} aria-label="Leave this check-in">
              <X size={15} /> Leave
            </button>
          }
        />

        {stage !== 'intro' && (
          <div style={{ marginBottom: '1.1rem' }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-meta">
              <span>
                {stage === 'difficulty'
                  ? 'Daily-life question'
                  : `Question ${index + 1} of ${config.items.length}`}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {stage === 'intro' && (
          <>
            <section className="card card-pad">
              <p className="lead">{config.intro}</p>
              <ul style={{ margin: '0.4rem 0 1rem', paddingLeft: '1.15rem', color: 'var(--ink-2)', fontSize: '0.92rem' }}>
                <li>There are no right or wrong answers — answer for the last two weeks as honestly as you can.</li>
                <li>About {config.title === 'PHQ-9' ? '3' : '2'} minutes. You can leave at any point; nothing is saved until you finish.</li>
                <li>Your answers never leave this device, and nobody at your university sees them.</li>
                <li>This produces a screening result — never a diagnosis.</li>
              </ul>
              <Note tone="mint" icon={ShieldAlert}>
                One PHQ-9 question asks about thoughts of self-harm. If you answer it with anything other
                than “Not at all”, urgent support options open straight away — before any score is shown.
                {config.title !== 'PHQ-9' && ' (That question only appears in the PHQ-9.)'}
              </Note>
              <div className="assess-nav">
                <Link className="btn btn-ghost" to="/assessments"><ArrowLeft size={15} /> Back</Link>
                <button className="btn btn-primary" onClick={() => setStage('questions')}>
                  Start the {config.title} <ArrowRight size={15} />
                </button>
              </div>
            </section>
            <p className="verify-note" style={{ marginTop: '0.8rem' }}>
              {DISCLAIMER}
            </p>
          </>
        )}

        {stage === 'questions' && (
          <section className="card question-card">
            <span className="kicker">QUESTION {index + 1}</span>
            <p className="question-text">{config.items[index]}</p>
            <p className="small muted" style={{ marginTop: '-0.7rem', marginBottom: '0.9rem' }}>
              Over the last 2 weeks, how often have you been bothered by this?
            </p>
            <div className="option-list" role="group" aria-label={`Answer for question ${index + 1}`}>
              {RESPONSES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`option ${answers[index] === option.value ? 'option-on' : ''}`}
                  aria-pressed={answers[index] === option.value}
                  onClick={() => chooseAnswer(option.value)}
                >
                  <span className="option-dot" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>

            {safety && index === config.safetyIndex && answers[index] > 0 && (
              <div style={{ marginTop: '0.9rem' }}>
                <Note tone="rose" icon={ShieldAlert}>
                  <b>Thank you for telling us.</b> Urgent support options are open now and will stay
                  reachable from any page. You can keep going, or leave whenever you like.
                </Note>
              </div>
            )}

            <div className="assess-nav">
              <button className="btn btn-outline" onClick={goBack}><ArrowLeft size={15} /> Back</button>
              <span className="small muted" style={{ alignSelf: 'center' }}>
                {answers[index] !== null ? 'Saved — moving on…' : 'Pick the closest answer'}
              </span>
            </div>
          </section>
        )}

        {stage === 'difficulty' && (
          <section className="card question-card">
            <span className="kicker">DAILY LIFE</span>
            <p className="question-text">
              How difficult have these problems made it for you to do your usual work, take care of
              things at home, or get along with other people?
            </p>
            <div className="option-list" role="group" aria-label="Difficulty answer">
              {DIFFICULTY_RESPONSES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`option ${difficulty === option.value ? 'option-on' : ''}`}
                  aria-pressed={difficulty === option.value}
                  onClick={() => chooseDifficulty(option.value)}
                >
                  <span className="option-dot" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
            <div className="assess-nav">
              <button className="btn btn-outline" onClick={goBack}><ArrowLeft size={15} /> Back</button>
              <span className="small muted" style={{ alignSelf: 'center' }}>
                <Clock size={13} style={{ verticalAlign: '-2px' }} /> Almost done
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
