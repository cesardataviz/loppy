import { Fragment, useState } from 'react'
import { courses, isUnitUnlocked, nextExercise, unlockedExercises } from '../content'
import type { Course } from '../content/types'
import { Loppy } from '../components/Loppy'
import { Bolt, Check, Lock, Play, Star } from '../components/Icons'
import { useProgress } from '../progress/store'
import { LEVELS, levelFor } from '../progress/levels'
import { SLOGAN } from '../brand'
import './Learn.css'

interface Props {
  onStart: (ids: string[], title: string) => void
}

function greeting(streak: number, todayXp: number, goal: number) {
  if (todayXp >= goal) return '¡Meta de hoy cumplida! Cada vuelta extra suma.'
  if (todayXp > 0) return `Vas ${todayXp}/${goal} XP hoy. ¡Una vuelta más!`
  if (streak > 0) return `Llevas ${streak} ${streak === 1 ? 'día' : 'días'} seguidos. ¡No rompas el loop!`
  return '¿Listo para tu primera vuelta de hoy?'
}

// El curso elegido se recuerda en este teléfono.
const COURSE_KEY = 'loppy.course'
function savedCourse(): Course {
  try {
    const id = localStorage.getItem(COURSE_KEY)
    return courses.find((c) => c.id === id && c.available) ?? courses[0]
  } catch {
    return courses[0]
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const KIND_ICON = { code: '</>', predict: '?', fill: 'Aa' } as const
const KIND_LABEL = { code: '', predict: ' (marca la respuesta)', fill: ' (escribe la respuesta)' } as const

export function Learn({ onStart }: Props) {
  const p = useProgress()
  const [course, setCourse] = useState<Course>(savedCourse)
  const next = nextExercise(course, p.completed)
  const { current, next: nextLevel, progress: lvlProgress } = levelFor(p.xp)
  const goalPct = Math.min(1, p.todayXp / p.dailyGoal)

  function quickPractice() {
    const pool = unlockedExercises(course, p.completed)
    const done = pool.filter((e) => p.completed[e.id])
    const fresh = pool.filter((e) => !p.completed[e.id])
    // Mezcla repaso de lo resuelto con lo nuevo, para fijar lo aprendido.
    const pick = [...shuffle(done).slice(0, 3), ...fresh.slice(0, 2)]
    const ids = shuffle(pick.length ? pick : pool).slice(0, 5).map((e) => e.id)
    onStart(ids, 'Práctica rápida')
  }

  function continueCourse() {
    if (!next) return quickPractice()
    const unit = course.units.find((u) => u.exercises.some((e) => e.id === next.id))!
    const ids = unit.exercises.filter((e) => !p.completed[e.id]).map((e) => e.id)
    onStart(ids, unit.title)
  }

  function chooseCourse(c: Course) {
    setCourse(c)
    try {
      localStorage.setItem(COURSE_KEY, c.id)
    } catch {
      /* sin almacenamiento: se elige de nuevo la próxima vez */
    }
  }

  return (
    <div className="page learn">
      <section className="hero card">
        <div className="hero__mascot">
          <Loppy mood="idle" streak={p.streak} size={150} />
        </div>
        <div className="hero__body">
          <p className="eyebrow">{SLOGAN}</p>
          <h1>{greeting(p.streak, p.todayXp, p.dailyGoal)}</h1>
          <div className="goal">
            <div className="bar bar--energy"><span style={{ width: `${goalPct * 100}%` }} /></div>
            <span><Bolt size={14} /> {p.todayXp}/{p.dailyGoal} XP</span>
          </div>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={continueCourse}>
              <Play size={18} /> {next ? (p.xp === 0 ? 'Empezar' : 'Continuar') : 'Repasar'}
            </button>
            <button className="btn btn--ghost" onClick={quickPractice}>Práctica rápida</button>
          </div>
          {next && <p className="hero__next muted">Siguiente: <b>{next.title}</b></p>}
        </div>
      </section>

      <section className="level card">
        <div className="level__badge">{current.n}</div>
        <div className="level__info">
          <span className="tag">{current.tier}</span>
          <h2>{current.name}</h2>
          <div className="bar"><span style={{ width: `${lvlProgress * 100}%` }} /></div>
          <small className="muted">
            {nextLevel ? `${p.xp} / ${nextLevel.minXp} XP para ${nextLevel.name}` : `${p.xp} XP · nivel máximo alcanzado`}
          </small>
        </div>
      </section>

      <div className="langs" role="tablist" aria-label="Lenguajes">
        {courses.map((c) => (
          <button key={c.id} role="tab" aria-selected={c === course} className={`lang ${c === course ? 'is-active' : ''}`} disabled={!c.available} onClick={() => chooseCourse(c)}>
            {c.name}
            {!c.available && <small>Pronto</small>}
          </button>
        ))}
      </div>

      <section className="path">
        {course.units.map((unit, ui) => {
          const unlocked = isUnitUnlocked(course, ui, p.completed)
          const doneCount = unit.exercises.filter((e) => p.completed[e.id]).length
          const complete = doneCount === unit.exercises.length
          const lvl = LEVELS[unit.level - 1]
          const newLevel = ui === 0 || course.units[ui - 1].level !== unit.level
          return (
            <Fragment key={unit.id}>
            {newLevel && (
              <h2 className={`path__level ${p.xp >= lvl.minXp ? 'is-reached' : ''}`}>
                <span className="path__badge">{lvl.n}</span>
                {lvl.name}
                <span className="tag">{lvl.tier}</span>
              </h2>
            )}
            <article className={`unit ${unlocked ? '' : 'is-locked'} ${complete ? 'is-complete' : ''}`}>
              <header className="unit__head">
                <div>
                  <p className="eyebrow">Unidad {ui + 1}</p>
                  <h3>{unit.title}</h3>
                  <p className="muted">{unit.description}</p>
                </div>
                {unlocked ? (
                  <button
                    className={`btn btn--sm ${complete ? 'btn--ghost' : 'btn--primary'}`}
                    onClick={() => {
                      const pending = unit.exercises.filter((e) => !p.completed[e.id])
                      onStart((pending.length ? pending : unit.exercises).map((e) => e.id), unit.title)
                    }}
                  >
                    {complete ? 'Repasar' : doneCount ? 'Seguir' : 'Empezar'}
                  </button>
                ) : (
                  <span className="unit__lock"><Lock size={18} /></span>
                )}
              </header>
              <ol className="nodes">
                {unit.exercises.map((ex, i) => {
                  const isDone = !!p.completed[ex.id]
                  const isNext = next?.id === ex.id
                  return (
                    <li key={ex.id}>
                      <button
                        className={`node ${isDone ? 'is-done' : ''} ${isNext ? 'is-next' : ''} ${ex.kind !== 'code' ? 'is-predict' : ''}`}
                        disabled={!unlocked}
                        onClick={() => onStart(unit.exercises.slice(i).map((e) => e.id), unit.title)}
                        title={`${ex.title}${KIND_LABEL[ex.kind]}`}
                      >
                        {isDone ? <Star size={22} /> : unlocked ? KIND_ICON[ex.kind] : <Lock size={16} />}
                      </button>
                      <span>{ex.title}</span>
                    </li>
                  )
                })}
              </ol>
              <div className="unit__progress">
                {complete ? <><Check size={16} /> Unidad completa</> : `${doneCount}/${unit.exercises.length}`}
              </div>
            </article>
            </Fragment>
          )
        })}
        <article className="unit unit--soon">
          <p className="eyebrow">Próximamente</p>
          <h3>Nuevos lenguajes</h3>
          <p className="muted">Cuando llegues a Loop Infinito ∞, te esperan JavaScript, C++, Java y R.</p>
        </article>
      </section>
    </div>
  )
}
