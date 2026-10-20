import { useState } from 'react'
import { CodeEditor } from '../components/CodeEditor'
import { Console } from '../components/Console'
import { Loppy, type LoppyMood } from '../components/Loppy'
import { Play } from '../components/Icons'
import { usePython } from '../engine/usePython'
import { friendlyError } from '../engine/friendlyErrors'
import type { RunResult } from '../engine/types'
import { useProgress } from '../progress/store'

const KEY = 'loppy.playground'
const DEFAULT = `# Modo Libre: experimenta sin reglas.
# Si usas input(), escribe las respuestas en "Entrada".

nombre = input("¿Cómo te llamas? ")
for vuelta in range(1, 4):
    print(f"Vuelta {vuelta}: ¡vamos, {nombre}!")
`

function load(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function Playground() {
  const [code, setCode] = useState(() => load(KEY, DEFAULT))
  const [stdin, setStdin] = useState(() => load(`${KEY}.stdin`, 'Loppy'))
  const [result, setResult] = useState<RunResult | null>(null)
  const [mood, setMood] = useState<LoppyMood>('idle')
  const { booting, running, run } = usePython()
  const p = useProgress()

  function save(k: string, v: string) {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* sin persistencia */
    }
  }

  async function execute() {
    if (running) return
    setMood('thinking')
    const res = await run({ code, stdin })
    setResult(res)
    setMood(res.error ? 'error' : 'success')
  }

  const fe = result?.error ? friendlyError(result.error) : null

  return (
    <div className="page playground">
      <header className="pg__head">
        <Loppy mood={mood} streak={p.streak} size={80} />
        <div>
          <p className="eyebrow">Modo Libre · Python</p>
          <h1>Tu laboratorio</h1>
        </div>
        <button className="btn btn--primary" onClick={execute} disabled={running}>
          <Play size={18} /> {running ? 'Ejecutando…' : 'Ejecutar'}
        </button>
      </header>
      <CodeEditor
        value={code}
        onChange={(v) => {
          setCode(v)
          save(KEY, v)
        }}
        onRun={execute}
        minHeight={280}
      />
      <label className="pg__stdin">
        <span>Entrada (una respuesta por línea para cada input())</span>
        <textarea
          rows={2}
          value={stdin}
          onChange={(e) => {
            setStdin(e.target.value)
            save(`${KEY}.stdin`, e.target.value)
          }}
        />
      </label>
      <Console result={result} running={running} booting={booting && !running} />
      {fe && (
        <div className="hint">
          <span><b>{fe.title}.</b> {fe.tip}</span>
        </div>
      )}
      <style>{`
        .playground { display: grid; gap: 14px; }
        .pg__head { display: flex; align-items: center; gap: 12px; }
        .pg__head > div { flex: 1; }
        .pg__head h1 { margin: 0; font-size: 24px; font-weight: 900; }
        .pg__stdin { display: grid; gap: 6px; font-size: 13px; font-weight: 800; color: var(--ink-2); }
        .pg__stdin textarea { font: 16px var(--mono); padding: 10px 12px; border-radius: var(--radius-sm); border: 2px solid var(--line); resize: vertical; background: var(--card); color: var(--ink); }
        .pg__stdin textarea:focus { outline: none; border-color: var(--violet); }
        @media (max-width: 520px) { .pg__head .btn { padding: 0 14px; } }
      `}</style>
    </div>
  )
}
