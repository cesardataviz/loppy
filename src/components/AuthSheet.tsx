import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { friendlyAuthError, sendReset, signIn, signUp } from '../cloud/account'
import { Close } from './Icons'
import { APP_NAME } from '../brand'

export type AuthMode = 'signup' | 'signin' | 'reset'

// Cualquier pantalla puede abrir la hoja con openAuth('signup').
let openMode: AuthMode | null = null
const listeners = new Set<() => void>()
function setMode(m: AuthMode | null) {
  openMode = m
  listeners.forEach((l) => l())
}
export const openAuth = (mode: AuthMode = 'signup') => setMode(mode)
export const closeAuth = () => setMode(null)

const TITLES: Record<AuthMode, string> = {
  signup: 'Crea tu cuenta',
  signin: '¡Hola de nuevo!',
  reset: 'Recupera tu contraseña',
}

export function AuthSheet() {
  const mode = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => openMode,
  )
  if (!mode) return null
  return <Sheet key={mode} mode={mode} />
}

function Sheet({ mode }: { mode: AuthMode }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    if (mode === 'signup' && name.trim().length < 2) return setError('Escribe tu nombre (al menos 2 letras).')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(name, email, password)
      else if (mode === 'signin') await signIn(email, password)
      else {
        await sendReset(email)
        setSent(true)
        return
      }
      closeAuth()
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={closeAuth}>
      <form className="auth__sheet card" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <button type="button" className="auth__close" onClick={closeAuth} aria-label="Cerrar">
          <Close size={22} />
        </button>
        <h2 id="auth-title">{TITLES[mode]}</h2>

        {mode === 'signup' && (
          <p className="muted">Guarda tu racha y tu XP en la nube para no perderlos y seguir en cualquier dispositivo.</p>
        )}
        {mode === 'reset' && !sent && <p className="muted">Te enviaremos un correo con un enlace para crear una nueva.</p>}

        {sent ? (
          <>
            <p className="auth__ok" role="status">
              ¡Listo! Si <b>{email.trim()}</b> tiene cuenta en {APP_NAME}, te llegará el correo en unos minutos. Revisa también spam.
            </p>
            <button type="button" className="btn btn--primary btn--block" onClick={() => setMode('signin')}>
              Volver a entrar
            </button>
          </>
        ) : (
          <>
            {mode === 'signup' && (
              <label className="field">
                <span>Tu nombre</span>
                <input ref={first} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" />
              </label>
            )}
            <label className="field">
              <span>Correo</span>
              <input
                ref={mode === 'signup' ? undefined : first}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {mode !== 'reset' && (
              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === 'signup' && <small className="muted">Mínimo 6 caracteres.</small>}
              </label>
            )}

            {error && <p className="auth__error" role="alert">{error}</p>}

            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Un momento…' : mode === 'signup' ? 'Crear cuenta' : mode === 'signin' ? 'Entrar' : 'Enviar correo'}
            </button>

            {mode === 'signup' && (
              <p className="auth__fine">
                Guardamos tu nombre, correo y progreso (XP, racha y retos) para sincronizarlo, y datos anónimos de uso
                para mejorar {APP_NAME}. Puedes borrar tu cuenta cuando quieras desde Perfil.
              </p>
            )}

            <div className="auth__links">
              {mode === 'signup' && (
                <button type="button" onClick={() => setMode('signin')}>Ya tengo cuenta</button>
              )}
              {mode === 'signin' && (
                <>
                  <button type="button" onClick={() => setMode('reset')}>¿Olvidaste tu contraseña?</button>
                  <button type="button" onClick={() => setMode('signup')}>Crear cuenta nueva</button>
                </>
              )}
              {mode === 'reset' && <button type="button" onClick={() => setMode('signin')}>Volver</button>}
            </div>
          </>
        )}
      </form>

      <style>{`
        .auth {
          position: fixed; inset: 0; z-index: 60;
          display: grid; align-items: end; justify-items: center;
          background: rgb(15 23 42 / .45);
          padding: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom));
          overflow-y: auto;
        }
        @media (min-width: 640px) { .auth { align-items: center; } }
        .auth__sheet { position: relative; width: 100%; max-width: 420px; display: grid; gap: 12px; animation: auth-in .2s ease-out; }
        @keyframes auth-in { from { transform: translateY(16px); opacity: 0; } }
        .auth__sheet h2 { margin: 0; padding-right: 40px; font-size: 24px; font-weight: 900; }
        .auth__sheet p { margin: 0; }
        .auth__close { position: absolute; top: 12px; right: 12px; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: var(--ink-2); }
        .field { display: grid; gap: 4px; }
        .field span { font-weight: 800; font-size: 14px; }
        .field input {
          font: inherit; font-size: 16px; /* 16px: Safari no hace zoom */
          min-height: 48px; padding: 0 14px; border-radius: var(--radius-sm);
          border: 2px solid var(--line); background: #fff; color: var(--ink); width: 100%;
        }
        .field input:focus { outline: none; border-color: var(--blue); }
        .auth__error { color: #C2410C; font-weight: 800; }
        .auth__ok { background: #F0FDF4; border: 2px solid #86EFAC; border-radius: var(--radius-sm); padding: 12px; }
        .auth__fine { font-size: 12px; color: var(--ink-3); line-height: 1.45; }
        .auth__links { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .auth__links button { color: var(--blue); font-weight: 800; font-size: 14px; padding: 6px 2px; }
      `}</style>
    </div>
  )
}
