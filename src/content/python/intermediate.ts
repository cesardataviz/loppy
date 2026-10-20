import type { Unit } from '../types'
import { py } from '../py'

// Nivel 3 · Iterador: textos y diccionarios.
export const intermediateUnits: Unit[] = [
  {
    id: 'py-u7',
    title: 'Textos a fondo',
    description: 'Corta, transforma y analiza cadenas de texto.',
    level: 3,
    exercises: [
      {
        id: 'py-u7-slice',
        kind: 'predict',
        title: 'Rebanadas de texto',
        xp: 12,
        concept: 'Con `texto[inicio:fin]` sacas un pedazo del texto. El `fin` no se incluye. `texto[::-1]` lo da vuelta.',
        code: py`
          palabra = "Python"
          print(palabra[0:3])
        `,
        options: ['Pyt', 'Pyth', 'yth', 'P'],
        answer: 0,
        explain: 'Toma las posiciones 0, 1 y 2 (la 3 no entra): "Pyt".',
      },
      {
        id: 'py-u7-methods',
        kind: 'code',
        title: 'Métodos de texto',
        xp: 25,
        concept: 'Los textos traen métodos listos: `.upper()` (MAYÚSCULAS), `.lower()` (minúsculas), `.strip()` (quita espacios de los bordes) y `.replace(a, b)`. Se pueden encadenar:\n```\n"  hola ".strip().upper()   # "HOLA"\n```',
        prompt: 'Limpia el mensaje: sin espacios a los lados y en mayúsculas. Debe imprimir: HOLA LOPPY',
        starter: 'mensaje = "  hola loppy  "\n',
        solution: py`
          mensaje = "  hola loppy  "
          print(mensaje.strip().upper())
        `,
        hint: 'mensaje.strip().upper() hace las dos cosas de una vez.',
        expectedOutput: 'HOLA LOPPY',
        test: py`
          assert "HOLA" not in __source__, "Transforma la variable mensaje con métodos, no escribas el resultado a mano."
          assert ".upper()" in __source__, "Usa .upper() para pasar a mayúsculas."
        `,
      },
      {
        id: 'py-u7-in',
        kind: 'predict',
        title: '¿Está adentro?',
        xp: 12,
        concept: '`in` pregunta si un texto está contenido dentro de otro. Devuelve `True` o `False`.',
        code: 'print("py" in "Loppy")',
        options: ['True', 'False', 'py', 'Error'],
        answer: 0,
        explain: '"Loppy" termina en "py", así que "py" sí está adentro: True.',
      },
      {
        id: 'py-u7-split',
        kind: 'code',
        title: 'Partir y unir',
        xp: 28,
        concept: '`.split()` parte un texto en una lista de palabras. `"-".join(lista)` las une con el separador que elijas. `.capitalize()` pone en mayúscula la primera letra.',
        prompt: 'Transforma la frase para imprimir: Aprende-Ejecuta-Repite',
        starter: 'frase = "aprende ejecuta repite"\n',
        solution: py`
          frase = "aprende ejecuta repite"
          palabras = [p.capitalize() for p in frase.split()]
          print("-".join(palabras))
        `,
        hint: 'Parte con frase.split(), capitaliza cada palabra en un for y únelas con "-".join(...).',
        expectedOutput: 'Aprende-Ejecuta-Repite',
        test: py`
          assert "split" in __source__ and "join" in __source__, "Usa .split() para partir y .join() para unir."
          assert "Aprende" not in __source__, "Deja que el código haga la transformación."
        `,
      },
      {
        id: 'py-u7-palindrome',
        kind: 'code',
        title: 'Detector de palíndromos',
        xp: 30,
        concept: 'Un palíndromo se lee igual al derecho y al revés: "Oso", "Anita lava la tina". Truco: compara el texto con `texto[::-1]`.',
        prompt: 'Crea es_palindromo(texto) que devuelva True o False. Ignora mayúsculas y espacios.',
        starter: 'def es_palindromo(texto):\n    pass  # tu código aquí\n',
        solution: py`
          def es_palindromo(texto):
              limpio = texto.replace(" ", "").lower()
              return limpio == limpio[::-1]
        `,
        hint: 'Primero limpia: texto.replace(" ", "").lower(). Luego compara limpio == limpio[::-1].',
        test: py`
          for caso, esperado in [("Oso", True), ("Anita lava la tina", True), ("Loppy", False), ("ana", True), ("python", False)]:
              got = es_palindromo(caso)
              assert got == esperado, f"es_palindromo({caso!r}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u7-vowels',
        kind: 'code',
        title: 'Cuenta vocales',
        xp: 30,
        concept: 'Puedes recorrer un texto letra por letra con `for letra in texto:` y usar `in` para preguntar si la letra está en un grupo.',
        prompt: 'Crea contar_vocales(texto) que devuelva cuántas vocales (a, e, i, o, u) tiene, en mayúscula o minúscula.',
        starter: 'def contar_vocales(texto):\n    pass  # tu código aquí\n',
        solution: py`
          def contar_vocales(texto):
              total = 0
              for letra in texto.lower():
                  if letra in "aeiou":
                      total += 1
              return total
        `,
        hint: 'Usa un acumulador. Recorre texto.lower() y suma 1 cuando letra in "aeiou".',
        test: py`
          for caso, esperado in [("Loppy", 1), ("PROGRAMAR", 3), ("xyz", 0), ("Aprende", 3), ("", 0)]:
              got = contar_vocales(caso)
              assert got == esperado, f"contar_vocales({caso!r}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u7-fix',
        kind: 'code',
        title: 'Arregla el bug: texto + número',
        xp: 25,
        concept: 'Python no mezcla texto y números con `+`. Opciones: convertir con `str(edad)` o, mejor, usar una f-string.',
        prompt: 'Este código se rompe. Arréglalo para que imprima: Tengo 20 años',
        starter: 'edad = 20\nprint("Tengo " + edad + " años")\n',
        solution: py`
          edad = 20
          print(f"Tengo {edad} años")
        `,
        hint: 'Ejecútalo primero para ver el error. Luego cambia a print(f"Tengo {edad} años").',
        expectedOutput: 'Tengo 20 años',
        test: 'assert "edad = 20" in __source__, "No cambies la línea edad = 20."',
      },
    ],
  },
  {
    id: 'py-u8',
    title: 'Diccionarios',
    description: 'Datos con nombre: clave → valor.',
    level: 3,
    exercises: [
      {
        id: 'py-u8-dict',
        kind: 'code',
        title: 'Tu primer diccionario',
        xp: 25,
        concept: 'Un diccionario guarda pares `clave: valor` entre llaves. Lees un valor con su clave:\n```\nusuario = {"nombre": "Ana", "nivel": 3}\nprint(usuario["nombre"])   # Ana\n```',
        prompt: 'Crea el diccionario loppy con nombre "Loppy", edad 3 y lenguaje "Python". Usándolo, imprime: Loppy programa en Python',
        starter: '',
        solution: py`
          loppy = {"nombre": "Loppy", "edad": 3, "lenguaje": "Python"}
          print(f"{loppy['nombre']} programa en {loppy['lenguaje']}")
        `,
        hint: 'Dentro de una f-string con comillas dobles, usa comillas simples para la clave: {loppy[\'nombre\']}.',
        expectedOutput: 'Loppy programa en Python',
        test: py`
          assert isinstance(loppy, dict), "loppy debe ser un diccionario (usa llaves {})."
          assert loppy.get("nombre") == "Loppy" and loppy.get("edad") == 3 and loppy.get("lenguaje") == "Python", "Revisa las tres claves: nombre, edad y lenguaje."
          assert "loppy[" in __source__, "Lee los valores desde el diccionario con loppy[...]"
        `,
      },
      {
        id: 'py-u8-get',
        kind: 'predict',
        title: 'Claves que no existen',
        xp: 12,
        concept: '`d["x"]` falla si la clave no existe. `d.get("x", valor)` devuelve un valor por defecto en vez de fallar.',
        code: py`
          precios = {"pan": 2, "leche": 4}
          print(precios.get("queso", 0))
        `,
        options: ['0', 'None', 'Error', 'queso'],
        answer: 0,
        explain: '"queso" no está, así que .get devuelve el valor por defecto que le pasaste: 0.',
      },
      {
        id: 'py-u8-update',
        kind: 'code',
        title: 'Actualizar inventario',
        xp: 28,
        concept: 'Los diccionarios cambian: `d["nueva"] = 1` agrega, `d["clave"] += 1` modifica y `del d["clave"]` elimina.',
        prompt: 'Agrega "uvas" con 10, suma 3 a "manzanas", elimina "peras" e imprime el inventario.',
        starter: 'inventario = {"manzanas": 5, "peras": 2}\n',
        solution: py`
          inventario = {"manzanas": 5, "peras": 2}
          inventario["uvas"] = 10
          inventario["manzanas"] += 3
          del inventario["peras"]
          print(inventario)
        `,
        hint: 'Tres líneas: inventario["uvas"] = 10, inventario["manzanas"] += 3 y del inventario["peras"].',
        expectedOutput: "{'manzanas': 8, 'uvas': 10}",
        test: py`
          assert inventario == {"manzanas": 8, "uvas": 10}, "El inventario final debe tener manzanas: 8 y uvas: 10."
          assert '"manzanas": 8' not in __source__ and "'manzanas': 8" not in __source__, "Modifica el diccionario, no lo escribas de nuevo."
        `,
      },
      {
        id: 'py-u8-items',
        kind: 'code',
        title: 'Recorrer un diccionario',
        xp: 30,
        concept: '`for clave, valor in d.items():` recorre cada par del diccionario.',
        prompt: 'Imprime cada alumno con su nota, una línea por alumno, con el formato: Ana: 18',
        starter: 'notas = {"Ana": 18, "Luis": 12, "Eva": 15}\n',
        solution: py`
          notas = {"Ana": 18, "Luis": 12, "Eva": 15}
          for nombre, nota in notas.items():
              print(f"{nombre}: {nota}")
        `,
        hint: 'for nombre, nota in notas.items(): y adentro print(f"{nombre}: {nota}").',
        expectedOutput: 'Ana: 18\nLuis: 12\nEva: 15',
        test: 'assert "for" in __source__, "Recorre el diccionario con un for."',
      },
      {
        id: 'py-u8-repeat',
        kind: 'predict',
        title: 'Claves repetidas',
        xp: 12,
        concept: 'Las claves de un diccionario son únicas. Si repites una, el último valor gana.',
        code: py`
          d = {"a": 1, "b": 2, "a": 3}
          print(len(d), d["a"])
        `,
        options: ['3 1', '2 3', '2 1', 'Error'],
        answer: 1,
        explain: 'Solo hay dos claves ("a" y "b"), y "a" se queda con el último valor: 3.',
      },
      {
        id: 'py-u8-count',
        kind: 'code',
        title: 'Contador de palabras',
        xp: 35,
        concept: 'Patrón clásico para contar: `conteo[x] = conteo.get(x, 0) + 1`. Si la clave no existía, empieza en 0.',
        prompt: 'Crea contar_palabras(frase) que devuelva un diccionario con cuántas veces aparece cada palabra.',
        starter: 'def contar_palabras(frase):\n    conteo = {}\n    # tu código aquí\n    return conteo\n',
        solution: py`
          def contar_palabras(frase):
              conteo = {}
              for palabra in frase.split():
                  conteo[palabra] = conteo.get(palabra, 0) + 1
              return conteo
        `,
        hint: 'Recorre frase.split() y usa conteo[palabra] = conteo.get(palabra, 0) + 1.',
        test: py`
          assert "Counter" not in __source__, "Hazlo a mano esta vez (Counter llega más adelante)."
          for caso, esperado in [("el loop y el loop", {"el": 2, "loop": 2, "y": 1}), ("hola", {"hola": 1}), ("", {})]:
              got = contar_palabras(caso)
              assert got == esperado, f"contar_palabras({caso!r}) devolvió {got}; esperaba {esperado}"
        `,
      },
    ],
  },
]
