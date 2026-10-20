/// <reference lib="webworker" />
// Ejecuta Python con Pyodide (CPython compilado a WebAssembly) fuera del hilo principal.

// Ruta definida por vite.pwa.ts: Pyodide viaja con la app para funcionar sin internet.
declare const __PYODIDE_BASE__: string
const PYODIDE_BASE = new URL(__PYODIDE_BASE__, self.location.origin).href

const HARNESS = `
import sys, io, json, traceback

def run_with(src, stdin_text=""):
    """Re-ejecuta el código del usuario (p. ej. con otros valores) y devuelve lo que imprime."""
    buf = io.StringIO()
    old = sys.stdout, sys.stdin
    sys.stdout = buf
    sys.stdin = io.StringIO(stdin_text)
    try:
        exec(compile(src, "main.py", "exec"), {"__name__": "__main__"})
    finally:
        sys.stdout, sys.stdin = old
    return buf.getvalue().strip()

def __loppy_run(src, test_src, stdin_text):
    out = io.StringIO()
    sys.stdout = out
    sys.stderr = out
    sys.stdin = io.StringIO(stdin_text)
    g = {"__name__": "__main__"}
    res = {"error": None, "test_error": None}
    try:
        exec(compile(src, "main.py", "exec"), g)
    except SyntaxError as e:
        res["error"] = {"type": type(e).__name__, "message": e.msg, "line": e.lineno}
    except BaseException as e:
        line = None
        for frame in traceback.extract_tb(e.__traceback__):
            if frame.filename == "main.py":
                line = frame.lineno
        res["error"] = {"type": type(e).__name__, "message": str(e), "line": line}
    finally:
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
    res["stdout"] = out.getvalue()
    if res["error"] is None and test_src:
        scope = dict(g)
        scope["__output__"] = res["stdout"]
        scope["__source__"] = src
        scope["run_with"] = run_with
        sys.stdout = io.StringIO()
        try:
            exec(compile(test_src, "test.py", "exec"), scope)
        except AssertionError as e:
            res["test_error"] = str(e) or "El resultado todavía no es el esperado."
        except BaseException as e:
            res["test_error"] = f"{type(e).__name__}: {e}"
        finally:
            sys.stdout = sys.__stdout__
    return json.dumps(res)
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = await import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`)
      const py = await mod.loadPyodide({ indexURL: PYODIDE_BASE })
      py.runPython(HARNESS)
      return py
    })()
  }
  return pyodidePromise
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, kind, code, stdin, testCode } = ev.data
  try {
    const py = await getPyodide()
    if (kind === 'warmup') {
      self.postMessage({ id, ok: true })
      return
    }
    const fn = py.globals.get('__loppy_run')
    const raw: string = fn(code, testCode ?? '', stdin ?? '')
    fn.destroy()
    const res = JSON.parse(raw)
    self.postMessage({ id, ok: true, stdout: res.stdout, error: res.error, testError: res.test_error })
  } catch (e) {
    self.postMessage({ id, ok: false, fatal: String(e) })
  }
}
