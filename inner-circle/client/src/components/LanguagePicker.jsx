import { Globe } from 'lucide-react'
import { LANGUAGES, useI18n, useT } from '../i18n'

export default function LanguagePicker({ compact = false }) {
  const { lang, setLang } = useI18n()
  const t = useT()

  return (
    <label className={`lang-picker ${compact ? 'lang-picker-compact' : ''}`}>
      <Globe size={15} aria-hidden="true" />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value)}
        aria-label={t('common.language')}
        title={t('common.language')}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
    </label>
  )
}
