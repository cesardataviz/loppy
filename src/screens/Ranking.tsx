import { useCallback, useEffect, useState } from 'react'
import { fetchBoard, weekEndsIn, type Board, type BoardData, type RankRow } from '../cloud/ranking'
import { useCloud } from '../cloud/state'
import { openAuth } from '../components/AuthSheet'
import { flag, countryName } from '../ranking/countries'
import { useRankPrefs } from '../ranking/prefs'
import './Ranking.css'

const BOARDS: { id: Board; label: string }[] = [
  { id: 'week', label: 'Semanal' },
  { id: 'all', label: 'Histórico' },
]

const MEDAL = ['🏆', '🥈', '🥉']

const BOARD_KEY = 'loppy.ranking.board'

function savedBoard(): Board {
  try {
    return localStorage.getItem(BOARD_KEY) === 'all' ? 'all' : 'week'
  } catch {
    return 'week'
  }
}

function endsLabel() {
  const days = Math.ceil(weekEndsIn() / 86_400_000)
  return days <= 1 ? 'Termina hoy a medianoche' : `Termina en ${days} días`
}

function Flag({ code }: { code: string }) {
  if (!flag(code)) return null
  return (
    <span className="flag" role="img" aria-label={countryName(code)} title={countryName(code)}>
      {flag(code)}
    </span>
  )
}

export function Ranking() {
  const cloud = useCloud()
  const prefs = useRankPrefs()
  const [board, setBoard] = useState<Board>(savedBoard)
  const [data, setData] = useState<BoardData | null>(null)
  const [failed, setFailed] = useState(false)
  const uid = cloud.account?.uid

  const load = useCallback((which: Board, force = false) => {
    setFailed(false)
    fetchBoard(which, force)
      .then((d) => setData(d))
      .catch((e) => {
        console.warn('[Loppy ranking]', e)
        setFailed(true)
      })
  }, [])

  useEffect(() => {
    setData(null)
    load(board)
    try {
      localStorage.setItem(BOARD_KEY, board)
    } catch {
      /* solo se olvida la pestaña */
    }
  }, [board, uid, load])

  if (cloud.status === 'off') {
    return (
      <div className="page rank">
        <p className="muted">El ranking necesita conexión con la nube de Loppy.</p>
      </div>
    )
  }

  const rows = data?.rows ?? []
  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)
  const meInList = !!data?.me && data.me.place <= rows.length

  return (
    <div className="page rank">
      <header className="rank__head">
        <div>
          <p className="eyebrow">{board === 'week' ? endsLabel() : 'Todo el XP desde que empezaste'}</p>
          <h1>Ranking</h1>
        </div>
        <div className="rank__tabs" role="tablist" aria-label="Tipo de ranking">
          {BOARDS.map((b) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={board === b.id}
              className={board === b.id ? 'is-active' : ''}
              onClick={() => setBoard(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </header>

      {failed ? (
        <section className="card rank__empty">
          <p><b>No pudimos cargar el ranking.</b> Revisa tu internet y vuelve a intentar.</p>
          <button className="btn btn--ghost btn--sm" onClick={() => load(board, true)}>Reintentar</button>
        </section>
      ) : !data ? (
        <div className="rank__loading" aria-label="Cargando ranking">
          <div className="podium">{[2, 1, 3].map((n) => <div key={n} className={`podium__spot podium__spot--${n} is-skeleton`} />)}</div>
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="rank__row is-skeleton" />)}
        </div>
      ) : rows.length === 0 ? (
        <section className="card rank__empty">
          <p className="rank__big" aria-hidden>🚀</p>
          <p>
            <b>{board === 'week' ? 'Nadie ha sumado XP esta semana.' : 'Todavía no hay nadie en el ranking.'}</b>
            <br />¡El primer lugar está libre! Resuelve un reto y aparece aquí.
          </p>
        </section>
      ) : (
        <>
          <div className="podium">
            {[1, 0, 2].map((i) => podium[i] && <Spot key={podium[i].uid} row={podium[i]} place={i + 1} me={podium[i].uid === uid} />)}
          </div>
          {rest.length > 0 && (
            <ol className="rank__list" start={4}>
              {rest.map((r, i) => (
                <Row key={r.uid} row={r} place={i + 4} me={r.uid === uid} />
              ))}
            </ol>
          )}
        </>
      )}

      {data && cloud.status === 'signedIn' && !meInList && (
        <section className="card rank__me">
          {prefs.hidden ? (
            <p>Estás oculto del ranking. Puedes volver a aparecer desde tu <b>Perfil</b>.</p>
          ) : data.me ? (
            <p>Tu puesto: <b>#{data.me.place}</b> con <b>{data.me.score} XP</b>. ¡Sigue sumando vueltas!</p>
          ) : (
            <p>{board === 'week' ? 'Resuelve un reto esta semana para entrar al ranking semanal.' : 'Resuelve tu primer reto para entrar al ranking.'}</p>
          )}
        </section>
      )}

      {cloud.status !== 'signedIn' && (
        <section className="card rank__cta">
          <p><b>¿Quieres aparecer aquí?</b> Crea tu cuenta gratis: tu XP entra al ranking con tu nombre y tu país.</p>
          <button className="btn btn--primary btn--sm" onClick={() => openAuth('signup')}>Crear cuenta</button>
        </section>
      )}
    </div>
  )
}

function Spot({ row, place, me }: { row: RankRow; place: number; me: boolean }) {
  return (
    <div className={`podium__spot podium__spot--${place} ${me ? 'is-me' : ''}`}>
      <span className="podium__medal" aria-hidden>{MEDAL[place - 1]}</span>
      <Flag code={row.country} />
      <strong className="podium__name">{row.name}{me && <small> (tú)</small>}</strong>
      <span className="podium__xp">{row.score} XP</span>
      <span className="podium__base" aria-label={`Puesto ${place}`}>{place}</span>
    </div>
  )
}

function Row({ row, place, me }: { row: RankRow; place: number; me: boolean }) {
  return (
    <li className={`rank__row ${me ? 'is-me' : ''}`}>
      <span className="rank__place">{place}</span>
      <Flag code={row.country} />
      <span className="rank__name">{row.name}{me && <small> (tú)</small>}</span>
      <span className="rank__xp">{row.score} <small>XP</small></span>
    </li>
  )
}
