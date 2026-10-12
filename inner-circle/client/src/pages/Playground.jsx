import { useEffect, useState } from 'react'
import { Activity, FlaskConical, ShieldAlert } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorBanner, SectionHeader } from '../components/common'

const initial = { phq9: 8, gad7: 7, sentiment: -0.2, stress: 5, functional: 4, item9Flag: false, crisisDetected: false }

export default function Playground() {
  const [inputs, setInputs] = useState(initial)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      api('/risk/infer', { method: 'POST', body: JSON.stringify({ ...inputs, persist: false }) })
        .then(setResult)
        .catch(err => setError(err.message))
    }, 250)
    return () => clearTimeout(timer)
  }, [inputs])

  const set = (key, value) => setInputs(prev => ({ ...prev, [key]: value }))

  const membershipEntries = result ? Object.entries(result.memberships?.['High'] || result.memberships || {}) : []

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">FUZZY LOGIC LAB</span>
          <h1>See the reasoning, live</h1>
          <p>Move the inputs and watch the explainable risk model respond. Nothing here is saved.</p>
        </div>
      </div>
      <ErrorBanner message={error} />

      <div className="playground-layout">
        <section className="panel">
          <SectionHeader kicker="INPUTS" title="Soft signals" tight />
          <label className="field range-field"><span>PHQ-9 <b>{inputs.phq9}</b></span><input type="range" min={0} max={27} value={inputs.phq9} onChange={event => set('phq9', Number(event.target.value))} /></label>
          <label className="field range-field"><span>GAD-7 <b>{inputs.gad7}</b></span><input type="range" min={0} max={21} value={inputs.gad7} onChange={event => set('gad7', Number(event.target.value))} /></label>
          <label className="field range-field"><span>Sentiment <b>{inputs.sentiment.toFixed(2)}</b></span><input type="range" min={-1} max={1} step={0.05} value={inputs.sentiment} onChange={event => set('sentiment', Number(event.target.value))} /></label>
          <label className="field range-field"><span>Stress <b>{inputs.stress}</b></span><input type="range" min={1} max={10} value={inputs.stress} onChange={event => set('stress', Number(event.target.value))} /></label>
          <label className="field range-field"><span>Functional impact <b>{inputs.functional}</b></span><input type="range" min={0} max={10} value={inputs.functional} onChange={event => set('functional', Number(event.target.value))} /></label>
          <div className="safety-toggles">
            <label className="checkbox-field"><input type="checkbox" checked={inputs.item9Flag} onChange={event => set('item9Flag', event.target.checked)} /><span>Safety item flagged</span></label>
            <label className="checkbox-field"><input type="checkbox" checked={inputs.crisisDetected} onChange={event => set('crisisDetected', event.target.checked)} /><span>Crisis language detected</span></label>
          </div>
        </section>

        <section className="panel playground-output">
          {result ? (
            <>
              <div className={`result-card compact tier-${result.level === 'High' ? 'high' : result.level === 'Moderate' ? 'moderate' : 'low'}`}>
                <span className="result-icon"><Activity size={20} /></span>
                <span className="kicker">OUTPUT</span>
                <h2>{result.level} · Tier {result.tier}</h2>
                <p>Risk score {Math.round(result.riskScore)}/100{result.safetyOverride ? ' · safety override applied' : ''}</p>
              </div>

              {result.safetyOverride && (
                <div className="override-banner"><ShieldAlert size={16} /> A deterministic safety override forced the highest tier. The model can never lower this.</div>
              )}

              <SectionHeader kicker="FIRED RULES" title="What contributed" tight />
              <ul className="rule-list">
                {result.firedRules?.length ? result.firedRules.map(rule => (
                  <li key={rule.id}>
                    <div className="rule-bar"><span style={{ width: `${Math.round(rule.strength * 100)}%` }} /></div>
                    <div><b>{rule.id}</b><small>{rule.text}</small></div>
                  </li>
                )) : <li className="muted">No rules fired at these inputs.</li>}
              </ul>

              <SectionHeader kicker="NARRATIVE" title="Plain-language summary" tight />
              <ul className="narrative-list">{result.narrative?.map((line, index) => <li key={index}>{line}</li>)}</ul>

              <SectionHeader kicker="MEMBERSHIPS" title="High-set degrees" tight />
              <div className="membership-grid">
                {membershipEntries.map(([key, value]) => (
                  <div className="membership" key={key}>
                    <span>{key}</span>
                    <div className="membership-bar"><i style={{ width: `${Math.round(Number(value) * 100)}%` }} /></div>
                    <b>{Math.round(Number(value) * 100)}%</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-inline"><FlaskConical size={20} /><p>Adjust the inputs to see the explainable output.</p></div>
          )}
        </section>
      </div>
    </div>
  )
}
