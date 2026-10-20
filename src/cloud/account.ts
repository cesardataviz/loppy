import type { User } from 'firebase/auth'
import { progress } from '../progress/store'
import { cloudEnabled, loadFirebase, startAnalytics } from './firebase'
import { getCloud, hadSession, setCloud, type Account } from './state'
import { deleteCloudData, flushSync, startSync, stopSync, unlinkLocal } from './sync'

// Nombre elegido al crear la cuenta: Firebase avisa de la sesión antes de guardarlo en el perfil.
let pendingName: string | null = null
let creating = false

function toAccount(u: User): Account {
  return {
    uid: u.uid,
    email: u.email ?? '',
    name: pendingName ?? u.displayName ?? (u.email ?? '').split('@')[0],
  }
}

/** Se llama una vez al abrir la app. Sin sesión guardada, Firebase espera a que la app termine de cargar. */
export function initCloud() {
  if (!cloudEnabled) return
  const boot = () => {
    startAnalytics()
    loadFirebase()
      .then(({ auth, authMod }) => {
        authMod.onAuthStateChanged(auth, (user) => {
          if (creating) return // signUp / signIn se encargan
          if (user) {
            const account = toAccount(user)
            setCloud({ status: 'signedIn', account })
            void startSync(account)
          } else {
            stopSync()
            setCloud({ status: 'signedOut', account: null })
          }
        })
      })
      .catch(() => {
        // Sin internet al abrir: si había sesión se mantiene (los datos siguen en el teléfono).
        setCloud(hadSession ? { sync: 'offline' } : { status: 'signedOut' })
        window.addEventListener('online', boot, { once: true })
      })
  }
  if (hadSession) boot()
  else if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 3000 })
  else setTimeout(boot, 1500)
}

export async function signUp(name: string, email: string, password: string) {
  const { auth, authMod } = await loadFirebase()
  creating = true
  pendingName = name.trim()
  try {
    const cred = await authMod.createUserWithEmailAndPassword(auth, email.trim(), password)
    await authMod.updateProfile(cred.user, { displayName: pendingName }).catch(() => {})
    const account = toAccount(cred.user)
    setCloud({ status: 'signedIn', account })
    await startSync(account, true)
  } finally {
    creating = false
    pendingName = null
  }
}

export async function signIn(email: string, password: string) {
  const { auth, authMod } = await loadFirebase()
  creating = true
  try {
    const cred = await authMod.signInWithEmailAndPassword(auth, email.trim(), password)
    const account = toAccount(cred.user)
    setCloud({ status: 'signedIn', account })
    await startSync(account) // combina el progreso de este teléfono con el de la cuenta
  } finally {
    creating = false
  }
}

export async function sendReset(email: string) {
  const { auth, authMod } = await loadFirebase()
  await authMod.sendPasswordResetEmail(auth, email.trim())
}

export async function signOutAccount() {
  const { auth, authMod } = await loadFirebase()
  await flushSync()
  stopSync()
  await authMod.signOut(auth)
  progress.clearLocal()
  unlinkLocal()
  setCloud({ status: 'signedOut', account: null })
}

/** Borra la cuenta y sus datos en la nube. El progreso del teléfono se queda. Pide la contraseña otra vez. */
export async function deleteAccount(password: string) {
  const { auth, authMod } = await loadFirebase()
  const user = auth.currentUser
  const account = getCloud().account
  if (!user || !account) throw Object.assign(new Error('Sin sesión'), { code: 'auth/no-current-user' })
  await authMod.reauthenticateWithCredential(user, authMod.EmailAuthProvider.credential(account.email, password))
  await deleteCloudData(user.uid)
  await authMod.deleteUser(user)
  unlinkLocal()
  setCloud({ status: 'signedOut', account: null })
}

/** Mensajes amables para los errores de Firebase. */
export function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene una cuenta. Prueba con "Ya tengo cuenta".'
    case 'auth/invalid-email':
      return 'Revisa el correo: parece que le falta algo.'
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Usa una contraseña de al menos 6 caracteres.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'El correo o la contraseña no coinciden. Inténtalo otra vez.'
    case 'auth/too-many-requests':
      return 'Muchos intentos seguidos. Espera unos minutos y vuelve a probar.'
    case 'auth/network-request-failed':
      return 'No hay conexión. Revisa tu internet y vuelve a intentar.'
    case 'auth/missing-password':
      return 'Escribe tu contraseña.'
    default:
      return 'Algo no salió como esperábamos. Vuelve a intentar en un momento.'
  }
}
