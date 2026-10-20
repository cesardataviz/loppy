// Verifica todos los retos: cada solución pasa sus pruebas, ningún código inicial pasa solo
// y cada "predice la salida" tiene la respuesta correcta. Uso: npm run check:content
// Python se ejecuta de verdad; SQL Server y Power BI (sin motor) se revisan por estructura.
import { createServer } from 'vite'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { courses } = await server.ssrLoadModule('/src/content/index.ts')
const { countBlanks, normalizeAnswer } = await server.ssrLoadModule('/src/content/answers.ts')
await server.close()

const all = courses.flatMap((c) => c.units.flatMap((u) => u.exercises.map((e) => ({ course: c.id, e }))))
const problems = []
const seen = new Set()
for (const { e } of all) {
  if (seen.has(e.id)) problems.push(`id repetido: ${e.id}`)
  seen.add(e.id)
}

for (const c of courses.filter((c) => c.id !== 'python' && c.units.length)) {
  const list = c.units.flatMap((u) => u.exercises)
  for (const e of list) {
    if (e.kind === 'code') problems.push(`${e.id}: los retos de código solo existen en Python`)
    if (e.kind === 'predict') {
      if (!(e.answer >= 0 && e.answer < e.options.length)) problems.push(`${e.id}: la respuesta marcada no existe`)
      if (new Set(e.options).size !== e.options.length) problems.push(`${e.id}: opciones repetidas`)
    }
    if (e.kind === 'fill') {
      const blanks = countBlanks(e.code)
      if (e.answers.length !== Math.max(1, blanks)) problems.push(`${e.id}: ${blanks} huecos pero ${e.answers.length} respuestas`)
      if (e.answers.some((a) => !a.length || a.some((x) => !normalizeAnswer(x, e.caseSensitive))))
        problems.push(`${e.id}: hay un hueco sin respuesta aceptada`)
    }
  }
  const fill = list.filter((e) => e.kind === 'fill').length
  console.log(`${c.name}: ${list.length} retos (${fill} de escribir, ${list.length - fill} de marcar), XP total ${list.reduce((s, e) => s + e.xp, 0)}`)
}
for (const p of problems) console.log('  ✗', p)
if (problems.length) process.exit(1)

const exercises = all.filter((x) => x.course === 'python').map((x) => x.e)
const work = mkdtempSync(join(tmpdir(), 'loppy-check-'))
const file = join(work, 'exercises.json')
writeFileSync(file, JSON.stringify(exercises))

const python = process.platform === 'win32' ? 'python' : 'python3'
const r = spawnSync(python, ['-I', join(root, 'scripts', 'verify_content.py'), file], { cwd: work, stdio: 'inherit' })
process.exit(r.status ?? 1)
