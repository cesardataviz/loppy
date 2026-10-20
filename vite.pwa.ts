import { createReadStream, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

// Python (Pyodide) se sirve desde la propia app, no desde un CDN:
// así el service worker puede guardarlo y Loppy funciona sin internet.
const PYODIDE_DIR = fileURLToPath(new URL('./node_modules/pyodide/', import.meta.url))
const PYODIDE_VERSION: string = JSON.parse(readFileSync(PYODIDE_DIR + 'package.json', 'utf8')).version
const PYODIDE_FILES = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
export const PYODIDE_BASE = `/pyodide/${PYODIDE_VERSION}/`

const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url))
const SW_TEMPLATE = fileURLToPath(new URL('./src/pwa/sw-template.js', import.meta.url))

const MIME: Record<string, string> = {
  mjs: 'text/javascript',
  js: 'text/javascript',
  wasm: 'application/wasm',
  zip: 'application/zip',
  json: 'application/json',
}

function publicFiles(dir = PUBLIC_DIR, prefix = '/'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? publicFiles(`${dir}${d.name}/`, `${prefix}${d.name}/`) : [`${prefix}${d.name}`],
  )
}

export function pwa(): Plugin {
  return {
    name: 'loppy-pwa',
    enforce: 'post',

    config() {
      return { define: { __PYODIDE_BASE__: JSON.stringify(PYODIDE_BASE) } }
    },

    // En desarrollo, sirve Pyodide directo desde node_modules.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (!path.startsWith(PYODIDE_BASE)) return next()
        const name = path.slice(PYODIDE_BASE.length)
        if (!PYODIDE_FILES.includes(name)) return next()
        res.setHeader('Content-Type', MIME[name.split('.').pop()!] ?? 'application/octet-stream')
        createReadStream(PYODIDE_DIR + name).pipe(res)
      })
    },

    // En el build: copia Pyodide y genera sw.js con la lista exacta de archivos a guardar.
    generateBundle(_, bundle) {
      for (const name of PYODIDE_FILES) {
        this.emitFile({ type: 'asset', fileName: `${PYODIDE_BASE.slice(1)}${name}`, source: readFileSync(PYODIDE_DIR + name) })
      }
      const files = [
        '/',
        ...Object.keys(bundle).filter((f) => f !== 'index.html' && !f.endsWith('.map')).map((f) => `/${f}`),
        ...PYODIDE_FILES.map((f) => PYODIDE_BASE + f),
        ...publicFiles(),
      ]
      const precache = [...new Set(files)].sort()
      const template = readFileSync(SW_TEMPLATE, 'utf8')
      const version = createHash('sha256').update(precache.join('\n') + template).digest('hex').slice(0, 10)
      const source = template
        .replace("const CACHE = '__CACHE__'", `const CACHE = 'loppy-${version}'`)
        .replace('const PRECACHE = __PRECACHE__', `const PRECACHE = ${JSON.stringify(precache, null, 2)}`)
      if (source.includes('__CACHE__') || source.includes('__PRECACHE__')) this.error('sw-template.js: no se pudo completar')
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}
