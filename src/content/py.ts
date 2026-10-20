/**
 * Plantilla para escribir código Python dentro del contenido:
 * respeta las barras invertidas tal cual (como String.raw) y quita la sangría común,
 * así el código se puede indentar junto al resto del objeto.
 */
export function py(strings: TemplateStringsArray, ...values: unknown[]): string {
  const text = String.raw({ raw: strings.raw }, ...values)
  const lines = text.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)![0].length))
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join('\n')
}
