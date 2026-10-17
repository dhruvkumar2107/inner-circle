import './Breathe.css'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { EXERCISES } from './breathe/exercises'
import ExerciseList from './breathe/ExerciseList'
import OneMinute from './breathe/OneMinute'
import BoxBreathing from './breathe/BoxBreathing'
import Grounding from './breathe/Grounding'
import MuscleRelax from './breathe/MuscleRelax'
import Mindfulness from './breathe/Mindfulness'
import RelaxTimer from './breathe/RelaxTimer'

export default function Breathe() {
  const [params, setParams] = useSearchParams()
  const ex = params.get('ex')
  const valid = EXERCISES.some((e) => e.key === ex)
  const active = valid ? ex : 'minute'

  const select = (key) => {
    setParams({ ex: key })
  }

  const renderMain = () => {
    switch (active) {
      case 'minute':
        return <OneMinute />
      case 'box':
        return <BoxBreathing />
      case 'grounding':
        return <Grounding />
      case 'muscle':
        return <MuscleRelax />
      case 'mindfulness':
        return <Mindfulness />
      case 'timer':
        return <RelaxTimer />
      default:
        return <OneMinute />
    }
  }

  return (
    <div className="page">
      <PageHeader
        kicker="RELAXATION STUDIO"
        title="Breathe & Reset"
        sub="Short, gentle exercises. Stop whenever you like — returning to normal breathing is always fine."
      />
      <div className="breathe-layout">
        <div>
          <ExerciseList exercises={EXERCISES} activeKey={active} onSelect={select} />
        </div>
        <div>{renderMain()}</div>
      </div>
    </div>
  )
}
