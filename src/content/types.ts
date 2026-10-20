import type { LanguageId } from '../engine/types'

interface Base {
  id: string
  title: string
  xp: number
  /** Explicación corta del concepto. Admite `código` en línea y bloques ```. */
  concept: string
}

/** Escribir código desde cero y ejecutarlo. */
export interface CodeExercise extends Base {
  kind: 'code'
  prompt: string
  starter: string
  solution: string
  hint: string
  /** Salida exacta esperada (se ignoran espacios al final de cada línea). */
  expectedOutput?: string
  /**
   * Prueba en Python que corre después del código del usuario. Tiene acceso a sus variables,
   * a `__output__` (lo que imprimió), `__source__` (su código) y `run_with(src)`.
   * Un `assert cond, "mensaje"` fallido se muestra como pista amable.
   */
  test?: string
  stdin?: string
}

/** Tabla de datos de ejemplo que se muestra junto al ejercicio (SQL, Power BI). */
export interface DataTable {
  name: string
  columns: string[]
  rows: (string | number | null)[][]
}

/** Leer código y predecir qué imprime (estilo Consoly): entrena la lectura de código. */
export interface PredictExercise extends Base {
  kind: 'predict'
  code: string
  options: string[]
  answer: number
  explain: string
  /** Pregunta en la burbuja de Loppy. Por defecto: "¿Qué imprime este código?" */
  question?: string
  tables?: DataTable[]
}

/**
 * Escribir la respuesta: completar cada `___` del código o, si no hay huecos, escribir el resultado.
 * Para lenguajes que no se ejecutan en el navegador (T-SQL, DAX, M).
 */
export interface FillExercise extends Base {
  kind: 'fill'
  prompt: string
  code: string
  /** Respuestas aceptadas por hueco, en orden (o una sola lista si no hay huecos). */
  answers: string[][]
  hint: string
  explain: string
  /** Distinguir mayúsculas (M es sensible a mayúsculas; SQL y DAX no). */
  caseSensitive?: boolean
  tables?: DataTable[]
}

export type Exercise = CodeExercise | PredictExercise | FillExercise

export interface Unit {
  id: string
  title: string
  description: string
  /** Nivel de dominio al que pertenece (1 = Primera Vuelta … 6 = Loop Infinito). */
  level: number
  exercises: Exercise[]
}

export interface Course {
  id: string
  /** Motor que ejecuta el código, si el curso tiene ejercicios de escribir y ejecutar. */
  language?: LanguageId
  name: string
  available: boolean
  units: Unit[]
}
