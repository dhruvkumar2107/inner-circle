import { Wind, RefreshCw, MapPin, HeartHandshake, Leaf, Clock } from 'lucide-react'
import { useT } from '../../i18n'

const ICONS = {
  Wind,
  RefreshCw,
  MapPin,
  HeartHandshake,
  Leaf,
  Clock,
}

export default function ExerciseList({ exercises, activeKey, onSelect }) {
  const t = useT()
  return (
    <div className="card card-pad exercise-list">
      {exercises.map((ex) => {
        const Icon = ICONS[ex.icon] || Wind
        return (
          <button
            key={ex.key}
            type="button"
            className={`exercise-item ${activeKey === ex.key ? 'on' : ''}`}
            onClick={() => onSelect(ex.key)}
          >
            <Icon size={18} style={{ flex: 'none', marginTop: '2px' }} />
            <span>
              <b>{t(ex.titleKey)}</b>
              <small>{t(ex.shortKey)}</small>
            </span>
          </button>
        )
      })}
    </div>
  )
}
