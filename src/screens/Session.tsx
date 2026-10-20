import { useEffect, useMemo, useState } from 'react'
import { findExercise } from '../content'
import type { CodeExercise, Exercise, FillExercise, PredictExercise } from '../content/types'
import { countBlanks, matchesAnswer } from '../content/answers'
import { Loppy, type LoppyMood } from '../components/Loppy'
import { CodeEditor } from '../components/CodeEditor'
import { Console } from '../components/Console'
import { RichText } from '../components/RichText'
import { DataTables } from '../components/DataTables'
import { Bolt, Bulb, Close, Eye, Flame, Play } from '../components/Icons'
import { usePython } from '../engine/usePython'
import { friendlyError } from '../engine/friendlyErrors'
import type { RunResult } from '../engine/types'
import { progress, useProgress } from '../progress/store'
import { RETRY_PHRASES, SUCCESS_PHRASES, pick } from '../brand'
import { useCloud } from '../cloud/state'
import { openAuth } from '../components/AuthSheet'
import './Session.css'

// La invitación a crear cuenta aparece al terminar una sesión; "Ahora no" la esconde 3 días.
const INVITE_KEY = 'loppy.inviteSnooze'
function inviteSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(INVITE_KEY) ?? 0) > Date.now()
  } catch {
    return false
  }
}
function snoozeInvite() {
  try {
    localStorage.setItem(INVITE_KEY, String(Date.now() + 3 * 86_400_000))
  } catch {
    /* sin almacenamiento: la invitación volverá a salir */
  }
}

function CloudInvite({ streak }: { streak: number }) {
  const cloud = useCloud()
  const [hidden, setHidden] = useState(inviteSnoozed)
  if (hidden || cloud.status === 'off' || cloud.status === 'signedIn') return null
  return (
    <div className="invite">
      <p>
        <b>{streak > 1 ? `¡No pierdas tu racha de ${streak} días!` : '¡No pierdas tu avance!'}</b> Crea tu cuenta gratis y guarda tu
        progreso en la nube.
      </p>
      <div className="invite__actions">
        <button className="btn btn--energy btn--sm" onClick={() => openAuth('signup')}>Crear cuenta</button>
        <button className="btn btn--ghost btn--sm" onClick={() => { snoozeInvite(); setHidden(true) }}>Ahora no</button>
      </div>
    </div>
  )
}

interface Props {
  ids: string[]
  title: string
  onExit: () => void
}

type Feedback =
  | { kind: 'success'; phrase: string; gained: number; streakUp: boolean; detail?: string }
  | { kind: 'retry'; phrase: string; title: string; tip: string; technical?: string }
  | null

export function Session({ ids, title, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const [earned, setEarned] = useState(0)
  const [streakUp, setStreakUp] = useState(false)
  const [done, setDone] = useState(false)
  const p = useProgress()

  const exercises = useMemo(() => ids.map((id) => findExercise(id)?.exercise).filter(Boolean) as Exercise[], [ids])
  const current = exercises[index]

  function handleSolved(gained: number, up: boolean) {
    setEarned((e) => e + gained)
    if (up) setStreakUp(true)
  }

  function next() {
    if (index + 1 >= exercises.length) setDone(true)
    else setIndex(index + 1)
  }

  if (done || !current) {
    return (
      <div className="session session--summary">
        <div className="summary card">
          <Loppy mood="success" streak={p.streak} size={180} />
          <p className="eyebrow">{title}</p>
          <h1>¡Vuelta completada!</h1>
          <div className="summary__stats">
            <div><Bolt size={22} /><strong>+{earned}</strong><span>XP</span></div>
            <div className={streakUp ? 'is-up' : ''}><Flame size={22} /><strong>{p.streak}</strong><span>{p.streak === 1 ? 'día' : 'días'} de racha</span></div>
          </div>
          {streakUp && <p className="muted">¡Tu racha creció! Vuelve mañana para mantener a Loppy brillando.</p>}
          <CloudInvite streak={p.streak} />
          <button className="btn btn--primary btn--block" onClick={onExit}>Continuar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="session">
      <header className="session__top">
        <button className="icon-btn" onClick={onExit} aria-label="Salir de la sesión"><Close size={24} /></button>
        <div className="bar session__bar" aria-label={`Ejercicio ${index + 1} de ${exercises.length}`}>
          <span style={{ width: `${(index / exercises.length) * 100}%` }} />
        </div>
        <span className="chip chip--xp"><Bolt size={16} />{earned}</span>
      </header>

      {current.kind === 'code' ? (
        <CodeStep key={current.id} ex={current} onSolved={handleSolved} onNext={next} />
      ) : current.kind === 'predict' ? (
        <PredictStep key={current.id} ex={current} onSolved={handleSolved} onNext={next} />
      ) : (
        <FillStep key={current.id} ex={current} onSolved={handleSolved} onNext={next} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

interface StepProps<E> {
  ex: E
  onSolved: (gained: number, streakUp: boolean) => void
  onNext: () => void
}

function normalizeOutput(s: string) {
  return s.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim()
}

function CodeStep({ ex, onSolved, onNext }: StepProps<CodeExercise>) {
  const [code, setCode] = useState(ex.starter && !ex.starter.endsWith('\n') ? `${ex.starter}\n` : ex.starter)
  const [result, setResult] = useState<RunResult | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [mood, setMood] = useState<LoppyMood>('idle')
  const [fails, setFails] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [solved, setSolved] = useState(false)
  const { booting, running, run } = usePython()
  const p = useProgress()

  async function check() {
    if (running || solved) return
    setFeedback(null)
    setMood('thinking')
    const res = await run({ code, stdin: ex.stdin, testCode: ex.test })
    setResult(res)

    let retry: Omit<Extract<Feedback, { kind: 'retry' }>, 'kind' | 'phrase'> | null = null
    if (res.error) {
      const f = friendlyError(res.error)
      retry = { title: f.title, tip: f.tip, technical: f.technical }
    } else if (ex.expectedOutput !== undefined && normalizeOutput(res.stdout) !== normalizeOutput(ex.expectedOutput)) {
      retry = {
        title: 'Tu código corre, pero la salida es distinta',
        tip: res.testError ?? 'Compara letra por letra con lo que pide el reto: mayúsculas, espacios y signos cuentan.',
        technical: `Esperado:\n${ex.expectedOutput}`,
      }
    } else if (res.testError) {
      retry = { title: 'Casi lo tienes', tip: res.testError }
    }

    progress.registerAttempt(ex.id, !retry)
    if (retry) {
      setMood('error')
      setFails((f) => f + 1)
      setFeedback({ kind: 'retry', phrase: pick(RETRY_PHRASES), ...retry })
      return
    }

    const r = progress.complete(ex.id, ex.xp)
    setMood('success')
    setSolved(true)
    onSolved(r.gained, r.streakUp)
    setFeedback({ kind: 'success', phrase: pick(SUCCESS_PHRASES), gained: r.gained, streakUp: r.streakUp })
  }

  return (
    <div className="step step--code">
      <section className="step__brief">
        <p className="eyebrow">{ex.title}</p>
        <div className="card card--concept"><RichText text={ex.concept} /></div>
        <div className="prompt">
          <Loppy mood={mood} streak={p.streak} size={92} />
          <div className="prompt__bubble"><RichText text={ex.prompt} /></div>
        </div>
        <div className="step__aids">
          <button className="btn btn--ghost btn--sm" onClick={() => setShowHint(true)} disabled={showHint}>
            <Bulb size={18} /> Pista
          </button>
          {fails >= 3 && !solved && (
            <button className="btn btn--ghost btn--sm" onClick={() => setCode(ex.solution)}>
              <Eye size={18} /> Ver una solución
            </button>
          )}
        </div>
        {showHint && <div className="hint"><Bulb size={18} /><span>{ex.hint}</span></div>}
      </section>

      <section className="step__work">
        <CodeEditor value={code} onChange={setCode} onRun={check} />
        <Console result={result} running={running} booting={booting && !running} />
      </section>

      <FeedbackSheet
        feedback={feedback}
        action={
          solved ? (
            <button className="btn btn--energy btn--block" onClick={onNext} autoFocus>Continuar</button>
          ) : (
            <button className="btn btn--primary btn--block" onClick={check} disabled={running}>
              <Play size={18} /> {running ? 'Ejecutando…' : feedback ? 'Intentar de nuevo' : 'Ejecutar y comprobar'}
            </button>
          )
        }
        hint={!solved ? 'Ctrl + Enter' : undefined}
      />
    </div>
  )
}

function PredictStep({ ex, onSolved, onNext }: StepProps<PredictExercise>) {
  const [choice, setChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [mood, setMood] = useState<LoppyMood>('idle')
  const p = useProgress()

  useEffect(() => setMood('idle'), [choice])

  // Teclas 1–4 para elegir respuesta rápido.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (!checked && n >= 1 && n <= ex.options.length) setChoice(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [checked, ex.options.length])

  function check() {
    if (choice === null) return
    progress.registerAttempt(ex.id, choice === ex.answer)
    setChecked(true)
    if (choice === ex.answer) {
      const r = progress.complete(ex.id, ex.xp)
      onSolved(r.gained, r.streakUp)
      setMood('success')
      setFeedback({ kind: 'success', phrase: pick(SUCCESS_PHRASES), gained: r.gained, streakUp: r.streakUp, detail: ex.explain })
    } else {
      setMood('error')
      setFeedback({ kind: 'retry', phrase: pick(RETRY_PHRASES), title: 'Esa no era', tip: ex.explain })
    }
  }

  function retry() {
    setChecked(false)
    setChoice(null)
    setFeedback(null)
  }

  const correct = checked && choice === ex.answer

  return (
    <div className="step step--predict">
      <section className="step__brief">
        <p className="eyebrow">{ex.title} · {ex.question ? 'Marca la respuesta' : 'Predice la salida'}</p>
        <div className="card card--concept"><RichText text={ex.concept} /></div>
        <DataTables tables={ex.tables} />
      </section>
      <section className="step__work">
        <div className="prompt">
          <Loppy mood={mood} streak={p.streak} size={92} />
          <div className="prompt__bubble"><p>{ex.question ?? '¿Qué imprime este código?'}</p></div>
        </div>
        <pre className="code-block">{ex.code}</pre>
        <div className="options" role="radiogroup">
          {ex.options.map((opt, i) => (
            <button
              key={i}
              role="radio"
              aria-checked={choice === i}
              disabled={checked}
              className={`option ${choice === i ? 'is-selected' : ''} ${checked && i === ex.answer && correct ? 'is-correct' : ''} ${checked && choice === i && !correct ? 'is-wrong' : ''}`}
              onClick={() => setChoice(i)}
            >
              <kbd>{i + 1}</kbd>
              <pre>{opt}</pre>
            </button>
          ))}
        </div>
      </section>

      <FeedbackSheet
        feedback={feedback}
        action={
          correct ? (
            <button className="btn btn--energy btn--block" onClick={onNext} autoFocus>Continuar</button>
          ) : checked ? (
            <button className="btn btn--primary btn--block" onClick={retry}>Otra vuelta</button>
          ) : (
            <button className="btn btn--primary btn--block" onClick={check} disabled={choice === null}>Comprobar</button>
          )
        }
      />
    </div>
  )
}

function FillStep({ ex, onSolved, onNext }: StepProps<FillExercise>) {
  const blanks = countBlanks(ex.code)
  const segments = ex.code.split('___')
  const [values, setValues] = useState<string[]>(() => Array(Math.max(1, blanks)).fill(''))
  const [marks, setMarks] = useState<boolean[] | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [mood, setMood] = useState<LoppyMood>('idle')
  const [fails, setFails] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [solved, setSolved] = useState(false)
  const p = useProgress()

  function edit(i: number, v: string) {
    setValues((vs) => vs.map((old, j) => (j === i ? v : old)))
    setMarks(null)
    setFeedback(null)
    setMood('idle')
  }

  function check() {
    if (solved || values.some((v) => !v.trim())) return
    const ok = values.map((v, i) => matchesAnswer(v, ex.answers[i], ex.caseSensitive))
    const passed = ok.every(Boolean)
    progress.registerAttempt(ex.id, passed)
    setMarks(ok)
    if (!passed) {
      setMood('error')
      setFails((f) => f + 1)
      const wrong = ok.filter((x) => !x).length
      setFeedback({
        kind: 'retry',
        phrase: pick(RETRY_PHRASES),
        title: blanks > 1 ? `${wrong === 1 ? 'Un hueco no calza' : `${wrong} huecos no calzan`}` : 'Esa no es',
        tip: ex.hint,
      })
      return
    }
    const r = progress.complete(ex.id, ex.xp)
    setMood('success')
    setSolved(true)
    onSolved(r.gained, r.streakUp)
    setFeedback({ kind: 'success', phrase: pick(SUCCESS_PHRASES), gained: r.gained, streakUp: r.streakUp, detail: ex.explain })
  }

  function reveal() {
    setValues(ex.answers.map((a) => a[0]))
    setMarks(null)
    setFeedback(null)
  }

  const markClass = (i: number) => (marks ? (marks[i] ? 'is-correct' : 'is-wrong') : '')
  const inputProps = (i: number) => ({
    value: values[i],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => edit(i, e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && check(),
    disabled: solved,
    autoCapitalize: 'off',
    autoCorrect: 'off',
    autoComplete: 'off',
    spellCheck: false,
  })

  return (
    <div className="step step--fill">
      <section className="step__brief">
        <p className="eyebrow">{ex.title} · {blanks ? 'Completa' : 'Escribe la respuesta'}</p>
        <div className="card card--concept"><RichText text={ex.concept} /></div>
        <DataTables tables={ex.tables} />
      </section>
      <section className="step__work">
        <div className="prompt">
          <Loppy mood={mood} streak={p.streak} size={92} />
          <div className="prompt__bubble"><RichText text={ex.prompt} /></div>
        </div>
        {blanks > 0 ? (
          <pre className="code-block code-block--fill">
            {segments.map((seg, i) => (
              <span key={i}>
                {seg}
                {i < blanks && (
                  <input
                    {...inputProps(i)}
                    className={`blank ${markClass(i)}`}
                    aria-label={`Hueco ${i + 1}`}
                    style={{ width: `${Math.max(6, values[i].length + 2)}ch` }}
                  />
                )}
              </span>
            ))}
          </pre>
        ) : (
          <>
            {ex.code && <pre className="code-block">{ex.code}</pre>}
            <label className="answer-field">
              Tu respuesta
              <input {...inputProps(0)} className={markClass(0)} />
            </label>
          </>
        )}
        <div className="step__aids">
          <button className="btn btn--ghost btn--sm" onClick={() => setShowHint(true)} disabled={showHint || solved}>
            <Bulb size={18} /> Pista
          </button>
          {fails >= 3 && !solved && (
            <button className="btn btn--ghost btn--sm" onClick={reveal}>
              <Eye size={18} /> Ver la respuesta
            </button>
          )}
        </div>
        {showHint && !solved && <div className="hint"><Bulb size={18} /><span>{ex.hint}</span></div>}
      </section>

      <FeedbackSheet
        feedback={feedback}
        action={
          solved ? (
            <button className="btn btn--energy btn--block" onClick={onNext} autoFocus>Continuar</button>
          ) : (
            <button className="btn btn--primary btn--block" onClick={check} disabled={values.some((v) => !v.trim())}>
              {feedback ? 'Intentar de nuevo' : 'Comprobar'}
            </button>
          )
        }
        hint={!solved ? 'Enter' : undefined}
      />
    </div>
  )
}

function FeedbackSheet({ feedback, action, hint }: { feedback: Feedback; action: React.ReactNode; hint?: string }) {
  return (
    <div className={`sheet ${feedback ? `sheet--${feedback.kind}` : ''}`}>
      <div className="sheet__inner">
        {feedback?.kind === 'success' && (
          <div className="sheet__msg">
            <strong>{feedback.phrase}</strong>
            <span className="sheet__reward">
              <Bolt size={16} /> +{feedback.gained} XP
              {feedback.streakUp && <><Flame size={16} /> ¡Racha +1!</>}
            </span>
            {feedback.detail && <p>{feedback.detail}</p>}
          </div>
        )}
        {feedback?.kind === 'retry' && (
          <div className="sheet__msg">
            <strong>{feedback.phrase}</strong>
            <p><b>{feedback.title}.</b> {feedback.tip}</p>
            {feedback.technical && (
              <details>
                <summary>Detalle técnico</summary>
                <pre>{feedback.technical}</pre>
              </details>
            )}
          </div>
        )}
        <div className="sheet__action">
          {action}
          {hint && <small>{hint}</small>}
        </div>
      </div>
    </div>
  )
}
