import type { CodeError } from './types'

// Traduce excepciones técnicas a mensajes con el tono de Loppy: curioso, cero intimidante.
interface Friendly {
  title: string
  tip: string
}

const MAP: Record<string, (e: CodeError) => Friendly> = {
  SyntaxError: (e) => ({
    title: 'Loppy se enredó leyendo tu código',
    tip: syntaxTip(e.message),
  }),
  IndentationError: () => ({
    title: 'Los espacios no están alineados',
    tip: 'En Python la sangría (espacios al inicio) importa. Revisa que el bloque después de ":" tenga 4 espacios.',
  }),
  TabError: () => ({
    title: 'Mezcla de tabs y espacios',
    tip: 'Usa solo espacios para la sangría, 4 por nivel.',
  }),
  NameError: (e) => {
    const name = /'(.+?)'/.exec(e.message)?.[1]
    return {
      title: name ? `Loppy no conoce "${name}"` : 'Hay un nombre desconocido',
      tip: name
        ? `¿Lo escribiste igual que cuando lo creaste? Python distingue mayúsculas. Si es texto, ponlo entre comillas: "${name}".`
        : 'Revisa que la variable exista antes de usarla.',
    }
  },
  TypeError: (e) => ({
    title: 'Tipos que no encajan',
    tip: /str.*int|int.*str|concatenate/.test(e.message)
      ? 'Estás mezclando texto y números. Usa str(numero) para convertir a texto, o int(texto) para convertir a número.'
      : 'Una operación recibió un tipo de dato que no esperaba. Revisa qué hay dentro de tus variables.',
  }),
  ValueError: () => ({
    title: 'Un valor con la forma equivocada',
    tip: 'Por ejemplo int("hola") no funciona: solo puedes convertir texto que parece número.',
  }),
  ZeroDivisionError: () => ({
    title: 'Dividir entre cero no se puede',
    tip: 'Ni Loppy puede hacerlo. Revisa el divisor antes de dividir.',
  }),
  IndexError: () => ({
    title: 'Te saliste de la lista',
    tip: 'Los índices empiezan en 0. Una lista de 3 elementos tiene índices 0, 1 y 2.',
  }),
  KeyError: (e) => ({
    title: `La clave ${e.message} no está en el diccionario`,
    tip: 'Revisa cómo escribiste la clave o usa .get() para un valor por defecto.',
  }),
  AttributeError: () => ({
    title: 'Ese método no existe para este tipo',
    tip: 'Revisa el nombre del método (p. ej. .upper(), .append()) y el tipo de la variable.',
  }),
  EOFError: () => ({
    title: 'input() se quedó esperando',
    tip: 'Este reto no envía datos de entrada. Prueba sin input() o usa el modo Libre.',
  }),
  RecursionError: () => ({
    title: 'Loop infinito de llamadas',
    tip: 'Tu función se llama a sí misma sin parar. Toda recursión necesita un caso base.',
  }),
  Timeout: () => ({
    title: 'Loppy se mareó de tantas vueltas',
    tip: 'Parece un bucle infinito. Revisa que la condición del while llegue a ser False.',
  }),
}

function syntaxTip(msg: string): string {
  if (/never closed|EOL|unterminated string/i.test(msg)) return 'Falta cerrar algo: una comilla, un paréntesis o un corchete.'
  if (/expected ':'/i.test(msg)) return 'Las líneas con if, for, while, def y else terminan con dos puntos ":".'
  if (/invalid syntax\. Perhaps you forgot a comma/i.test(msg)) return '¿Te faltó una coma entre elementos?'
  if (/unmatched/i.test(msg)) return 'Hay un paréntesis o corchete de cierre sin su pareja de apertura.'
  if (/'=' .*'=='|Maybe you meant '=='/i.test(msg)) return 'Para comparar se usa "==". Un solo "=" sirve para guardar valores.'
  return 'Revisa comillas, paréntesis y dos puntos en esa línea.'
}

export function friendlyError(e: CodeError): Friendly & { technical: string } {
  const f = (MAP[e.type] ?? (() => ({ title: 'Algo no salió como esperábamos', tip: 'Lee el detalle técnico: es una pista.' })))(e)
  const technical = `${e.type}${e.line ? ` (línea ${e.line})` : ''}: ${e.message}`
  return { ...f, technical }
}
