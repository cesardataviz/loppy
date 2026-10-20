import type { CodeRunner, RunRequest, RunResult } from './types'

const TIMEOUT_MS = 6000

interface Pending {
  resolve: (v: any) => void
  timer?: ReturnType<typeof setTimeout>
}

// Si el código se cuelga (p. ej. un while infinito), se termina el worker y se crea otro.
class PythonRunner implements CodeRunner {
  language = 'python' as const
  private worker!: Worker
  private seq = 0
  private pending = new Map<number, Pending>()
  private warm: Promise<void> | null = null

  constructor() {
    this.spawn()
  }

  private spawn() {
    this.worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (ev) => {
      const p = this.pending.get(ev.data.id)
      if (!p) return
      clearTimeout(p.timer)
      this.pending.delete(ev.data.id)
      p.resolve(ev.data)
    }
    this.warm = null
  }

  private send(msg: object, timeout?: number): Promise<any> {
    const id = ++this.seq
    return new Promise((resolve) => {
      const p: Pending = { resolve }
      if (timeout) {
        p.timer = setTimeout(() => {
          this.pending.delete(id)
          this.worker.terminate()
          this.spawn()
          resolve({ id, ok: true, stdout: '', testError: null, error: { type: 'Timeout', message: 'El código tardó demasiado', line: null } })
        }, timeout)
      }
      this.pending.set(id, p)
      this.worker.postMessage({ id, ...msg })
    })
  }

  ready(): Promise<void> {
    if (!this.warm) this.warm = this.send({ kind: 'warmup' }).then(() => undefined)
    return this.warm
  }

  async run(req: RunRequest): Promise<RunResult> {
    await this.ready()
    const start = performance.now()
    const res = await this.send({ kind: 'run', ...req }, TIMEOUT_MS)
    const durationMs = Math.round(performance.now() - start)
    if (!res.ok) {
      return { stdout: '', error: { type: 'Internal', message: res.fatal, line: null }, testError: null, durationMs }
    }
    return { stdout: res.stdout, error: res.error, testError: res.testError, durationMs }
  }
}

let instance: PythonRunner | null = null
export function getPythonRunner(): CodeRunner {
  if (!instance) instance = new PythonRunner()
  return instance
}
