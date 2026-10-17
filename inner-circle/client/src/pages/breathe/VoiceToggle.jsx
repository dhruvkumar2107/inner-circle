import { useT } from '../../i18n'

export default function VoiceToggle({ enabled, onChange }) {
  const t = useT()
  return (
    <div className="toggle-row">
      <button
        type="button"
        className={`switch ${enabled ? 'on' : ''}`}
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        aria-label={t('breathe.voice.toggleAria')}
      />
      <span>{enabled ? t('breathe.voice.on') : t('breathe.voice.off')}</span>
    </div>
  )
}
