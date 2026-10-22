import type { DocumentReference, Firestore } from 'firebase/firestore'
import { progress, type Progress } from '../progress/store'
import { levelFor } from '../progress/levels'
import { loadFirebase } from './firebase'
import { setCloud, type Account } from './state'
import { startRanking, stopRanking } from './ranking'

// Sincroniza el progreso de este dispositivo con users/{uid} en Firestore.
//
// - El teléfono siempre guarda su copia; la nube se actualiza unos segundos después.
// - Lo que llega de otro dispositivo se COMBINA (mergeProgress): nunca se pierde avance.
// - "epoch" sube cuando alguien reinicia o restaura una copia: ese cambio MANDA sobre
//   lo demás, así un dispositivo viejo no revive el progreso borrado.

const WRITE_DELAY = 2000

type Fs = typeof import('firebase/firestore')

let session: {
  uid: string
  account: Account
  db: Firestore
  fs: Fs
  ref: DocumentReference
  epoch: number
  timer: ReturnType<typeof setTimeout> | null
  writing: Promise<void> | null
  stop: () => void
} | null = null

function epochKey(uid: string) {
  return `loppy.cloud.epoch.${uid}`
}
// Marca que el progreso de este teléfono ya es una copia del de la cuenta.
// Si no lo es (se practicó sin cuenta), al conectar se SUMA en vez de tomar el mayor.
const LINKED_KEY = 'loppy.cloud.linked'
export function unlinkLocal() {
  try {
    localStorage.removeItem(LINKED_KEY)
  } catch {
    /* sin almacenamiento */
  }
}

function queueKey(uid: string) {
  return `loppy.cloud.attempts.${uid}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* sin almacenamiento */
  }
}

/** Los campos de progreso, tal cual se ven en la consola de Firebase. */
function toCloud(p: Progress) {
  return {
    xp: p.xp,
    level: levelFor(p.xp).current.name,
    solved: Object.keys(p.completed).length,
    streak: p.streak,
    bestStreak: p.bestStreak,
    lastActive: p.lastActive,
    todayDate: p.todayDate,
    todayXp: p.todayXp,
    dailyGoal: p.dailyGoal,
    completed: p.completed,
    attempts: p.attempts,
    history: p.history,
  }
}

/** Compara sin importar el orden de las llaves. */
function same(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => (x < y ? -1 : 1)).map(([k, x]) => [k, norm(x)]))
      : v
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b))
}

function setStatusFromError(e: unknown) {
  const code = (e as { code?: string })?.code ?? ''
  setCloud({ sync: !navigator.onLine || code === 'unavailable' ? 'offline' : 'error' })
  if (code && code !== 'unavailable') console.warn('[Loppy nube]', code, e)
}

async function writeNow() {
  const s = session
  if (!s) return
  if (s.timer) clearTimeout(s.timer)
  s.timer = null
  if (s.epoch < 0) return // aún no se pudo leer la nube (sin internet): se sube al conectar
  const data = toCloud(progress.get())
  setCloud({ sync: 'saving' })
  const run: Promise<void> = s.fs
    .updateDoc(s.ref, { ...data, epoch: s.epoch, lastSeenAt: s.fs.serverTimestamp() })
    .then(() => {
      if (session === s && !s.timer) setCloud({ sync: 'saved' })
    })
    .catch(setStatusFromError)
    .finally(() => {
      if (s.writing === run) s.writing = null
    })
  s.writing = run
  await run
}

function scheduleWrite() {
  const s = session
  if (!s) return
  if (s.timer) clearTimeout(s.timer)
  setCloud({ sync: 'saving' })
  s.timer = setTimeout(writeNow, WRITE_DELAY)
}

// --- Intentos (para ver en qué retos se atora la gente). Se guardan en cola por si no hay internet. ---

type QueuedAttempt = { id: string; exerciseId: string; passed: boolean; day: string; ms: number }

async function flushAttempts() {
  const s = session
  if (!s) return
  const queue = readJson<QueuedAttempt[]>(queueKey(s.uid), [])
  if (queue.length === 0) return
  const batch = s.fs.writeBatch(s.db)
  const sent = queue.slice(0, 400)
  for (const a of sent) {
    batch.set(s.fs.doc(s.ref, 'attempts', a.id), {
      exerciseId: a.exerciseId,
      passed: a.passed,
      day: a.day,
      at: s.fs.Timestamp.fromMillis(a.ms),
    })
  }
  try {
    await batch.commit()
    const ids = new Set(sent.map((a) => a.id))
    writeJson(queueKey(s.uid), readJson<QueuedAttempt[]>(queueKey(s.uid), []).filter((a) => !ids.has(a.id)))
    if (queue.length > sent.length) void flushAttempts()
  } catch (e) {
    setStatusFromError(e)
  }
}

function queueAttempt(uid: string, exerciseId: string, passed: boolean) {
  const now = new Date()
  const day = progress.get().todayDate ?? now.toISOString().slice(0, 10)
  const id = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
  const queue = readJson<QueuedAttempt[]>(queueKey(uid), [])
  queue.push({ id, exerciseId, passed, day, ms: now.getTime() })
  writeJson(queueKey(uid), queue.slice(-2000))
}

// --- Inicio y fin ---

/** Empieza a sincronizar. isNew = acaba de crear la cuenta (se crea su documento). */
export async function startSync(account: Account, isNew = false) {
  stopSync()
  const { db, fsMod: fs } = await loadFirebase()
  const ref = fs.doc(db, 'users', account.uid)
  const s: NonNullable<typeof session> = {
    uid: account.uid,
    account,
    db,
    fs,
    ref,
    epoch: readJson<number>(epochKey(account.uid), -1),
    timer: null,
    writing: null,
    stop: () => {},
  }
  session = s
  setCloud({ sync: 'saving' })

  try {
    const snap = await fs.getDoc(ref)
    if (session !== s) return
    if (!snap.exists()) {
      // Cuenta nueva (o documento borrado): sube lo que haya en este dispositivo.
      s.epoch = 0
      const data = toCloud(progress.get())
      await fs.setDoc(ref, {
        name: account.name,
        email: account.email,
        createdAt: fs.serverTimestamp(),
        lastSeenAt: fs.serverTimestamp(),
        epoch: 0,
        ...data,
      })
    } else {
      const remote = snap.data()
      const remoteEpoch = typeof remote.epoch === 'number' ? remote.epoch : 0
      // Otro dispositivo reinició el progreso desde la última vez que este se conectó:
      // su versión manda. En un dispositivo nuevo para esta cuenta (-1), siempre se combina.
      const replace = s.epoch >= 0 && remoteEpoch > s.epoch && !isNew
      const linked = readJson<string | null>(LINKED_KEY, null) === account.uid
      s.epoch = remoteEpoch
      progress.fromCloud(remote as unknown as Progress, replace ? 'replace' : linked ? 'max' : 'sum')
      await writeNow()
    }
    writeJson(epochKey(account.uid), s.epoch)
    writeJson(LINKED_KEY, account.uid)
    if (session === s) setCloud({ sync: 'saved' })
  } catch (e) {
    if (session === s) setStatusFromError(e)
  }
  if (session !== s) return
  void startRanking(account, db, fs)

  // Cambios que llegan de otros dispositivos, en vivo.
  const unsubSnap = fs.onSnapshot(
    ref,
    (doc) => {
      if (doc.metadata.hasPendingWrites || !doc.exists() || session !== s) return
      const remote = doc.data()
      const remoteEpoch = typeof remote.epoch === 'number' ? remote.epoch : 0
      // Si el arranque no pudo leer la nube (sin internet), esta es la primera lectura.
      const linked = readJson<string | null>(LINKED_KEY, null) === s.uid
      progress.fromCloud(
        remote as unknown as Progress,
        s.epoch >= 0 && remoteEpoch > s.epoch ? 'replace' : linked ? 'max' : 'sum',
      )
      writeJson(LINKED_KEY, s.uid)
      if (remoteEpoch !== s.epoch) {
        s.epoch = Math.max(s.epoch, remoteEpoch)
        writeJson(epochKey(s.uid), s.epoch)
      }
      // Si este dispositivo tenía algo que la nube no, se sube.
      const mine = toCloud(progress.get())
      if (!same(mine, toCloud(remote as unknown as Progress))) scheduleWrite()
    },
    (e) => setStatusFromError(e),
  )

  const unsubChange = progress.onChange((_p, kind) => {
    if (kind === 'replace') {
      s.epoch += 1
      writeJson(epochKey(s.uid), s.epoch)
      void writeNow()
    } else {
      scheduleWrite()
    }
  })
  const unsubAttempt = progress.onAttempt((exerciseId, passed) => {
    queueAttempt(s.uid, exerciseId, passed)
    void flushAttempts()
  })
  const onOnline = () => {
    void writeNow()
    void flushAttempts()
  }
  const onHide = () => {
    if (document.visibilityState === 'hidden' && s.timer) void writeNow()
  }
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onHide)

  s.stop = () => {
    unsubSnap()
    unsubChange()
    unsubAttempt()
    window.removeEventListener('online', onOnline)
    document.removeEventListener('visibilitychange', onHide)
    if (s.timer) clearTimeout(s.timer)
  }
  void flushAttempts()
}

/** Sube lo pendiente (antes de cerrar sesión). Espera como máximo unos segundos. */
export async function flushSync(maxMs = 5000) {
  const s = session
  if (!s) return
  const work = Promise.all([s.timer ? writeNow() : s.writing, flushAttempts()])
  await Promise.race([work, new Promise((r) => setTimeout(r, maxMs))])
}

export function stopSync() {
  stopRanking()
  session?.stop()
  session = null
  setCloud({ sync: 'idle' })
}

/** Borra todo lo de la persona en la nube (documento, intentos y ranking). Lo usa "Borrar mi cuenta". */
export async function deleteCloudData(uid: string) {
  const { db, fsMod: fs } = await loadFirebase()
  const ref = fs.doc(db, 'users', uid)
  stopSync()
  for (;;) {
    const page = await fs.getDocs(fs.query(fs.collection(ref, 'attempts'), fs.limit(400)))
    if (page.empty) break
    const batch = fs.writeBatch(db)
    page.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  // Juntos: las reglas solo dejan borrar el ranking si también se borra la cuenta.
  const batch = fs.writeBatch(db)
  batch.delete(fs.doc(db, 'ranking', uid))
  batch.delete(ref)
  await batch.commit()
  try {
    localStorage.removeItem(epochKey(uid))
    localStorage.removeItem(queueKey(uid))
  } catch {
    /* nada que limpiar */
  }
}
