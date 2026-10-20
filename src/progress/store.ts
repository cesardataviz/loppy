import { useSyncExternalStore } from 'react'

// Persistencia local: el teléfono siempre tiene su copia (funciona sin internet).
// Si hay cuenta, src/cloud/ escucha los cambios y los sube a la nube.
export interface Progress {
  xp: number
  streak: number
  bestStreak: number
  lastActive: string | null
  todayDate: string | null
  todayXp: number
  dailyGoal: number
  completed: Record<string, { at: string; attempts: number }>
  attempts: Record<string, number>
  history: Record<string, number> // fecha -> XP ganado ese día
}

const KEY = 'loppy.progress.v1'

const initial: Progress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActive: null,
  todayDate: null,
  todayXp: 0,
  dailyGoal: 30,
  completed: {},
  attempts: {},
  history: {},
}

export function dayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayKey(d)
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalize({ ...initial, ...JSON.parse(raw) })
  } catch {
    /* almacenamiento no disponible: se usa el estado inicial */
  }
  return normalize({ ...initial })
}

// Al abrir la app: si pasó más de un día sin practicar, la racha vuelve a 0.
function normalize(p: Progress): Progress {
  const today = dayKey()
  const out = { ...p }
  if (out.lastActive && out.lastActive !== today && out.lastActive !== yesterdayKey()) out.streak = 0
  if (out.todayDate !== today) {
    out.todayDate = today
    out.todayXp = 0
  }
  return out
}

/**
 * Junta dos progresos sin perder nada: retos de ambos lados y la racha del lado que practicó
 * más recientemente. 'max' = son copias del mismo progreso (se toma el mayor por día).
 * 'sum' = son avances distintos, p. ej. lo que se hizo sin cuenta + la cuenta (se suman).
 */
export function mergeProgress(a: Progress, b: Progress, mode: 'max' | 'sum' = 'max'): Progress {
  const join = (x: number, y: number) => (mode === 'sum' ? x + y : Math.max(x, y))
  const completed = { ...b.completed }
  for (const [id, done] of Object.entries(a.completed)) {
    const other = completed[id]
    completed[id] = other
      ? { at: other.at < done.at ? other.at : done.at, attempts: Math.max(other.attempts, done.attempts) }
      : done
  }
  const attempts = { ...b.attempts }
  for (const [id, n] of Object.entries(a.attempts)) attempts[id] = join(attempts[id] ?? 0, n)
  const history = { ...b.history }
  for (const [day, xp] of Object.entries(a.history)) history[day] = join(history[day] ?? 0, xp)

  const historyXp = Object.values(history).reduce((sum, x) => sum + x, 0)
  const recent = (a.lastActive ?? '') >= (b.lastActive ?? '') ? a : b
  const sameDay = a.todayDate === b.todayDate
  return normalize({
    xp: Math.max(join(a.xp, b.xp), historyXp),
    streak: a.lastActive === b.lastActive ? Math.max(a.streak, b.streak) : recent.streak,
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    lastActive: recent.lastActive,
    todayDate: recent.todayDate,
    todayXp: sameDay ? join(a.todayXp, b.todayXp) : recent.todayXp,
    dailyGoal: recent.dailyGoal,
    completed,
    attempts,
    history,
  })
}

/** 'update' = avance normal (se combina). 'replace' = reinicio o copia restaurada (manda sobre la nube). */
export type ChangeKind = 'update' | 'replace'

let state = load()
const listeners = new Set<() => void>()
const changeListeners = new Set<(p: Progress, kind: ChangeKind) => void>()
const attemptListeners = new Set<(exerciseId: string, passed: boolean) => void>()

function set(next: Progress, kind: ChangeKind | null = 'update') {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* sin persistencia, la sesión sigue funcionando */
  }
  listeners.forEach((l) => l())
  if (kind) changeListeners.forEach((l) => l(state, kind))
}

export const progress = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },

  /** Cada vez que alguien comprueba una respuesta (acierte o no). */
  registerAttempt(exerciseId: string, passed: boolean) {
    set({ ...state, attempts: { ...state.attempts, [exerciseId]: (state.attempts[exerciseId] ?? 0) + 1 } })
    attemptListeners.forEach((l) => l(exerciseId, passed))
  },

  /** Marca un ejercicio como resuelto. Devuelve el XP ganado y si la racha subió. */
  complete(exerciseId: string, xp: number): { gained: number; streakUp: boolean; firstTime: boolean } {
    const s = normalize(state)
    const today = dayKey()
    const firstTime = !s.completed[exerciseId]
    // Repetir un ejercicio da poco XP: suma, pero premia avanzar.
    const gained = firstTime ? xp : Math.max(2, Math.round(xp / 5))

    let streak = s.streak
    let streakUp = false
    if (s.lastActive !== today) {
      streak = s.lastActive === yesterdayKey() ? s.streak + 1 : 1
      streakUp = true
    }

    set({
      ...s,
      xp: s.xp + gained,
      streak,
      bestStreak: Math.max(s.bestStreak, streak),
      lastActive: today,
      todayXp: s.todayXp + gained,
      completed: firstTime ? { ...s.completed, [exerciseId]: { at: today, attempts: (s.attempts[exerciseId] ?? 0) + 1 } } : s.completed,
      history: { ...s.history, [today]: (s.history[today] ?? 0) + gained },
    })
    return { gained, streakUp, firstTime }
  },

  setDailyGoal(goal: number) {
    set({ ...state, dailyGoal: goal })
  },

  reset() {
    set(normalize({ ...initial }), 'replace')
  },

  // --- Para src/cloud/ ---

  /** Avisa cada cambio hecho en este dispositivo (los que llegan de la nube no se re-avisan). */
  onChange(l: (p: Progress, kind: ChangeKind) => void) {
    changeListeners.add(l)
    return () => changeListeners.delete(l)
  },

  onAttempt(l: (exerciseId: string, passed: boolean) => void) {
    attemptListeners.add(l)
    return () => attemptListeners.delete(l)
  },

  /** Progreso que llegó de la nube: se combina con el local ('max' o 'sum') o lo reemplaza. */
  fromCloud(data: Progress, how: 'max' | 'sum' | 'replace') {
    const clean = sanitize(data)
    set(how === 'replace' ? normalize(clean) : mergeProgress(state, clean, how), null)
  },

  /** Al cerrar sesión: el progreso queda en la cuenta y el dispositivo vuelve a empezar. */
  clearLocal() {
    set(normalize({ ...initial }), null)
  },

  /** Copia de seguridad en texto JSON, para guardarla fuera del dispositivo. */
  exportData(): string {
    const backup: Backup = { app: 'loppy', version: 1, exportedAt: new Date().toISOString(), progress: state }
    return JSON.stringify(backup, null, 2)
  },

  /** Recuerda que se guardó una copia (se llama solo cuando se guardó de verdad). */
  markBackedUp() {
    markBackup()
  },

  /** Lee una copia de seguridad. No modifica nada: devuelve el progreso para confirmarlo antes. */
  parseBackup(raw: string): { ok: true; data: Progress } | { ok: false; error: string } {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'El archivo no es una copia de Loppy (no se pudo leer).' }
    }
    const b = parsed as Partial<Backup>
    if (!b || b.app !== 'loppy' || typeof b.progress !== 'object' || b.progress === null) {
      return { ok: false, error: 'Este archivo no parece una copia de seguridad de Loppy.' }
    }
    return { ok: true, data: sanitize(b.progress) }
  },

  /** Reemplaza el progreso actual por el de una copia ya validada con parseBackup. */
  restore(data: Progress) {
    set(normalize({ ...initial, ...data }), 'replace')
    markBackup()
  },
}

/** Convierte datos de afuera (copia o nube) en un progreso válido, descartando lo que no cuadre. */
function sanitize(raw: unknown): Progress {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<Progress>
  const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback)
  const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
  const record = <T,>(v: unknown, ok: (x: unknown) => x is T): Record<string, T> => {
    const out: Record<string, T> = {}
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (ok(x)) out[k] = x
    return out
  }
  const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0
  const isDone = (x: unknown): x is { at: string; attempts: number } =>
    !!x && typeof x === 'object' && typeof (x as { at?: unknown }).at === 'string'
  return {
      xp: num(p.xp),
      streak: num(p.streak),
      bestStreak: num(p.bestStreak),
      lastActive: date(p.lastActive),
      todayDate: date(p.todayDate),
      todayXp: num(p.todayXp),
      dailyGoal: num(p.dailyGoal, 30) || 30,
      completed: record(p.completed, isDone),
      attempts: record(p.attempts, isNum),
      history: record(p.history, isNum),
  }
}

interface Backup {
  app: 'loppy'
  version: 1
  exportedAt: string
  progress: Progress
}

const BACKUP_KEY = 'loppy.lastBackup'

function markBackup() {
  try {
    localStorage.setItem(BACKUP_KEY, dayKey())
  } catch {
    /* sin almacenamiento: no se recuerda la fecha */
  }
}

/** Fecha (YYYY-MM-DD) de la última copia de seguridad, o null si nunca se hizo. */
export function lastBackupDate(): string | null {
  try {
    return localStorage.getItem(BACKUP_KEY)
  } catch {
    return null
  }
}

export function useProgress(): Progress {
  return useSyncExternalStore(progress.subscribe, progress.get)
}
