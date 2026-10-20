import type { Unit } from '../types'
import { py } from '../py'

// Nivel 6 · Loop Infinito ∞: generadores, decoradores y jefes finales.
export const legendUnits: Unit[] = [
  {
    id: 'py-u15',
    title: 'Generadores y decoradores',
    description: 'yield, closures y funciones que envuelven funciones.',
    level: 6,
    exercises: [
      {
        id: 'py-u15-yield',
        kind: 'code',
        title: 'Tu primer generador',
        xp: 80,
        concept: 'Un generador usa `yield` en vez de `return`: entrega un valor, se pausa y continúa donde quedó la próxima vez. Produce valores de a uno, sin guardar toda la lista en memoria.\n```\ndef hasta_tres():\n    yield 1\n    yield 2\n    yield 3\n```',
        prompt: 'Crea el generador cuenta_regresiva(n) que produzca n, n-1, …, 1.',
        starter: 'def cuenta_regresiva(n):\n    pass  # tu código aquí\n',
        solution: py`
          def cuenta_regresiva(n):
              while n > 0:
                  yield n
                  n -= 1
        `,
        hint: 'while n > 0: yield n y luego n -= 1.',
        test: py`
          import types
          g = cuenta_regresiva(3)
          assert isinstance(g, types.GeneratorType), "Usa yield para que sea un generador."
          assert list(g) == [3, 2, 1], "cuenta_regresiva(3) debe producir 3, 2, 1."
          assert list(cuenta_regresiva(0)) == [], "cuenta_regresiva(0) no produce nada."
          assert list(cuenta_regresiva(5)) == [5, 4, 3, 2, 1], "Prueba con 5: 5, 4, 3, 2, 1."
        `,
      },
      {
        id: 'py-u15-next',
        kind: 'predict',
        title: 'Un loop infinito… que no cuelga',
        xp: 25,
        concept: '`next(g)` pide el siguiente valor a un generador. Un `while True` dentro de un generador no cuelga el programa: solo avanza cuando le pides.',
        code: py`
          def pares():
              n = 0
              while True:
                  yield n
                  n += 2

          g = pares()
          next(g)
          print(next(g), next(g))
        `,
        options: ['0 2', '2 4', '0 2 4', 'Error (bucle infinito)'],
        answer: 1,
        explain: 'El primer next(g) consume el 0. Luego se piden dos más: 2 y 4.',
      },
      {
        id: 'py-u15-closure',
        kind: 'code',
        title: 'Fábrica de funciones',
        xp: 80,
        concept: 'Una función puede crear y devolver otra función. La función interna "recuerda" las variables de donde nació: eso es un **closure**.\n```\ndef crear_saludo(saludo):\n    def saludar(nombre):\n        return f"{saludo}, {nombre}"\n    return saludar\n```',
        prompt: 'Crea crear_multiplicador(n) que devuelva una función que multiplique su argumento por n.',
        starter: 'def crear_multiplicador(n):\n    pass  # tu código aquí\n',
        solution: py`
          def crear_multiplicador(n):
              def multiplicar(x):
                  return x * n
              return multiplicar
        `,
        hint: 'Define adentro def multiplicar(x): return x * n, y al final return multiplicar (sin paréntesis).',
        test: py`
          doble = crear_multiplicador(2)
          triple = crear_multiplicador(3)
          assert callable(doble), "crear_multiplicador debe devolver una función."
          assert doble(5) == 10, f"doble(5) devolvió {doble(5)}; esperaba 10"
          assert triple(4) == 12, f"triple(4) devolvió {triple(4)}; esperaba 12"
          assert doble(7) == 14, "Cada función debe recordar su propio n."
        `,
      },
      {
        id: 'py-u15-decorator',
        kind: 'code',
        title: 'Decoradores',
        xp: 90,
        concept: 'Un decorador recibe una función y devuelve otra que la "envuelve" para agregarle algo. Se aplica con `@`:\n```\ndef con_log(f):\n    def envoltura(*args, **kwargs):\n        print("llamando", f.__name__)\n        return f(*args, **kwargs)\n    return envoltura\n```',
        prompt: 'Crea el decorador gritar: el texto que devuelve la función decorada debe salir en MAYÚSCULAS y con "!" al final.',
        starter: 'def gritar(funcion):\n    pass  # tu código aquí\n\n@gritar\ndef saludo(nombre):\n    return f"hola {nombre}"\n\nprint(saludo("loppy"))\n',
        solution: py`
          def gritar(funcion):
              def envoltura(*args, **kwargs):
                  return funcion(*args, **kwargs).upper() + "!"
              return envoltura

          @gritar
          def saludo(nombre):
              return f"hola {nombre}"

          print(saludo("loppy"))
        `,
        hint: 'Dentro de gritar: def envoltura(*args, **kwargs): return funcion(*args, **kwargs).upper() + "!" — y return envoltura.',
        expectedOutput: 'HOLA LOPPY!',
        test: py`
          @gritar
          def lema():
              return "aprende, ejecuta, repite"

          assert callable(lema), "El decorador debe devolver una función (la envoltura)."
          assert lema() == "APRENDE, EJECUTA, REPITE!", "Tu decorador debe servir también para funciones sin argumentos (usa *args)."
        `,
      },
      {
        id: 'py-u15-fibgen',
        kind: 'code',
        title: 'Fibonacci infinito',
        xp: 90,
        concept: 'Los generadores pueden ser infinitos. `itertools.islice(gen, 10)` toma solo los primeros 10 valores.',
        prompt: 'Crea el generador infinito fibonacci() que produzca 0, 1, 1, 2, 3, 5, 8…',
        starter: 'def fibonacci():\n    pass  # tu código aquí\n',
        solution: py`
          def fibonacci():
              a, b = 0, 1
              while True:
                  yield a
                  a, b = b, a + b
        `,
        hint: 'a, b = 0, 1. En un while True: yield a, y luego a, b = b, a + b.',
        test: py`
          import types
          from itertools import islice
          g = fibonacci()
          assert isinstance(g, types.GeneratorType), "fibonacci() debe ser un generador (usa yield)."
          got = list(islice(g, 10))
          assert got == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34], f"Los primeros 10 fueron {got}"
        `,
      },
      {
        id: 'py-u15-memo',
        kind: 'code',
        title: 'Memoización: fib a la velocidad de la luz',
        xp: 100,
        concept: 'El fib recursivo simple recalcula lo mismo millones de veces: fib(80) tardaría años. Si guardas cada resultado en un diccionario (memoización), cada valor se calcula una sola vez.',
        prompt: 'Este fib es lentísimo. Hazlo rápido con un diccionario de memoria, sin dejar de ser recursivo. Debe calcular fib(80) al instante.',
        starter: 'def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n',
        solution: py`
          memo = {}

          def fib(n):
              if n < 2:
                  return n
              if n not in memo:
                  memo[n] = fib(n - 1) + fib(n - 2)
              return memo[n]
        `,
        hint: 'Crea memo = {} fuera de la función. Antes de calcular, revisa si n ya está en memo; si no, calcula, guarda y devuelve memo[n].',
        test: py`
          assert __source__.count("fib(") >= 2, "Sigue siendo recursivo: fib se llama a sí misma."
          assert fib(10) == 55, f"fib(10) devolvió {fib(10)}; esperaba 55"
          assert fib(80) == 23416728348467685, "fib(80) no es correcto."
          assert fib(100) == 354224848179261915075, "fib(100) no es correcto."
        `,
      },
    ],
  },
  {
    id: 'py-u16',
    title: 'Jefes finales',
    description: 'Retos de entrevista para demostrar que dominas el loop.',
    level: 6,
    exercises: [
      {
        id: 'py-u16-brackets',
        kind: 'code',
        title: 'Paréntesis balanceados',
        xp: 100,
        concept: 'Una **pila** es una lista donde lo último que entra es lo primero que sale (`append` y `pop`). Perfecta para emparejar aperturas y cierres.',
        prompt: 'Crea balanceado(texto) que devuelva True si cada ( [ { se cierra en el orden correcto.',
        starter: 'def balanceado(texto):\n    pila = []\n    # tu código aquí\n',
        solution: py`
          def balanceado(texto):
              pares = {")": "(", "]": "[", "}": "{"}
              pila = []
              for c in texto:
                  if c in "([{":
                      pila.append(c)
                  elif c in pares:
                      if not pila or pila.pop() != pares[c]:
                          return False
              return not pila
        `,
        hint: 'Las aperturas van a la pila. Con un cierre, la pila no debe estar vacía y su último elemento debe ser la apertura que corresponde. Al final, la pila debe quedar vacía.',
        test: py`
          casos = [("([]{})", True), ("([)]", False), ("(((", False), ("", True), ("a(b)c", True), (")(", False), ("{[()()]}", True)]
          for caso, esperado in casos:
              got = balanceado(caso)
              assert got == esperado, f"balanceado({caso!r}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u16-roman',
        kind: 'code',
        title: 'Números romanos',
        xp: 100,
        concept: 'Algoritmo "voraz": usa siempre el símbolo más grande que quepa. Incluye los casos restados (900 = CM, 4 = IV) en la tabla y todo sale solo.',
        prompt: 'Crea a_romano(n) que convierta un número del 1 al 3999 a romano.',
        starter: 'def a_romano(n):\n    valores = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),\n               (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),\n               (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]\n    # tu código aquí\n',
        solution: py`
          def a_romano(n):
              valores = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
                         (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
                         (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
              resultado = ""
              for valor, letra in valores:
                  while n >= valor:
                      resultado += letra
                      n -= valor
              return resultado
        `,
        hint: 'Recorre valores; mientras n >= valor, agrega la letra y resta el valor.',
        test: py`
          for n, esperado in [(1, "I"), (4, "IV"), (9, "IX"), (14, "XIV"), (1994, "MCMXCIV"), (2026, "MMXXVI"), (3999, "MMMCMXCIX")]:
              got = a_romano(n)
              assert got == esperado, f"a_romano({n}) devolvió {got!r}; esperaba {esperado!r}"
        `,
      },
      {
        id: 'py-u16-flatten',
        kind: 'code',
        title: 'Aplanar listas',
        xp: 110,
        concept: 'Las estructuras anidadas (listas dentro de listas dentro de listas…) piden recursión. `isinstance(x, list)` te dice si algo es una lista.',
        prompt: 'Crea aplanar(lista) que devuelva todos los elementos en una sola lista plana, sin importar qué tan anidada esté.',
        starter: 'def aplanar(lista):\n    pass  # tu código aquí\n',
        solution: py`
          def aplanar(lista):
              plano = []
              for x in lista:
                  if isinstance(x, list):
                      plano.extend(aplanar(x))
                  else:
                      plano.append(x)
              return plano
        `,
        hint: 'Para cada x: si es lista, extiende con aplanar(x); si no, agrégalo con append.',
        test: py`
          for caso, esperado in [([1, [2, [3, [4]]], 5], [1, 2, 3, 4, 5]), ([], []), ([[[]]], []), ([1, 2], [1, 2]), ([["a"], ["b", ["c"]]], ["a", "b", "c"])]:
              got = aplanar(caso)
              assert got == esperado, f"aplanar({caso}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u16-caesar',
        kind: 'code',
        title: 'Cifrado César',
        xp: 100,
        concept: 'Cada letra se corre k posiciones en el alfabeto (con k = 3, a→d). `ord("a")` da el código de la letra y `chr(97)` hace lo inverso. `% 26` da la vuelta al llegar a la z.',
        prompt: 'Crea cifrar(texto, k). Corre las letras a-z y A-Z (respetando mayúsculas) y deja igual todo lo demás.',
        starter: 'def cifrar(texto, k):\n    pass  # tu código aquí\n',
        solution: py`
          def cifrar(texto, k):
              resultado = ""
              for c in texto:
                  if "a" <= c <= "z":
                      resultado += chr((ord(c) - ord("a") + k) % 26 + ord("a"))
                  elif "A" <= c <= "Z":
                      resultado += chr((ord(c) - ord("A") + k) % 26 + ord("A"))
                  else:
                      resultado += c
              return resultado
        `,
        hint: 'Para minúsculas: chr((ord(c) - ord("a") + k) % 26 + ord("a")). Lo mismo con "A" para mayúsculas.',
        test: py`
          for t, k, esperado in [("abc", 1, "bcd"), ("xyz", 3, "abc"), ("Hola, Loppy!", 13, "Ubyn, Ybccl!"), ("ABC", -1, "ZAB")]:
              got = cifrar(t, k)
              assert got == esperado, f"cifrar({t!r}, {k}) devolvió {got!r}; esperaba {esperado!r}"
          assert cifrar(cifrar("Aprende 123", 5), -5) == "Aprende 123", "Cifrar con k y luego con -k debe devolver el original."
        `,
      },
      {
        id: 'py-u16-perms',
        kind: 'code',
        title: 'Todas las permutaciones',
        xp: 120,
        concept: 'Para permutar "abc": fija cada letra al inicio y permuta recursivamente el resto. a + permutaciones("bc"), b + permutaciones("ac")…',
        prompt: 'Crea permutaciones(texto) que devuelva una lista ordenada con todas las permutaciones (las letras no se repiten). Sin itertools.',
        starter: 'def permutaciones(texto):\n    pass  # tu código aquí\n',
        solution: py`
          def permutaciones(texto):
              if len(texto) <= 1:
                  return [texto]
              res = []
              for i, c in enumerate(texto):
                  for resto in permutaciones(texto[:i] + texto[i + 1:]):
                      res.append(c + resto)
              return sorted(res)
        `,
        hint: 'Caso base: si len(texto) <= 1, return [texto]. Si no, para cada letra c en la posición i: c + cada permutación de texto sin esa letra.',
        test: py`
          assert "itertools" not in __source__, "Sin itertools: construye la recursión tú."
          assert permutaciones("a") == ["a"], "permutaciones('a') debe ser ['a']."
          assert permutaciones("ab") == ["ab", "ba"], f"permutaciones('ab') devolvió {permutaciones('ab')}"
          got = permutaciones("abc")
          assert got == ["abc", "acb", "bac", "bca", "cab", "cba"], f"permutaciones('abc') devolvió {got}"
          assert len(permutaciones("abcde")) == 120, "Con 5 letras deben salir 120 permutaciones."
        `,
      },
      {
        id: 'py-u16-transpose',
        kind: 'code',
        title: 'Transponer matrices',
        xp: 110,
        concept: 'Una matriz es una lista de filas. Transponer es convertir filas en columnas: el elemento `m[i][j]` pasa a `t[j][i]`.',
        prompt: 'Crea transponer(m). Para una matriz vacía devuelve [].',
        starter: 'def transponer(m):\n    pass  # tu código aquí\n',
        solution: py`
          def transponer(m):
              if not m:
                  return []
              return [[fila[j] for fila in m] for j in range(len(m[0]))]
        `,
        hint: 'La columna j es [fila[j] for fila in m]. Haz eso para cada j en range(len(m[0])).',
        test: py`
          for m, esperado in [([[1, 2, 3], [4, 5, 6]], [[1, 4], [2, 5], [3, 6]]), ([[1]], [[1]]), ([], []), ([[1, 2]], [[1], [2]])]:
              got = transponer(m)
              assert got == esperado, f"transponer({m}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u16-life',
        kind: 'code',
        title: 'Loop Infinito: el Juego de la Vida',
        xp: 150,
        concept: 'El Juego de la Vida de Conway: una cuadrícula de células vivas `#` y muertas `.`. En cada paso:\n- Una célula viva con 2 o 3 vecinas vivas sobrevive.\n- Una célula muerta con exactamente 3 vecinas vivas nace.\n- Todas las demás mueren o siguen muertas.\nCada célula tiene hasta 8 vecinas (las diagonales cuentan). Fuera del tablero todo está muerto.',
        prompt: 'Crea siguiente(tablero), que recibe una lista de textos y devuelve el tablero del siguiente paso.',
        starter: 'def siguiente(tablero):\n    filas, cols = len(tablero), len(tablero[0])\n    nuevo = []\n    # tu código aquí\n    return nuevo\n',
        solution: py`
          def siguiente(tablero):
              filas, cols = len(tablero), len(tablero[0])
              nuevo = []
              for i in range(filas):
                  fila = ""
                  for j in range(cols):
                      vecinos = 0
                      for di in (-1, 0, 1):
                          for dj in (-1, 0, 1):
                              if (di or dj) and 0 <= i + di < filas and 0 <= j + dj < cols:
                                  vecinos += tablero[i + di][j + dj] == "#"
                      viva = tablero[i][j] == "#"
                      fila += "#" if vecinos == 3 or (viva and vecinos == 2) else "."
                  nuevo.append(fila)
              return nuevo
        `,
        hint: 'Para cada celda, cuenta sus vecinas recorriendo di y dj en (-1, 0, 1), sin contar la propia celda (di = dj = 0) y sin salirte del borde.',
        test: py`
          vertical = [".....", "..#..", "..#..", "..#..", "....."]
          horizontal = [".....", ".....", ".###.", ".....", "....."]
          got = siguiente(vertical)
          assert got == horizontal, "El 'parpadeador' vertical debe volverse horizontal:\n" + "\n".join(got or ["(vacío)"])
          assert siguiente(horizontal) == vertical, "…y luego volver a ser vertical."
          bloque = ["....", ".##.", ".##.", "...."]
          assert siguiente(bloque) == bloque, "Un bloque 2x2 es estable: no cambia."
          assert siguiente(["...", ".#.", "..."]) == ["...", "...", "..."], "Una célula sola muere de soledad."
          assert siguiente(["##", "##"]) == ["##", "##"], "Cuidado con los bordes: fuera del tablero todo está muerto."
        `,
      },
    ],
  },
]
