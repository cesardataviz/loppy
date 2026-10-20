// Contrato común para todos los lenguajes. Python corre en el navegador (Pyodide);
// JavaScript, C++, Java y R implementarán este mismo contrato más adelante.
export type LanguageId = 'python' | 'javascript' | 'cpp' | 'java' | 'r'

export interface RunRequest {
  code: string
  stdin?: string
  /** Código de prueba que corre tras el del usuario. Tiene acceso a sus variables y a `__output__`. */
  testCode?: string
}

export interface CodeError {
  type: string
  message: string
  line: number | null
}

export interface RunResult {
  stdout: string
  error: CodeError | null
  /** Mensaje cuando el código corre pero no cumple el reto. */
  testError: string | null
  durationMs: number
}

export interface CodeRunner {
  language: LanguageId
  ready(): Promise<void>
  run(req: RunRequest): Promise<RunResult>
}
