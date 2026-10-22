import type { DocumentReference, Firestore } from 'firebase/firestore'
import { progress } from '../progress/store'
import { rankPrefs } from '../ranking/prefs'
import { loadFirebase } from './firebase'
import { getCloud, type Account } from './state'

// Ranking público: ranking/{uid} = { name, country, hidden, xp, week, weekXp, day, dayXp, updatedAt }
//
// - Cualquiera puede verlo (sin cuenta); para aparecer hay que tener cuenta.
// - Solo muestra nombre, país y XP: nunca el correo.
// - Anti-trampas (firestore.rules): el XP del ranking sube como máximo DAY_CAP por día. Si alguien
//   gana más (o junta el progreso de antes de tener cuenta), el ranking lo alcanza en los días siguientes.
// - Los días y semanas van en hora de Perú/Colombia (UTC-5); la semana empieza el lunes.

export const DAY_CAP = 2000
const OFFSET = 5 * 3600_000
const DAY = 86_400_000
const WRITE_DELAY = 3000
const RETRY_DELAY = 60_000

export type Board = 'week' | 'all'

interface Entry {
  name: string
  country: string
  hidden: boolean
  xp: number
  week: number
  weekXp: number
  day: number
  dayXp: number
}

export function rankDay(ms = Date.now()) {
  return Math.floor((ms - OFFSET) / DAY)
}
export function rankWeek(day = rankDay()) {
  return Math.floor((day + 3) / 7) // el día 0 (1-ene-1970) fue jueves: así las semanas empiezan el lunes
}
/** Milisegundos hasta que empieza la próxima semana del ranking. */
export function weekEndsIn(ms = Date.now()) {
  const nextMonday = (rankWeek(rankDay(ms)) + 1) * 7 - 3
  return nextMonday * DAY + OFFSET - ms
}

/** XP de esta semana según el historial del teléfono (para la primera vez que se aparece). */
function weekXpFromHistory(week: number) {
  let sum = 0
  for (const [date, xp] of Object.entries(progress.get().history)) {
    const [y, m, d] = date.split('-').map(Number)
    if (rankWeek(Date.UTC(y, m - 1, d) / DAY) === week) sum += xp
  }
  return sum
}

/** Lo que se sube: el XP del teléfono, con el tope diario. Debe cuadrar con firestore.rules. */
function nextEntry(old: Entry | null, account: Account, createdAtMs: number): Entry {
  const target = progress.get().xp
  const { country, hidden } = rankPrefs.get()
  const day = rankDay()
  const week = rankWeek(day)
  const base = { name: account.name.slice(0, 40) || 'Loopero', country, hidden, week, day }

  if (!old) {
    const allowance = DAY_CAP * (Math.floor((Date.now() - createdAtMs) / DAY) + 1)
    const xp = Math.min(target, allowance)
    return { ...base, xp, dayXp: 0, weekXp: Math.min(weekXpFromHistory(week), xp, DAY_CAP * 7) }
  }
  const prevDay = old.day === day ? old.dayXp : 0
  const prevWeek = old.week === week ? old.weekXp : 0
  const gain = target - old.xp
  if (gain <= 0) return { ...base, xp: target, dayXp: prevDay, weekXp: Math.min(prevWeek, target) }
  const g = Math.max(0, Math.min(gain, DAY_CAP - prevDay))
  return { ...base, xp: old.xp + g, dayXp: prevDay + g, weekXp: prevWeek + g }
}

function sameEntry(a: Entry, b: Entry) {
  return (Object.keys(a) as (keyof Entry)[]).every((k) => a[k] === b[k])
}

function toEntry(data: Record<string, unknown>): Entry {
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
  return {
    name: typeof data.name === 'string' ? data.name : '',
    country: typeof data.country === 'string' ? data.country : '',
    hidden: data.hidden === true,
    xp: n(data.xp),
    week: n(data.week),
    weekXp: n(data.weekXp),
    day: n(data.day),
    dayXp: n(data.dayXp),
  }
}

// --- Publicar mi lugar ---

type Fs = typeof import('firebase/firestore')

let session: {
  account: Account
  db: Firestore
  fs: Fs
  ref: DocumentReference
  mine: Entry | null
  timer: ReturnType<typeof setTimeout> | null
  stop: () => void
} | null = null

async function publish() {
  const s = session
  if (!s) return
  if (s.timer) clearTimeout(s.timer)
  s.timer = null
  try {
    let createdAtMs = Date.now()
    if (!s.mine) {
      const user = await s.fs.getDoc(s.fs.doc(s.db, 'users', s.account.uid))
      const created = user.get('createdAt') as { toMillis?: () => number } | undefined
      if (!user.exists()) throw Object.assign(new Error('Aún no existe users/{uid}'), { code: 'not-found' })
      createdAtMs = created?.toMillis?.() ?? Date.now()
    }
    const next = nextEntry(s.mine, s.account, createdAtMs)
    if (s.mine && sameEntry(s.mine, next)) return
    await s.fs.setDoc(s.ref, { ...next, updatedAt: s.fs.serverTimestamp() })
    if (session !== s) return
    s.mine = next
    boardCache.clear()
    // Si quedó XP por subir (tope del día), se reintenta más tarde: mañana entra el resto.
    if (next.xp < progress.get().xp && next.dayXp < DAY_CAP) schedule()
  } catch (e) {
    if (session !== s) return
    console.warn('[Loppy ranking]', (e as { code?: string })?.code ?? e)
    s.timer = setTimeout(publish, RETRY_DELAY)
  }
}

function schedule(delay = WRITE_DELAY) {
  const s = session
  if (!s) return
  if (s.timer) clearTimeout(s.timer)
  s.timer = setTimeout(publish, delay)
}

/** Lo llama sync.ts cuando la cuenta ya tiene su documento users/{uid}. */
export async function startRanking(account: Account, db: Firestore, fs: Fs) {
  stopRanking()
  const ref = fs.doc(db, 'ranking', account.uid)
  const s: NonNullable<typeof session> = { account, db, fs, ref, mine: null, timer: null, stop: () => {} }
  session = s
  try {
    const snap = await fs.getDoc(ref)
    if (session !== s) return
    if (snap.exists()) {
      s.mine = toEntry(snap.data())
      // En un teléfono nuevo, manda lo que la persona eligió antes (país, oculto).
      if (!localStorage.getItem('loppy.ranking.linked')) rankPrefs.set({ country: s.mine.country, hidden: s.mine.hidden })
    }
    localStorage.setItem('loppy.ranking.linked', '1')
  } catch {
    /* sin internet: se intenta al publicar */
  }
  if (session !== s) return
  const unsubProgress = progress.subscribe(() => schedule())
  const unsubPrefs = rankPrefs.subscribe(() => schedule(500))
  s.stop = () => {
    unsubProgress()
    unsubPrefs()
    if (s.timer) clearTimeout(s.timer)
  }
  void publish()
}

export function stopRanking() {
  session?.stop()
  session = null
  try {
    localStorage.removeItem('loppy.ranking.linked')
  } catch {
    /* nada que limpiar */
  }
}

// --- Leer el ranking ---

export interface RankRow {
  uid: string
  name: string
  country: string
  score: number
}

export interface BoardData {
  rows: RankRow[]
  /** Mi puesto y puntaje (null = sin cuenta, oculto o sin XP en este ranking). */
  me: { place: number; score: number } | null
}

const TOP = 50
const CACHE_MS = 60_000
const boardCache = new Map<Board, { at: number; data: BoardData }>()

export async function fetchBoard(board: Board, force = false): Promise<BoardData> {
  const cached = boardCache.get(board)
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.data

  const { db, fsMod: fs } = await loadFirebase()
  const col = fs.collection(db, 'ranking')
  const week = rankWeek()
  const field = board === 'week' ? 'weekXp' : 'xp'
  const filters = board === 'week' ? [fs.where('hidden', '==', false), fs.where('week', '==', week)] : [fs.where('hidden', '==', false)]
  const snap = await fs.getDocs(fs.query(col, ...filters, fs.orderBy(field, 'desc'), fs.limit(TOP)))
  const rows: RankRow[] = snap.docs
    .map((d) => {
      const e = toEntry(d.data())
      return { uid: d.id, name: e.name, country: e.country, score: board === 'week' ? e.weekXp : e.xp }
    })
    .filter((r) => r.score > 0)

  let me: BoardData['me'] = null
  const uid = getCloud().account?.uid
  const mine = session?.mine
  if (uid) {
    const idx = rows.findIndex((r) => r.uid === uid)
    if (idx >= 0) me = { place: idx + 1, score: rows[idx].score }
    else if (mine && !mine.hidden) {
      const score = board === 'week' ? (mine.week === week ? mine.weekXp : 0) : mine.xp
      if (score > 0) {
        const ahead = await fs.getCountFromServer(fs.query(col, ...filters, fs.where(field, '>', score), fs.orderBy(field, 'desc')))
        me = { place: ahead.data().count + 1, score }
      }
    }
  }
  const data = { rows, me }
  boardCache.set(board, { at: Date.now(), data })
  return data
}
