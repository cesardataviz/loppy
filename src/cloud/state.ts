import { useSyncExternalStore } from 'react'
import { cloudEnabled } from './firebase'

export interface Account {
  uid: string
  email: string
  name: string
}

/** saving = subiendo cambios · saved = todo en la nube · offline = sin internet, se sube al volver. */
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

export interface CloudState {
  /** off = la app no tiene nube configurada · loading = revisando si hay sesión */
  status: 'off' | 'loading' | 'signedOut' | 'signedIn'
  account: Account | null
  sync: SyncStatus
}

// Recordamos quién inició sesión para mostrarlo al instante, antes de que cargue Firebase.
const HINT_KEY = 'loppy.account'

function readHint(): Account | null {
  try {
    const raw = localStorage.getItem(HINT_KEY)
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

const hint = readHint()
let state: CloudState = {
  status: !cloudEnabled ? 'off' : hint ? 'signedIn' : 'loading',
  account: hint,
  sync: 'idle',
}
const listeners = new Set<() => void>()

export function getCloud() {
  return state
}

export function setCloud(patch: Partial<CloudState>) {
  state = { ...state, ...patch }
  if ('account' in patch) {
    try {
      if (state.account) localStorage.setItem(HINT_KEY, JSON.stringify(state.account))
      else localStorage.removeItem(HINT_KEY)
    } catch {
      /* sin almacenamiento: solo se pierde el atajo visual */
    }
  }
  listeners.forEach((l) => l())
}

export function useCloud(): CloudState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getCloud,
  )
}

/** Hay alguien con sesión guardada en este dispositivo (aunque Firebase aún no cargue). */
export const hadSession = hint !== null
