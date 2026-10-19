import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Download, LogOut, ShieldCheck, Trash2, Volume2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import LanguagePicker from '../components/LanguagePicker'
import { Modal, Note, PageHeader } from '../components/ui'
import { longDate, remove } from '../lib/storage'
import { ensurePermission, permission } from '../lib/reminders'

function InfoRow({ label, value, hint }) {
  return (
    <div className="setting-row">
      <div>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </div>
      <span className="small" style={{ color: 'var(--muted)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function SectionHead({ title, sub }) {
  return (
    <div className="section-title" style={{ margin: '0 0 0.6rem' }}>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const t = useT()
  const {
    profile, consents, settings, moods, entries, wins, assessments, messages,
    updateConsents, updateSettings, resetAll, signOut, toast, updateProfile,
  } = useApp()
  const [confirming, setConfirming] = useState(false)
  const [perm, setPerm] = useState(() => permission())
  const [editingProfile, setEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', age: '', university: '' })
  const [errors, setErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)

  const startEditProfile = () => {
    setEditForm({
      name: profile?.name || '',
      email: profile?.email || '',
      age: profile?.age ?? '',
      university: profile?.university || '',
    })
    setErrors({})
    setEditingProfile(true)
  }

  const cancelEditProfile = () => {
    setEditingProfile(false)
    setErrors({})
    toast(t('settings.toasts.profileCancelled'))
  }

  const handleEditChange = (field) => (e) => {
    const value = e.target.type === 'number' ? e.target.value : e.target.value
    setEditForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: null }))
  }

  const validateProfile = () => {
    const newErrors = {}
    if (!editForm.name.trim()) newErrors.name = 'nameRequired'
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) newErrors.email = 'emailInvalid'
    const age = Number(editForm.age)
    if (!editForm.age || Number.isNaN(age)) newErrors.age = 'ageRequired'
    else if (age < 18) newErrors.age = 'ageMin'
    else if (age > 120) newErrors.age = 'ageMax'
    if (!editForm.university.trim()) newErrors.university = 'universityRequired'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return
    setSavingProfile(true)
    try {
      updateProfile({
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        age: Number(editForm.age),
        university: editForm.university.trim(),
      })
      toast(t('settings.toasts.profileSaved'))
      setEditingProfile(false)
      setErrors({})
    } finally {
      setSavingProfile(false)
    }
  }

  const flipResearch = () => {
    const next = !consents.research
    updateConsents({ research: next })
    toast(next ? t('settings.toasts.researchOn') : t('settings.toasts.researchOff'))
  }

  const flipReminders = () => {
    const next = !settings.reminders
    updateSettings({ reminders: next })
    toast(next ? t('settings.reminders.onToast') : t('settings.reminders.offToast'))
  }

  const enableNotifications = async () => {
    const result = await ensurePermission()
    setPerm(result)
    if (result === 'granted') toast(t('settings.reminders.grantedToast'))
    else if (result === 'unsupported') toast(t('settings.reminders.unsupportedToast'), 'warn')
    else toast(t('settings.reminders.deniedToast'), 'warn')
  }

  const flipTts = () => {
    const next = !settings.tts
    updateSettings({ tts: next })
    toast(next ? t('settings.prefs.ttsOn') : t('settings.prefs.ttsOff'))
  }

  const flipVoice = () => {
    const next = !settings.voiceGuidance
    updateSettings({ voiceGuidance: next })
    toast(next ? t('settings.prefs.voiceOn') : t('settings.prefs.voiceOff'))
  }

  const exportData = () => {
    const safeProfile = { ...profile }
    delete safeProfile.passwordHash
    const data = {
      profile: safeProfile,
      consents,
      settings,
      moods,
      entries,
      wins,
      assessments,
      messagesCount: messages.length,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inner-circle-data.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast(t('settings.data.exportToast'))
  }

  const confirmDelete = () => {
    resetAll()
    remove('ic.appts')
    setConfirming(false)
    toast(t('settings.toasts.deleted'))
    navigate('/')
  }

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="page">
      <PageHeader
        kicker={t('settings.kicker')}
        title={t('settings.title')}
        sub={t('settings.sub')}
      />

      <div className="grid">
        <section className="card card-pad">
          <div className="setting-row">
            <div>
              <b>{t('settings.language')}</b>
              <small>{t('settings.languageHint')}</small>
            </div>
            <LanguagePicker />
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title={t('settings.profile.title')} sub={t('settings.profile.sub')} />
          {editingProfile ? (
            <form onSubmit={handleProfileSave} noValidate>
              <div className="field">
                <label htmlFor="profile-name">{t('settings.profile.name')}</label>
                <input
                  id="profile-name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange('name')}
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="form-error" role="alert">{t(`settings.profile.validation.${errors.name}`)}</p>}
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="profile-email">{t('settings.profile.email')}</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditChange('email')}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="form-error" role="alert">{t(`settings.profile.validation.${errors.email}`)}</p>}
                </div>
                <div className="field">
                  <label htmlFor="profile-age">{t('settings.profile.age')}</label>
                  <input
                    id="profile-age"
                    type="number"
                    min={18}
                    max={120}
                    value={editForm.age}
                    onChange={handleEditChange('age')}
                    aria-invalid={!!errors.age}
                  />
                  {errors.age && <p className="form-error" role="alert">{t(`settings.profile.validation.${errors.age}`)}</p>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="profile-university">{t('settings.profile.university')}</label>
                <input
                  id="profile-university"
                  type="text"
                  value={editForm.university}
                  onChange={handleEditChange('university')}
                  aria-invalid={!!errors.university}
                />
                {errors.university && <p className="form-error" role="alert">{t(`settings.profile.validation.${errors.university}`)}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? t('settings.profile.saving') : t('settings.profile.save')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={cancelEditProfile}>
                  {t('settings.profile.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <InfoRow label={t('settings.profile.name')} value={profile?.name || '—'} />
                <InfoRow label={t('settings.profile.email')} value={profile?.email || '—'} />
                <InfoRow label={t('settings.profile.age')} value={profile?.age ?? '—'} />
                <InfoRow label={t('settings.profile.university')} value={profile?.university || '—'} />
                <InfoRow label={t('settings.profile.memberSince')} value={profile?.createdAt ? longDate(profile.createdAt) : '—'} />
              </div>
              {consents.research && (
                <p className="small muted" style={{ margin: '0.8rem 0 0' }}>
                  {t('settings.profile.researchNote')}
                </p>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
                <button type="button" className="btn btn-outline" onClick={startEditProfile}>
                  {t('settings.profile.edit')}
                </button>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Note tone="grey" icon={ShieldCheck}>
                  {t('settings.profile.passwordNote')}
                </Note>
              </div>
            </>
          )}
        </section>

        <section className="card card-pad">
          <SectionHead title={t('settings.consent.title')} sub={t('settings.consent.sub')} />
          <div>
            <div className="setting-row">
              <div>
                <b>{t('settings.consent.terms')}</b>
                <small>{t('settings.consent.termsHint')}</small>
              </div>
              <span className="small" style={{ color: 'var(--muted)' }}>
                {consents.termsAt ? longDate(consents.termsAt) : t('settings.consent.termsMissing')}
              </span>
            </div>
            <div className="setting-row">
              <div>
                <b>{t('settings.consent.research')}</b>
                <small>
                  {t('settings.consent.researchHint')}
                </small>
              </div>
              <button
                type="button"
                className={`switch ${consents.research ? 'on' : ''}`}
                aria-pressed={consents.research}
                aria-label={t('settings.consent.research')}
                onClick={flipResearch}
              />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title={t('settings.prefs.title')} sub={t('settings.prefs.sub')} />
          <div>
            <div className="setting-row">
              <div>
                <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Volume2 size={15} /> {t('settings.prefs.tts')}
                </b>
                <small>{t('settings.prefs.ttsHint')}</small>
              </div>
              <button
                type="button"
                className={`switch ${settings.tts ? 'on' : ''}`}
                aria-pressed={settings.tts}
                aria-label={t('settings.prefs.tts')}
                onClick={flipTts}
              />
            </div>
            <div className="setting-row">
              <div>
                <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Volume2 size={15} /> {t('settings.prefs.voice')}
                </b>
                <small>{t('settings.prefs.voiceHint')}</small>
              </div>
              <button
                type="button"
                className={`switch ${settings.voiceGuidance ? 'on' : ''}`}
                aria-pressed={settings.voiceGuidance}
                aria-label={t('settings.prefs.voice')}
                onClick={flipVoice}
              />
            </div>
            <div className="setting-row">
              <div>
                <b>{t('settings.prefs.sentimentDemo')}</b>
                <small>{t('settings.prefs.sentimentDemoHint')}</small>
              </div>
              <button
                type="button"
                className={`switch ${settings.showSentimentDemo ? 'on' : ''}`}
                aria-pressed={settings.showSentimentDemo}
                aria-label={t('settings.prefs.sentimentDemo')}
                onClick={() => updateSettings({ showSentimentDemo: !settings.showSentimentDemo })}
              />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title={t('settings.reminders.title')} sub={t('settings.reminders.sub')} />
          <div>
            <div className="setting-row">
              <div>
                <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bell size={15} /> {t('settings.reminders.toggle')}
                </b>
                <small>{t('settings.reminders.toggleHint')}</small>
              </div>
              <button
                type="button"
                className={`switch ${settings.reminders ? 'on' : ''}`}
                aria-pressed={settings.reminders}
                aria-label={t('settings.reminders.toggle')}
                onClick={flipReminders}
              />
            </div>
            <div className="setting-row">
              <div>
                <b>{t('settings.reminders.time')}</b>
                <small>{t('settings.reminders.timeHint')}</small>
              </div>
              <input
                type="time"
                value={settings.reminderTime}
                disabled={!settings.reminders}
                aria-label={t('settings.reminders.time')}
                onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              />
            </div>
          </div>
          <p className="small muted" style={{ margin: '0.8rem 0 0' }}>
            {t('settings.reminders.onlyWhileOpen')}
          </p>
          <div className="setting-row" style={{ borderBottom: 'none', marginTop: '0.6rem' }}>
            <div>
              <b>{t('settings.reminders.permissionLabel')}</b>
              <small>{t(`settings.reminders.permission.${perm}`)}</small>
            </div>
            {settings.reminders && perm !== 'granted' && (
              <button type="button" className="btn btn-outline" onClick={enableNotifications}>
                <Bell size={16} /> {t('settings.reminders.enable')}
              </button>
            )}
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title={t('settings.data.title')} sub={t('settings.data.sub')} />
          <ul style={{ margin: '0 0 1rem', paddingLeft: '1.15rem' }}>
            <li className="small" style={{ color: 'var(--muted)', marginBottom: '0.3rem' }}>
              {t('settings.data.bulletLocal')}
            </li>
            <li className="small" style={{ color: 'var(--muted)', marginBottom: '0.3rem' }}>
              {t('settings.data.bulletUpload')}
            </li>
            <li className="small" style={{ color: 'var(--muted)', marginBottom: 0 }}>
              {t('settings.data.bulletExport')}
            </li>
          </ul>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={exportData}>
              <Download size={16} /> {t('settings.data.export')}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
              <Trash2 size={16} /> {t('settings.data.delete')}
            </button>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title={t('settings.account.title')} />
          <div className="setting-row">
            <div>
              <b>{t('settings.account.signOut')}</b>
              <small>{t('settings.account.signOutHint')}</small>
            </div>
            <button type="button" className="btn btn-outline" onClick={handleSignOut}>
              <LogOut size={16} /> {t('settings.account.signOut')}
            </button>
          </div>
        </section>
      </div>

      <div style={{ marginTop: '1.2rem' }}>
        <Note tone="grey">
          {t('settings.footerNote')}
        </Note>
      </div>

      {confirming && (
        <Modal
          kicker={t('settings.deleteModal.kicker')}
          title={t('settings.deleteModal.title')}
          onClose={() => setConfirming(false)}
          footer={(
            <>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>{t('settings.deleteModal.confirm')}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>{t('settings.deleteModal.keep')}</button>
            </>
          )}
        >
          <p className="small" style={{ marginTop: 0 }}>
            {t('settings.deleteModal.intro')}
          </p>
          <ul>
            <li>{t('settings.deleteModal.items.profile')}</li>
            <li>{t('settings.deleteModal.items.consents')}</li>
            <li>{t('settings.deleteModal.items.prefs')}</li>
            <li>{t('settings.deleteModal.items.moods')}</li>
            <li>{t('settings.deleteModal.items.screening')}</li>
            <li>{t('settings.deleteModal.items.appointments')}</li>
          </ul>
          <p className="small muted" style={{ marginBottom: 0 }}>
            {t('settings.deleteModal.foot')}
          </p>
        </Modal>
      )}
    </div>
  )
}
