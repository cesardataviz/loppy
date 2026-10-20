import { useState } from 'react'
import { deleteAccount, friendlyAuthError, signOutAccount } from '../cloud/account'
import { useCloud, type SyncStatus } from '../cloud/state'
import { openAuth } from './AuthSheet'

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: '',
  saving: 'Guardando…',
  saved: 'Todo guardado en tu cuenta',
  offline: 'Sin conexión: se guarda al volver el internet',
  error: 'No se pudo guardar. Lo reintentaremos.',
}

export function AccountCard() {
  const cloud = useCloud()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  if (cloud.status === 'off') return null

  if (cloud.status !== 'signedIn' || !cloud.account) {
    return (
      <section className="card account account--invite">
        <h2>Guarda tu progreso en la nube</h2>
        <p className="muted">Crea tu cuenta gratis: tu racha y tu XP quedan a salvo y puedes seguir en cualquier dispositivo.</p>
        {msg && <p className={`account__msg account__msg--${msg.kind}`} role="status">{msg.text}</p>}
        <div className="account__actions">
          <button className="btn btn--primary btn--sm" onClick={() => openAuth('signup')}>Crear cuenta</button>
          <button className="btn btn--ghost btn--sm" onClick={() => openAuth('signin')}>Ya tengo cuenta</button>
        </div>
        <AccountStyles />
      </section>
    )
  }

  const { account, sync } = cloud

  async function logout() {
    setBusy(true)
    try {
      await signOutAccount()
      setMsg({ kind: 'ok', text: 'Sesión cerrada. Tu progreso sigue guardado en tu cuenta.' })
    } catch (e) {
      setMsg({ kind: 'error', text: friendlyAuthError(e) })
    } finally {
      setBusy(false)
    }
  }

  async function remove(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await deleteAccount(password)
      setConfirmDelete(false)
      setMsg({ kind: 'ok', text: 'Tu cuenta y sus datos en la nube se borraron. Tu progreso sigue en este dispositivo.' })
    } catch (err) {
      setMsg({ kind: 'error', text: friendlyAuthError(err) })
    } finally {
      setBusy(false)
      setPassword('')
    }
  }

  return (
    <section className="card account">
      <div className="account__who">
        <span className="account__avatar" aria-hidden>{account.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{account.name}</strong>
          <span className="muted">{account.email}</span>
        </div>
      </div>
      {SYNC_LABEL[sync] && <p className={`account__sync account__sync--${sync}`}>{SYNC_LABEL[sync]}</p>}
      {msg && <p className={`account__msg account__msg--${msg.kind}`} role="status">{msg.text}</p>}

      {confirmDelete ? (
        <form className="account__danger" onSubmit={remove}>
          <p>
            <b>¿Borrar tu cuenta?</b> Se borran tu cuenta y tu progreso guardado en la nube. No se puede deshacer.
            Escribe tu contraseña para confirmar.
          </p>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Contraseña"
            placeholder="Contraseña"
          />
          <div className="account__actions">
            <button className="btn btn--sm account__delete" disabled={busy || !password}>
              {busy ? 'Borrando…' : 'Sí, borrar mi cuenta'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <div className="account__actions">
          <button className="btn btn--ghost btn--sm" onClick={logout} disabled={busy}>Cerrar sesión</button>
          <button className="account__link" onClick={() => { setMsg(null); setConfirmDelete(true) }}>Borrar mi cuenta</button>
        </div>
      )}
      <AccountStyles />
    </section>
  )
}

function AccountStyles() {
  return (
    <style>{`
      .account { display: grid; gap: 10px; }
      .account h2, .account p { margin: 0; }
      .account--invite { background: linear-gradient(135deg, #EFF6FF, #F5F3FF); border-color: #C7D2FE; }
      .account__actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .account__who { display: flex; align-items: center; gap: 12px; }
      .account__who > div { display: grid; }
      .account__who strong { font-size: 18px; font-weight: 900; }
      .account__avatar { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; font-weight: 900; font-size: 20px; color: #fff; background: linear-gradient(135deg, var(--violet), var(--blue)); }
      .account__sync { font-size: 14px; font-weight: 700; color: var(--ink-2); }
      .account__sync--saved { color: var(--ok); }
      .account__sync--offline { color: var(--yellow-deep); }
      .account__sync--error { color: #C2410C; }
      .account__msg { font-weight: 800; }
      .account__msg--ok { color: var(--ok); }
      .account__msg--error { color: #C2410C; }
      .account__link { margin-left: auto; color: var(--ink-3); font-size: 14px; font-weight: 700; text-decoration: underline; padding: 6px 2px; }
      .account__danger { display: grid; gap: 10px; background: #FFF7ED; border: 2px solid #FDBA74; border-radius: var(--radius-sm); padding: 12px; }
      .account__danger input { font: inherit; font-size: 16px; min-height: 44px; padding: 0 12px; border-radius: var(--radius-sm); border: 2px solid var(--line); }
      .account__delete { background: #C2410C; color: #fff; }
    `}</style>
  )
}
