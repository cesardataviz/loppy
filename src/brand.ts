// Identidad central de la app. Cambiar el nombre aquí lo cambia en toda la UI.
export const APP_NAME = 'Loppy'
export const SLOGAN = 'Aprende a programar, vuelta a vuelta.'
export const TAGLINES = ['Tu código, en loop continuo.', 'Aprende. Ejecuta. Repite.']

// Frases de ánimo: nunca "error fatal", siempre otra vuelta.
export const RETRY_PHRASES = [
  '¡Casi! Vamos a darle otra vuelta a este bloque.',
  'Nada se rompió: solo es otra vuelta del loop.',
  'Los errores son pistas. Sigamos iterando.',
  'Una vuelta más y lo tienes.',
]

export const SUCCESS_PHRASES = [
  '¡Vuelta perfecta!',
  '¡Eso es! El loop sigue girando.',
  '¡Código limpio, cerebro feliz!',
  '¡Lo lograste! Siguiente vuelta.',
]

export const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]
