// Compara respuestas escritas sin castigar detalles que no importan: espacios, `;` final,
// comillas tipográficas del teclado del iPhone y (salvo en M) mayúsculas y tildes.
export function normalizeAnswer(s: string, caseSensitive = false): string {
  let t = s
    .normalize('NFC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .replace(/;+$/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([()[\]{},=<>+\-*/&|])\s*/g, '$1')
    .trim()
  if (!caseSensitive) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return t
}

export function matchesAnswer(given: string, accepted: string[], caseSensitive = false): boolean {
  const g = normalizeAnswer(given, caseSensitive)
  return g !== '' && accepted.some((a) => normalizeAnswer(a, caseSensitive) === g)
}

/** Número de huecos `___` del código. Sin huecos, el ejercicio pide escribir el resultado. */
export function countBlanks(code: string): number {
  return code.split('___').length - 1
}
