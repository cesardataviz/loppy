// Niveles de dominio. Del básico al más alto, con nombres en clave de "loop".
export interface Level {
  n: number
  name: string
  tier: string
  minXp: number
  blurb: string
}

export const LEVELS: Level[] = [
  { n: 1, name: 'Primera Vuelta', tier: 'Básico', minXp: 0, blurb: 'Tus primeras líneas. Todo empieza con un print.' },
  { n: 2, name: 'Bucle Curioso', tier: 'Principiante', minXp: 120, blurb: 'Ya guardas datos y tomas decisiones.' },
  { n: 3, name: 'Iterador', tier: 'Intermedio', minXp: 350, blurb: 'Los bucles y las listas ya no te asustan.' },
  { n: 4, name: 'Recursivo', tier: 'Avanzado', minXp: 800, blurb: 'Funciones que llaman funciones. Piensas en bloques.' },
  { n: 5, name: 'Maestro del Loop', tier: 'Maestro', minXp: 1600, blurb: 'Resuelves problemas reales con soltura.' },
  { n: 6, name: 'Loop Infinito ∞', tier: 'Leyenda', minXp: 3000, blurb: 'Nunca dejas de iterar. El código fluye.' },
]

export function levelFor(xp: number) {
  let idx = 0
  LEVELS.forEach((l, i) => {
    if (xp >= l.minXp) idx = i
  })
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1
  return { current, next, progress }
}
