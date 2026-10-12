import { Activity, Brain, HeartHandshake, Layers, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const stages = [
  { icon: Activity, title: 'Check in, gently', body: 'A short mood and stress check-in quietly feeds a transparent wellbeing model. You always see the plain-language explanation — never a scary number alone.' },
  { icon: Brain, title: 'A companion with memory', body: 'The chat keeps context across our conversation and speaks in a warm, practical tone. It varies its guidance so it never feels like a script.' },
  { icon: Layers, title: 'Gentle explainable logic', body: 'A fuzzy inference model turns several soft signals (mood, stress, sleep, function) into a supportive tier. Every result lists the rules that fired.' },
  { icon: HeartHandshake, title: 'A human in the loop', body: 'Trained counsellors and peer volunteers review anonymized signals, never your real identity unless safety genuinely requires it.' },
  { icon: Users, title: 'A caring community', body: 'Anonymous rooms let you share wins and worries with aliases. Crisis content is handled privately with care rather than posted publicly.' },
  { icon: ShieldCheck, title: 'Safety, not a substitute', body: 'A deterministic safety override always escalates risk — the model can never talk it down. Emergency contacts are one tap away.' },
]

export default function HowItWorks() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">HOW INNER CIRCLE WORKS</span>
          <h1>Support that explains itself</h1>
          <p>No black boxes. Here's exactly how the pieces fit together — and where real people step in.</p>
        </div>
      </div>

      <div className="how-grid">
        {stages.map(({ icon: Icon, title, body }) => (
          <article className="how-card" key={title}>
            <span className="feature-icon"><Icon size={20} /></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <section className="panel explainer">
        <Sparkles size={20} />
        <div>
          <h3>What Inner Circle is not</h3>
          <p>It is not a diagnosis, and it is not an emergency service. It is a gentle companion and a doorway to real support — designed to help you notice, understand and reach out.</p>
          <Link className="btn btn-soft" to="/privacy">See privacy & safety details</Link>
        </div>
      </section>

      <section className="crisis-band">
        <ShieldCheck size={22} />
        <div>
          <b>In an emergency, reach a human right now.</b>
          <p>Tele-MANAS 14416 · KIRAN 1800-599-0019 · Emergency 112.</p>
        </div>
      </section>
    </div>
  )
}
