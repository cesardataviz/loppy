import { useCallback, useEffect, useState } from 'react'
import { getPythonRunner } from './pythonRunner'
import type { RunRequest, RunResult } from './types'

let booted = false

export function usePython() {
  const [booting, setBooting] = useState(!booted)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (booted) return
    let alive = true
    getPythonRunner()
      .ready()
      .then(() => {
        booted = true
        if (alive) setBooting(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const run = useCallback(async (req: RunRequest): Promise<RunResult> => {
    setRunning(true)
    try {
      return await getPythonRunner().run(req)
    } finally {
      booted = true
      setBooting(false)
      setRunning(false)
    }
  }, [])

  return { booting, running, run }
}
