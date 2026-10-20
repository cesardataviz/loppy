// Registra el service worker (solo en producción) y avisa cuando hay una versión nueva lista.
type Listener = (ready: boolean) => void

let waiting: ServiceWorker | null = null
const listeners = new Set<Listener>()

function setWaiting(sw: ServiceWorker | null) {
  waiting = sw
  listeners.forEach((l) => l(!!sw))
}

export function onUpdateReady(l: Listener) {
  listeners.add(l)
  l(!!waiting)
  return () => {
    listeners.delete(l)
  }
}

/** Activa la versión nueva y recarga. Se llama cuando la persona toca "Actualizar". */
export function applyUpdate() {
  if (!waiting) return
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true })
  waiting.postMessage('SKIP_WAITING')
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      // Una versión nueva puede estar esperando, instalándose ya (el navegador revisa al abrir la app)
      // o aparecer más tarde: hay que cubrir los tres casos.
      const track = (sw: ServiceWorker | null) => {
        if (!sw) return
        const check = () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(sw)
        }
        check()
        sw.addEventListener('statechange', check)
      }
      track(reg.waiting)
      track(reg.installing)
      reg.addEventListener('updatefound', () => track(reg.installing))
      reg.update().catch(() => {})
      // En iPhone la app instalada casi nunca se "cierra": revisa versiones al volver a ella.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      })
      // Pide almacenamiento persistente para que el sistema no borre el progreso.
      navigator.storage?.persist?.().catch(() => {})
    } catch {
      /* sin service worker la app sigue funcionando en línea */
    }
  })
}
