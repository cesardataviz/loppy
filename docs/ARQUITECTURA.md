# Loppy — Arquitectura y plan de construcción

> «Aprende a programar, vuelta a vuelta.»

## 1. Qué es Loppy

App para **practicar programación muy seguido y en sesiones cortas**: escribes código desde cero, lo ejecutas,
ves el resultado y mantienes una racha. Toma lo mejor de dos referencias:

| Referencia | Qué tomamos |
|---|---|
| **Consoly** | Leer código y *predecir la salida* (ejercicios `predict`), rangos de maestría, reto diario, rachas. |
| **Buggy** (según tu descripción) | Escribir código desde cero, ejecutarlo y ver el resultado al instante. |
| **Duolingo** (patrón) | Camino de unidades, meta diaria de XP, sesiones de 5 min, feedback inmediato. |

**Decisión de UX clave:** sin "vidas" ni castigos. Equivocarse es gratis: es otra vuelta del loop.
Esto respeta el tono de marca y favorece practicar mucho.

## 2. Bucle principal (core loop)

```
Abrir app → ver racha y meta del día → "Continuar" → sesión de 3–6 retos
   → escribir/ejecutar → feedback de Loppy (acierto / "¡casi!") → XP
   → resumen (XP + racha) → vuelve mañana
```

Tipos de ejercicio:
- **code** — escribir desde cero. Se valida por salida exacta y/o pruebas en Python (`assert`), que pueden
  re-ejecutar el código del usuario con otros valores (valida la *lógica*, no solo el texto impreso).
- **predict** — leer código y elegir qué imprime (entrena la lectura de código).
- **fill** — escribir la respuesta: completar los huecos `___` del código o, si no hay huecos, escribir el
  resultado. Se compara sin importar espacios, `;` final, comillas del iPhone ni (salvo en M) mayúsculas y tildes
  (`content/answers.ts`). Se usa en los cursos que no corren en el navegador.
- `predict` y `fill` pueden mostrar **tablas de datos** (`tables`) junto al ejercicio.
- *(próximo)* **fix** — arreglar un código con bug. **reto diario** compartido.

### Cursos (v0.5, 2026-10-18)

| Curso | Carpeta | Cómo se practica | Retos |
|---|---|---|---|
| Python | `content/python/` | Se ejecuta de verdad (Pyodide) + predecir | 88 |
| SQL Server (T-SQL) | `content/sqlserver/` | Marcar + escribir, sobre una mini tienda (Clientes, Productos, Pedidos) | 60 |
| Power BI (DAX y M) | `content/powerbi/` | Marcar + escribir, sobre una tabla Ventas y Metas | 49 |

T-SQL, DAX y M no tienen motor en el navegador: por eso no hay retos de "escribir y ejecutar" en esos cursos.
Cada curso usa tres niveles: Básico (nivel 1), Intermedio (3) y Avanzado (4). La pestaña de curso elegida se
guarda en `localStorage` (`loppy.course`). XP, racha y niveles son compartidos entre cursos.
`npm run check:content` ejecuta los retos de Python y revisa la estructura de los otros (huecos = respuestas,
respuesta marcada válida, ids únicos).

## 3. Niveles de dominio

| # | Nombre | Tier | XP |
|---|---|---|---|
| 1 | Primera Vuelta | Básico | 0 |
| 2 | Bucle Curioso | Principiante | 120 |
| 3 | Iterador | Intermedio | 350 |
| 4 | Recursivo | Avanzado | 800 |
| 5 | Maestro del Loop | Maestro | 1600 |
| 6 | **Loop Infinito ∞** | Leyenda | 3000 |

Racha → apariencia de Loppy: 1+ día bandana violeta · 3+ dorada · 7+ aura brillante · 30+ aura arcoíris.

## 4. Arquitectura técnica

### Fase actual (v0.1) — 100% en el navegador, sin servidor

```
┌──────────────────────────── Navegador ────────────────────────────┐
│  React + TypeScript (Vite)                                         │
│   ├─ screens/   Aprender · Sesión · Libre · Perfil                │
│   ├─ content/   cursos como datos (python.ts)                      │
│   ├─ progress/  XP, rachas, niveles → localStorage                 │
│   └─ engine/    CodeRunner ──postMessage──► Web Worker             │
│                                              └─ Pyodide (CPython   │
│                                                 en WebAssembly)    │
└────────────────────────────────────────────────────────────────────┘
```

- **Pyodide** ejecuta Python real en el navegador: costo de servidor $0, funciona offline tras la primera carga.
- **Web Worker** aísla la ejecución: un `while True` no congela la app; tras 6 s se reinicia el worker.
- **CodeMirror 6** como editor: ligero y bueno en móvil (Monaco no funciona bien en pantallas táctiles).
  Barra de símbolos `( ) : " [ ]` para teclados de teléfono. Autocompletado apagado a propósito: se aprende escribiendo.
- **Errores amables** (`engine/friendlyErrors.ts`): traduce `NameError`, `SyntaxError`, etc. al tono de Loppy,
  con el detalle técnico plegado.

### Fase 2 — Cuentas y nube ✅ (Firebase, 2026-10-07)

Se eligió **Firebase** (proyecto `loppy-af3d7`) en vez de Supabase. Si algún día se cambia, solo se reemplaza
`src/cloud/`: las pantallas y `progress/store.ts` no dependen de Firebase.

| Pieza | Elección |
|---|---|
| Cuentas | Firebase Authentication, correo + contraseña. Cuenta **opcional**. |
| Datos | Firestore (Standard), `southamerica-west1` (Santiago), plan Spark gratis. |
| Estadísticas | Google Analytics (solo en producción): visitas, países, dispositivos, pantallas. |
| Seguridad | `firestore.rules` (publicar con `npx firebase-tools deploy --only firestore:rules`). |

```
users/{uid}                 name, email, createdAt, lastSeenAt, epoch,
                            xp, level, solved, streak, bestStreak, lastActive,
                            todayDate, todayXp, dailyGoal, completed, attempts, history
users/{uid}/attempts/{id}   exerciseId, passed, day, at      -- dónde se atasca la gente (sin el código)
```

Cómo funciona (`src/cloud/`):
- `firebase.ts` — Firebase se descarga aparte y tarde (no frena el arranque ni a Python).
- `account.ts` — crear cuenta, entrar, recuperar contraseña, cerrar sesión, borrar cuenta.
- `sync.ts` — el teléfono guarda siempre su copia; la nube se actualiza ~2 s después. Cambios de otros
  dispositivos llegan en vivo y se **combinan** (`mergeProgress`): lo hecho sin cuenta se *suma*; dos copias
  del mismo progreso toman el *mayor*. `epoch` sube al reiniciar o restaurar una copia y manda sobre lo demás
  (las reglas no dejan que baje). Los intentos van en cola en localStorage si no hay internet.
- Cerrar sesión limpia el teléfono (el progreso queda en la cuenta). Borrar cuenta borra la nube, no el teléfono.
- `config.ts` en `null` apaga todo y Loppy vuelve a ser solo local.

### Ranking ✅ (v0.6, 2026-10-21)

Pestaña **Ranking** con dos tablas: **Semanal** (se reinicia los lunes a las 00:00, hora UTC-5) e **Histórico**
(todo el XP). Podio 🏆🥈🥉 y lista desde el 4. Cualquiera lo ve; para aparecer hay que tener cuenta.

```
ranking/{uid}   name, country, hidden, xp, week, weekXp, day, dayXp, updatedAt   -- público, sin correo
```

- `src/cloud/ranking.ts` publica el lugar de cada persona (unos segundos después de ganar XP) y lee el top 50.
  "Tu puesto #N" sale con una consulta de conteo (1 lectura).
- **Anti-trampas** (`firestore.rules`): el XP del ranking sube como máximo **2000 por día** (`dayXp`), y al crearse
  no puede pasar de 2000 × días de antigüedad de la cuenta. Si alguien gana más (o junta progreso de antes de tener
  cuenta), el ranking lo alcanza en los días siguientes. Solo se borra junto con la cuenta.
- País: se adivina por la zona horaria (`src/ranking/countries.ts`) y se cambia en Perfil → Ranking, donde
  también se puede elegir no aparecer (`hidden`). Las banderas usan la fuente Twemoji solo donde el sistema no
  las trae (Windows), incluida en la app.
- Índices: `firestore.indexes.json` (publicar con `npx firebase-tools deploy --only firestore:rules,firestore:indexes`).

**Próximos pasos (acordados el 2026-10-07):**
1. **Panel de usuarios** propio: activos hoy, registros por día, reto donde más se atasca la gente (`attempts`).
2. **Notificaciones de racha** con Firebase Cloud Messaging (FCM): "¡Tu racha está en peligro!".

### Fase 3 — Más lenguajes

Todos implementan la misma interfaz `CodeRunner` (`engine/types.ts`):

| Lenguaje | Cómo se ejecuta | Dónde |
|---|---|---|
| Python | Pyodide (WASM) | Navegador ✅ |
| JavaScript | Worker nativo del navegador | Navegador |
| R | **webR** (WASM) | Navegador |
| C++ / Java | **Judge0** o **Piston** (sandbox en servidor), vía Edge Function de Supabase | Servidor |

Mantener todo lo posible en el navegador = más rápido, gratis y offline.

### Fase 4 — App móvil

**Capacitor** envuelve esta misma app web como app nativa para iOS y Android: se reutiliza ~100% del código.
Agrega notificaciones locales, haptics (vibración al acertar) y widget de racha.
Alternativa si algún día se necesita rendimiento nativo extremo: React Native/Expo (implica reescribir la UI).

## 5. Estructura del proyecto

```
E:\Loppy
├─ public/icon.svg            icono de la app (degradado violeta→azul, cara-infinito)
├─ src/
│  ├─ brand.ts                nombre, eslogan, frases de ánimo
│  ├─ cloud/                  Firebase: cuentas, sincronización, estadísticas
│  ├─ components/             Loppy (mascota animada), CodeEditor, Console, AuthSheet, AccountCard…
│  ├─ content/                tipos + cursos. python/ = basics, intermediate, advanced, master, legend
│  ├─ engine/                 runner de Python (worker + Pyodide), errores amables
│  ├─ progress/               store de progreso, niveles
│  └─ screens/                Learn, Session, Playground, Profile
├─ scripts/                  check-content: verifica que todos los retos funcionen
└─ docs/ARQUITECTURA.md
```

## 6. Cómo agregar un ejercicio

En el archivo del nivel que corresponda (`src/content/python/*.ts`), dentro de una unidad:
```ts
{
  id: 'py-u4-pares', kind: 'code', title: 'Solo pares', xp: 15,
  concept: 'Explicación corta con `código`.',
  prompt: 'Lo que debe hacer el usuario.',
  starter: '', solution: '...', hint: '...',
  expectedOutput: '2\n4',                       // opcional
  test: 'assert "for" in __source__, "Usa un bucle."',  // opcional
}
```
En `test` tienes: las variables del usuario, `__output__`, `__source__` y `run_with(codigo)`.
Usa la plantilla ``py`...` `` para escribir código multilínea con sangría cómoda.

Después corre `npm run check:content`: confirma que cada solución pasa, que ningún código inicial
pasa solo y que las respuestas de "predice la salida" son correctas.

## 7. PWA (app instalable)

- `public/manifest.webmanifest` + iconos PNG en `public/icons/` (iOS no usa SVG; el `apple-touch-icon` no tiene transparencia para evitar bordes negros).
- `vite.pwa.ts`: copia Pyodide a `/pyodide/<versión>/` (Python viaja con la app, sin CDN) y genera `sw.js` con la lista exacta de archivos.
- `src/pwa/sw-template.js`: guarda todo al instalar; navegación "red primero" con respaldo sin conexión.
- `src/pwa/register.ts`: revisa versiones al abrir y al volver a la app; muestra "¡Hay una versión nueva!" → Actualizar.
- Fuentes incluidas en la app (`@fontsource`), no desde Google.
- iOS: comillas tipográficas “ ” se convierten a " ' al escribir; letra de 16 px en campos para que Safari no haga zoom.
- Publicar: Netlify construye con `netlify.toml` (cabeceras de caché incluidas).

## 8. Roadmap

- [x] **v0.1** Python básico→recursión (6 unidades, 28 retos), editor, consola, XP, rachas, niveles, modo Libre, perfil.
- [x] **v0.2** Python completo hasta nivel 6: 16 unidades, 88 retos (~3 500 XP), retos "arregla el bug", verificador automático.
- [x] **v0.3** PWA instalable en iPhone/Android, funciona sin internet. Publicada en https://loppy-code.netlify.app
- [x] **v0.6** Ranking semanal e histórico con país y anti-trampas.
- [ ] v0.4 Reto diario.
- [ ] Resaltar en el editor la línea del error; sonidos.
- [ ] v0.4 Supabase: cuentas, sincronización, protector de racha.
- [ ] v0.5 JavaScript y R en navegador.
- [ ] v0.6 C++ y Java vía Judge0/Piston.
- [ ] v1.0 App móvil con Capacitor (Play Store / App Store).
