import type { RunResult } from '../engine/types'

interface Props {
  result: RunResult | null
  running: boolean
  booting?: boolean
}

export function Console({ result, running, booting }: Props) {
  let body
  if (booting) body = <span className="placeholder">Preparando Python… (solo la primera vez)</span>
  else if (running) body = <span className="placeholder">Ejecutando…</span>
  else if (!result) body = <span className="placeholder">Aquí verás lo que imprime tu código.</span>
  else
    body = (
      <>
        {result.stdout}
        {result.error && (
          <span className="err">
            {result.stdout && !result.stdout.endsWith('\n') ? '\n' : ''}
            {result.error.type}
            {result.error.line ? ` · línea ${result.error.line}` : ''}: {result.error.message}
          </span>
        )}
        {!result.stdout && !result.error && <span className="placeholder">(tu código no imprimió nada)</span>}
      </>
    )

  return (
    <div className="console" aria-live="polite">
      <div className="console__head">
        <i className={`dot ${running || booting ? 'is-live' : ''}`} />
        Consola
        <span>{result && !running ? `${result.durationMs} ms` : ''}</span>
      </div>
      <pre>{body}</pre>
    </div>
  )
}
