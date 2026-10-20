import { firebaseConfig } from './config'

// Firebase se descarga aparte y solo cuando hace falta: la app abre igual de rápido
// y Python no se entera de nada de esto.

type Services = {
  auth: import('firebase/auth').Auth
  db: import('firebase/firestore').Firestore
  authMod: typeof import('firebase/auth')
  fsMod: typeof import('firebase/firestore')
  app: import('firebase/app').FirebaseApp
}

export const cloudEnabled = firebaseConfig !== null

let services: Promise<Services> | null = null

export function loadFirebase(): Promise<Services> {
  const config = firebaseConfig
  if (!config) return Promise.reject(new Error('Loppy no tiene configurada la nube.'))
  services ??= (async () => {
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])
    const app = initializeApp(config)
    // Solo correo y contraseña: sin popups de Google, así no se descarga ese código.
    const auth = authMod.initializeAuth(app, {
      persistence: [authMod.indexedDBLocalPersistence, authMod.browserLocalPersistence],
    })
    auth.languageCode = 'es'
    const db = fsMod.initializeFirestore(app, {})
    return { app, auth, db, authMod, fsMod }
  })()
  services.catch(() => {
    services = null // si falló la descarga (sin internet), se reintenta la próxima vez
  })
  return services
}

// --- Estadísticas (Google Analytics): visitas, días, países, dispositivos ---

let analytics: Promise<import('firebase/analytics').Analytics | null> | null = null

export function startAnalytics() {
  if (!firebaseConfig?.measurementId || import.meta.env.DEV || analytics) return
  analytics = loadFirebase()
    .then(async ({ app }) => {
      const mod = await import('firebase/analytics')
      return (await mod.isSupported()) ? mod.getAnalytics(app) : null
    })
    .catch(() => null)
}

/** Registra qué pantalla se abrió (Aprender, Libre, Perfil, Sesión). */
export function trackScreen(name: string) {
  analytics?.then(async (a) => {
    if (!a) return
    const { logEvent } = await import('firebase/analytics')
    logEvent(a, 'screen_view', { firebase_screen: name, firebase_screen_class: name })
  })
}
