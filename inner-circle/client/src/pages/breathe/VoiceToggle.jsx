export default function VoiceToggle({ enabled, onChange }) {
  return (
    <div className="toggle-row">
      <button
        type="button"
        className={`switch ${enabled ? 'on' : ''}`}
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        aria-label="Toggle voice guidance"
      />
      <span>Voice guidance {enabled ? 'on' : 'off'}</span>
    </div>
  )
}
