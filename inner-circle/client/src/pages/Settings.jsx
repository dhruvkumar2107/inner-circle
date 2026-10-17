import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, LogOut, ShieldCheck, Trash2, Volume2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Modal, Note, PageHeader } from '../components/ui'
import { longDate, remove } from '../lib/storage'

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
  const {
    profile, consents, settings, moods, entries, wins, assessments, messages,
    updateConsents, updateSettings, resetAll, signOut, toast,
  } = useApp()
  const [confirming, setConfirming] = useState(false)

  const flipResearch = () => {
    const next = !consents.research
    updateConsents({ research: next })
    toast(next ? 'Research feedback turned on (demo).' : 'Research feedback turned off.')
  }

  const flipTts = () => {
    const next = !settings.tts
    updateSettings({ tts: next })
    toast(next ? 'Companion replies will be read aloud.' : 'Companion replies will stay quiet.')
  }

  const flipVoice = () => {
    const next = !settings.voiceGuidance
    updateSettings({ voiceGuidance: next })
    toast(next ? 'Spoken guidance in breathing exercises is on.' : 'Spoken guidance in breathing exercises is off.')
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
    toast('Your data was exported as a JSON file.')
  }

  const confirmDelete = () => {
    resetAll()
    remove('ic.appts')
    setConfirming(false)
    toast('All local data deleted.')
    navigate('/')
  }

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="page">
      <PageHeader
        kicker="SETTINGS"
        title="Your space, your rules"
        sub="Adjust how Inner Circle supports you. None of these choices are permanent."
      />

      <div className="grid">
        <section className="card card-pad">
          <SectionHead title="Your profile" sub="Read-only details from the demo profile stored on this device." />
          <div>
            <InfoRow label="Name" value={profile?.name || '—'} />
            <InfoRow label="Email" value={profile?.email || '—'} />
            <InfoRow label="Age" value={profile?.age ?? '—'} />
            <InfoRow label="University" value={profile?.university || '—'} />
            <InfoRow label="Member since" value={profile?.createdAt ? longDate(profile.createdAt) : '—'} />
          </div>
          {consents.research && (
            <p className="small muted" style={{ margin: '0.8rem 0 0' }}>
              You have chosen to contribute anonymised research feedback — turn it off under Consent below.
            </p>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Note tone="grey" icon={ShieldCheck}>
              Your password is kept only as a demo hash in this browser. It is never shown here and
              never sent anywhere.
            </Note>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title="Consent" sub="What you agreed to, and what you can change." />
          <div>
            <div className="setting-row">
              <div>
                <b>Terms &amp; privacy accepted</b>
                <small>Required once when the demo profile was created.</small>
              </div>
              <span className="small" style={{ color: 'var(--muted)' }}>
                {consents.termsAt ? longDate(consents.termsAt) : 'Not recorded on this device'}
              </span>
            </div>
            <div className="setting-row">
              <div>
                <b>Contribute anonymised research feedback</b>
                <small>
                  In a real deployment this would let the university study de-identified, anonymised
                  well-being patterns. In this prototype it only stores your choice in this browser.
                </small>
              </div>
              <button
                type="button"
                className={`switch ${consents.research ? 'on' : ''}`}
                aria-pressed={consents.research}
                aria-label="Contribute anonymised research feedback"
                onClick={flipResearch}
              />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title="Preferences" sub="Small switches for how the app behaves." />
          <div>
            <div className="setting-row">
              <div>
                <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Volume2 size={15} /> Read companion replies aloud
                </b>
                <small>Your browser speaks each reply as it arrives. Everything is still written out in full.</small>
              </div>
              <button
                type="button"
                className={`switch ${settings.tts ? 'on' : ''}`}
                aria-pressed={settings.tts}
                aria-label="Read companion replies aloud"
                onClick={flipTts}
              />
            </div>
            <div className="setting-row">
              <div>
                <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Volume2 size={15} /> Spoken guidance in breathing exercises
                </b>
                <small>Steps such as inhale, hold and exhale are spoken while you follow along.</small>
              </div>
              <button
                type="button"
                className={`switch ${settings.voiceGuidance ? 'on' : ''}`}
                aria-pressed={settings.voiceGuidance}
                aria-label="Spoken guidance in breathing exercises"
                onClick={flipVoice}
              />
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title="Your data & privacy" sub="Everything stays in this browser." />
          <ul style={{ margin: '0 0 1rem', paddingLeft: '1.15rem' }}>
            <li className="small" style={{ color: 'var(--muted)', marginBottom: '0.3rem' }}>
              Everything lives in this browser's local storage, under Inner Circle keys such as ic.profile and ic.moods.
            </li>
            <li className="small" style={{ color: 'var(--muted)', marginBottom: '0.3rem' }}>
              Nothing is uploaded — this prototype has no server.
            </li>
            <li className="small" style={{ color: 'var(--muted)', marginBottom: 0 }}>
              Export a copy or delete it all, whenever you like.
            </li>
          </ul>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={exportData}>
              <Download size={16} /> Export my data
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
              <Trash2 size={16} /> Delete all my data
            </button>
          </div>
        </section>

        <section className="card card-pad">
          <SectionHead title="Account" />
          <div className="setting-row">
            <div>
              <b>Sign out</b>
              <small>Signing out removes the demo profile from this device. The rest of your data stays until you delete it.</small>
            </div>
            <button type="button" className="btn btn-outline" onClick={handleSignOut}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </section>
      </div>

      <div style={{ marginTop: '1.2rem' }}>
        <Note tone="grey">
          Inner Circle is a well-being and screening prototype, not medical care. It never diagnoses,
          never prescribes, and it is not an emergency service.
        </Note>
      </div>

      {confirming && (
        <Modal
          kicker="THIS CANNOT BE UNDONE"
          title="Delete all your local data?"
          onClose={() => setConfirming(false)}
          footer={(
            <>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Yes, delete everything</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Keep my data</button>
            </>
          )}
        >
          <p className="small" style={{ marginTop: 0 }}>
            This removes everything below from this device only:
          </p>
          <ul>
            <li>Your demo profile — name, email, age and university</li>
            <li>Your terms and research consents</li>
            <li>Your preferences</li>
            <li>Mood check-ins, journal entries and tiny wins</li>
            <li>Screening records and the companion conversation</li>
            <li>Saved appointment requests</li>
          </ul>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Nothing is kept on a server, so there is nothing else to clear. This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
