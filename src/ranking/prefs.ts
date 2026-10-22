import { useSyncExternalStore } from 'react'
import { detectCountry, isCountry } from './countries'

// Cómo aparece la persona en el ranking. Se guarda en el teléfono y, con cuenta, en ranking/{uid}.
export interface RankPrefs {
  country: string // 'PE', o '' = sin bandera
  hidden: boolean // true = no aparecer en el ranking
}

const KEY = 'loppy.ranking'

function load(): RankPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<RankPrefs>
      return { country: typeof p.country === 'string' && isCountry(p.country) ? p.country : '', hidden: p.hidden === true }
    }
  } catch {
    /* sin almacenamiento: se usa lo detectado */
  }
  return { country: detectCountry(), hidden: false }
}

let state = load()
const listeners = new Set<() => void>()

export const rankPrefs = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  set(patch: Partial<RankPrefs>) {
    const next = { ...state, ...patch }
    if (next.country !== '' && !isCountry(next.country)) next.country = ''
    if (next.country === state.country && next.hidden === state.hidden) return
    state = next
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* sin almacenamiento: vale solo por esta vez */
    }
    listeners.forEach((l) => l())
  },
}

export function useRankPrefs(): RankPrefs {
  return useSyncExternalStore(rankPrefs.subscribe, rankPrefs.get)
}
