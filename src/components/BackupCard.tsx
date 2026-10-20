import { useRef, useState } from 'react'
import { dayKey, lastBackupDate, progress, useProgress, type Progress } from '../progress/store'
import { useCloud } from '../cloud/state'

type Msg = { kind: 'ok' | 'error'; text: string } | null

function daysSince(date: string | null): number | null {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  const then = new Date(y, m - 1, d).getTime()
  return Math.round((Date.now() - then) / 86_400_000)
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BackupCard() {
  const p = useProgress()
  const signedIn = useCloud().status === 'signedIn'
  const [last, setLast] = useState(lastBackupDate)
  const [pending, setPending] = useState<Progress | null>(null)
  const [msg, setMsg] = useState<Msg>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const age = daysSince(last)
  const needsBackup = !signedIn && p.xp > 0 && (age === null || age >= 7)

  function saved() {
    progress.markBackedUp()
    setLast(lastBackupDate())
    setMsg({ kind: 'ok', text: '¡Copia guardada! Tu progreso está a salvo.' })
  }

  async function exportBackup() {
    setMsg(null)
    const name = `loppy-progreso-${dayKey()}.json`
    const file = new File([progress.exportData()], name, { type: 'application/json' })

    // iPhone/Android: menú Compartir → "Guardar en Archivos", WhatsApp, Mail…
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Copia de Loppy' })
        saved()
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // la persona cerró el menú
      }
    }
    // Computadora (o si compartir falla): descarga normal.
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    saved()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite elegir el mismo archivo otra vez
    if (!file) return
    setMsg(null)
    const result = progress.parseBackup(await file.text())
    if (!result.ok) setMsg({ kind: 'error', text: result.error })
    else setPending(result.data)
  }

  function confirmRestore() {
    if (!pending) return
    progress.restore(pending)
    setLast(lastBackupDate())
    setPending(null)
    setMsg({ kind: 'ok', text: '¡Progreso restaurado! Bienvenido de vuelta al loop.' })
  }

  return (
    <section className="card backup">
      <h2>Copia de seguridad</h2>
      <p className="muted">
        {signedIn
          ? 'Tu progreso ya se guarda en tu cuenta. Si quieres, también puedes guardar una copia en un archivo.'
          : 'Tu progreso vive solo en este dispositivo. Guarda una copia para no perderlo si cambias de teléfono o borras la app.'}
      </p>

      {needsBackup && !msg && (
        <p className="backup__nudge">
          {age === null ? 'Aún no tienes ninguna copia.' : `Tu última copia es de hace ${age} días.`} ¡Protege tu racha!
        </p>
      )}

      {pending ? (
        <div className="backup__confirm">
          <p>
            <b>¿Restaurar esta copia?</b> Tiene <b>{pending.xp} XP</b>, racha de <b>{pending.streak}</b>{' '}
            {pending.streak === 1 ? 'día' : 'días'} y <b>{Object.keys(pending.completed).length}</b> retos resueltos.
            Reemplazará tu progreso actual ({p.xp} XP){signedIn ? ', también en tu cuenta' : ''}.
          </p>
          <div className="backup__actions">
            <button className="btn btn--primary btn--sm" onClick={confirmRestore}>Sí, restaurar</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setPending(null)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="backup__actions">
          <button className="btn btn--energy btn--sm" onClick={exportBackup}>Guardar copia</button>
          <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>Restaurar copia</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
        </div>
      )}

      {msg && <p className={`backup__msg backup__msg--${msg.kind}`} role="status">{msg.text}</p>}
      {last && <small className="muted">Última copia: {formatDate(last)}</small>}

      <style>{`
        .backup { display: grid; gap: 10px; }
        .backup h2, .backup p { margin: 0; }
        .backup__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .backup__nudge { background: #FEF9C3; border: 2px solid var(--yellow); color: #713F12; border-radius: var(--radius-sm); padding: 10px 12px; font-weight: 700; }
        .backup__confirm { display: grid; gap: 10px; background: #EFF6FF; border: 2px solid var(--blue); border-radius: var(--radius-sm); padding: 12px; }
        .backup__msg { font-weight: 800; }
        .backup__msg--ok { color: var(--ok); }
        .backup__msg--error { color: #C2410C; }
      `}</style>
    </section>
  )
}
