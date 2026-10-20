import { Loppy, streakTier } from '../components/Loppy'
import { BackupCard } from '../components/BackupCard'
import { AccountCard } from '../components/AccountCard'
import { getCloud } from '../cloud/state'
import { Bolt, Check, Flame, Star } from '../components/Icons'
import { courses } from '../content'
import { dayKey, progress, useProgress } from '../progress/store'
import { LEVELS, levelFor } from '../progress/levels'

const GOALS = [
  { xp: 10, label: 'Relajado' },
  { xp: 30, label: 'Normal' },
  { xp: 60, label: 'Intenso' },
  { xp: 100, label: 'Loop infinito' },
]

const TIER_LABEL: Record<string, string> = {
  none: 'Sin bandana todavía: practica hoy para ganarla.',
  violet: 'Bandana violeta (1+ días)',
  gold: 'Bandana dorada (3+ días)',
  glow: 'Aura brillante (7+ días)',
  rainbow: 'Aura arcoíris (30+ días)',
}

export function Profile() {
  const p = useProgress()
  const { current } = levelFor(p.xp)
  const total = courses.flatMap((c) => c.units.flatMap((u) => u.exercises)).length
  const solved = Object.keys(p.completed).length

  // Últimas 5 semanas de actividad
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (34 - i))
    const k = dayKey(d)
    return { k, xp: p.history[k] ?? 0 }
  })

  return (
    <div className="page profile">
      <section className="card pf__hero">
        <Loppy mood="idle" streak={p.streak} size={130} />
        <div>
          <p className="eyebrow">Nivel {current.n} · {current.tier}</p>
          <h1>{current.name}</h1>
          <p className="muted">{TIER_LABEL[streakTier(p.streak)]}</p>
        </div>
      </section>

      <AccountCard />

      <section className="pf__stats">
        <div className="card"><Flame size={22} /><strong>{p.streak}</strong><span>Racha actual</span></div>
        <div className="card"><Star size={22} /><strong>{p.bestStreak}</strong><span>Mejor racha</span></div>
        <div className="card"><Bolt size={22} /><strong>{p.xp}</strong><span>XP total</span></div>
        <div className="card"><Check size={22} /><strong>{solved}/{total}</strong><span>Retos resueltos</span></div>
      </section>

      <section className="card">
        <h2>Actividad</h2>
        <div className="heat" aria-label="Actividad de las últimas 5 semanas">
          {days.map((d) => (
            <i key={d.k} title={`${d.k}: ${d.xp} XP`} data-lvl={d.xp === 0 ? 0 : d.xp < p.dailyGoal / 2 ? 1 : d.xp < p.dailyGoal ? 2 : 3} />
          ))}
        </div>
      </section>

      <BackupCard />

      <section className="card">
        <h2>Meta diaria</h2>
        <div className="goals">
          {GOALS.map((g) => (
            <button key={g.xp} className={`goalopt ${p.dailyGoal === g.xp ? 'is-active' : ''}`} onClick={() => progress.setDailyGoal(g.xp)}>
              <strong>{g.label}</strong>
              <span>{g.xp} XP/día</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Niveles</h2>
        <ol className="ladder">
          {LEVELS.map((l) => (
            <li key={l.n} className={p.xp >= l.minXp ? 'is-reached' : ''}>
              <span className="ladder__n">{l.n}</span>
              <div>
                <strong>{l.name}</strong> <span className="tag">{l.tier}</span>
                <p className="muted">{l.blurb} · {l.minXp} XP</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <button
        className="btn btn--ghost btn--sm pf__reset"
        onClick={() => {
          const where = getCloud().status === 'signedIn' ? ' También se reinicia en tu cuenta.' : ''
          if (confirm(`¿Reiniciar todo tu progreso?${where} Esta vuelta no se puede deshacer.`)) progress.reset()
        }}
      >
        Reiniciar progreso
      </button>

      <style>{`
        .profile { display: grid; gap: 16px; }
        .profile h2 { margin: 0 0 12px; font-size: 18px; font-weight: 900; }
        .pf__hero { display: flex; align-items: center; gap: 16px; }
        .pf__hero h1 { margin: 0; font-size: 26px; font-weight: 900; }
        .pf__hero .muted { margin: 4px 0 0; }
        .pf__stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .pf__stats .card { display: grid; justify-items: center; gap: 2px; padding: 14px 8px; text-align: center; }
        .pf__stats svg { color: var(--yellow-deep); }
        .pf__stats .card:nth-child(3) svg { color: var(--violet); }
        .pf__stats .card:nth-child(4) svg { color: var(--blue); }
        .pf__stats strong { font-size: 24px; font-weight: 900; }
        .pf__stats span { font-size: 12px; font-weight: 700; color: var(--ink-2); }
        .heat { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; max-width: 340px; }
        .heat i { aspect-ratio: 1; border-radius: 6px; background: #E2E8F0; }
        .heat i[data-lvl="1"] { background: #FEF08A; }
        .heat i[data-lvl="2"] { background: #FACC15; }
        .heat i[data-lvl="3"] { background: #CA8A04; }
        .goals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .goalopt { display: grid; gap: 2px; padding: 12px 8px; border-radius: var(--radius-sm); border: 2px solid var(--line); text-align: center; }
        .goalopt span { font-size: 12px; color: var(--ink-2); font-weight: 700; }
        .goalopt.is-active { border-color: var(--yellow); background: #FEF9C3; }
        .ladder { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .ladder li { display: flex; gap: 12px; align-items: flex-start; opacity: .55; }
        .ladder li.is-reached { opacity: 1; }
        .ladder__n { flex: none; width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: #E2E8F0; font-weight: 900; }
        .ladder li.is-reached .ladder__n { background: linear-gradient(135deg, var(--violet), var(--blue)); color: #fff; }
        .ladder p { margin: 2px 0 0; font-size: 14px; }
        .pf__reset { justify-self: center; color: var(--ink-2); }
        @media (max-width: 560px) {
          .pf__stats, .goals { grid-template-columns: repeat(2, 1fr); }
          .pf__hero { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  )
}
