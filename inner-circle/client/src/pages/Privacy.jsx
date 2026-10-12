import { Eye, FileLock2, HeartHandshake, Server, ShieldCheck, Trash2, UserX } from 'lucide-react'

const sections = [
  { icon: UserX, title: 'Anonymous by design', body: 'You are known by a friendly alias, not your real name. Community posts never expose your identity, email or student record to other students.' },
  { icon: FileLock2, title: 'Your reflections are yours', body: 'Chat messages, check-ins and notes belong to you. We use them to personalise your support — not to judge, score or rank you.' },
  { icon: Eye, title: 'Explainable, not spooky', body: 'When Inner Circle notices a risk signal, you can see the rules behind it. Trained staff review anonymized signals, and every access is written to an audit log.' },
  { icon: Server, title: 'Where your data lives', body: 'This research prototype stores data securely and resets on restart unless a database is configured. Support numbers and campus contacts should be verified before any real launch.' },
  { icon: Trash2, title: 'You stay in control', body: 'You can delete conversations and posts, and sign out at any time. If you would like your account removed, contact your wellbeing office.' },
  { icon: HeartHandshake, title: 'Safety comes first', body: 'For your protection, crisis language triggers a caring, private pathway with real helplines and a human review — it is never posted publicly.' },
]

export default function Privacy() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">PRIVACY & SAFETY</span>
          <h1>Built to be trustworthy</h1>
          <p>Support only works when you feel safe. Here's our promise — in plain language.</p>
        </div>
      </div>

      <div className="how-grid">
        {sections.map(({ icon: Icon, title, body }) => (
          <article className="how-card" key={title}>
            <span className="feature-icon"><Icon size={20} /></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <section className="crisis-band">
        <ShieldCheck size={22} />
        <div>
          <b>Need a human right now?</b>
          <p>Tele-MANAS 14416 · KIRAN 1800-599-0019 · Emergency 112. Inner Circle is supportive, not a crisis service.</p>
        </div>
      </section>
    </div>
  )
}
