import { useMemo } from 'react'
import { useCloud } from '../cloud/state'
import { allCountries, flag } from '../ranking/countries'
import { rankPrefs, useRankPrefs } from '../ranking/prefs'

/** En el Perfil: país y si aparecer o no en el ranking. */
export function RankingCard() {
  const cloud = useCloud()
  const prefs = useRankPrefs()
  const countries = useMemo(allCountries, [])

  if (cloud.status === 'off') return null

  return (
    <section className="card rkc">
      <h2>Ranking</h2>
      <p className="muted">
        {cloud.status === 'signedIn'
          ? `Apareces como ${cloud.account?.name ?? ''}, con tu país y tu XP. Tu correo nunca se muestra.`
          : 'Con cuenta apareces con tu nombre, tu país y tu XP. Tu correo nunca se muestra.'}
      </p>
      <label className="rkc__field">
        <span>País</span>
        <span className="rkc__select">
          <span className="flag" aria-hidden>{flag(prefs.country) || '🏳️'}</span>
          <select value={prefs.country} onChange={(e) => rankPrefs.set({ country: e.target.value })}>
            <option value="">Sin país</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </span>
      </label>
      <label className="rkc__toggle">
        <input type="checkbox" checked={!prefs.hidden} onChange={(e) => rankPrefs.set({ hidden: !e.target.checked })} />
        <span>Aparecer en el ranking</span>
      </label>
      <style>{`
        .rkc { display: grid; gap: 12px; }
        .rkc h2, .rkc p { margin: 0; }
        .rkc__field { display: grid; gap: 6px; font-weight: 800; }
        .rkc__select { display: flex; align-items: center; gap: 10px; }
        .rkc__select .flag { font-size: 26px; }
        .rkc__select select { flex: 1; min-width: 0; font: inherit; font-size: 16px; min-height: 44px; padding: 0 10px; border-radius: var(--radius-sm); border: 2px solid var(--line); background: var(--card); color: var(--ink); }
        .rkc__toggle { display: flex; align-items: center; gap: 10px; font-weight: 800; cursor: pointer; }
        .rkc__toggle input { width: 22px; height: 22px; accent-color: var(--violet); }
      `}</style>
    </section>
  )
}
