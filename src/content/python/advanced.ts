import type { Unit } from '../types'
import { py } from '../py'

// Nivel 4 · Recursivo: comprensiones, funciones pro y errores bajo control.
export const advancedUnits: Unit[] = [
  {
    id: 'py-u9',
    title: 'Comprensiones y colecciones',
    description: 'Listas en una línea, sets, tuplas, enumerate y zip.',
    level: 4,
    exercises: [
      {
        id: 'py-u9-comp',
        kind: 'code',
        title: 'Listas en una línea',
        xp: 40,
        concept: 'Una comprensión de lista crea una lista nueva en una sola línea:\n```\ndobles = [n * 2 for n in range(5)]   # [0, 2, 4, 6, 8]\n```',
        prompt: 'Crea la lista cuadrados con los cuadrados del 1 al 10 usando una comprensión, e imprímela.',
        starter: '',
        solution: py`
          cuadrados = [n ** 2 for n in range(1, 11)]
          print(cuadrados)
        `,
        hint: '[n ** 2 for n in range(1, 11)] — ** es "elevado a".',
        expectedOutput: '[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]',
        test: py`
          assert cuadrados == [n * n for n in range(1, 11)], "cuadrados debe tener los cuadrados del 1 al 10."
          assert ".append(" not in __source__, "Sin append: todo en una comprensión."
          assert "for" in __source__, "Una comprensión lleva un for adentro de los corchetes."
        `,
      },
      {
        id: 'py-u9-comp-if',
        kind: 'predict',
        title: 'Comprensión con filtro',
        xp: 15,
        concept: 'Puedes agregar un `if` al final de una comprensión para quedarte solo con algunos elementos.',
        code: 'print([n for n in range(10) if n % 3 == 0])',
        options: ['[3, 6, 9]', '[0, 3, 6, 9]', '[0, 3, 6]', '[1, 4, 7]'],
        answer: 1,
        explain: 'range(10) va de 0 a 9. Los divisibles entre 3 son 0, 3, 6 y 9 (el 0 también cuenta).',
      },
      {
        id: 'py-u9-set',
        kind: 'code',
        title: 'Sin repetidos',
        xp: 40,
        concept: 'Un `set` es una colección **sin repetidos**. `set([1, 1, 2])` da `{1, 2}`. `sorted(...)` devuelve una lista ordenada.',
        prompt: 'Crea unicos(lista) que devuelva una lista ordenada sin elementos repetidos.',
        starter: 'def unicos(lista):\n    pass  # tu código aquí\n',
        solution: py`
          def unicos(lista):
              return sorted(set(lista))
        `,
        hint: 'Se puede en una línea: return sorted(set(lista)).',
        test: py`
          for caso, esperado in [([3, 1, 3, 2, 1], [1, 2, 3]), ([], []), (["b", "a", "b"], ["a", "b"]), ([7], [7])]:
              got = unicos(caso)
              assert got == esperado, f"unicos({caso}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u9-swap',
        kind: 'predict',
        title: 'Intercambio mágico',
        xp: 15,
        concept: 'Python permite asignar varias variables a la vez (desempaquetado de tuplas): `a, b = 1, 2`.',
        code: py`
          a, b = 1, 2
          a, b = b, a
          print(a, b)
        `,
        options: ['1 2', '2 1', '2 2', 'Error'],
        answer: 1,
        explain: 'El lado derecho se evalúa primero (2, 1) y luego se reparte: a = 2, b = 1. ¡Intercambio sin variable auxiliar!',
      },
      {
        id: 'py-u9-enumerate',
        kind: 'code',
        title: 'Ranking con enumerate',
        xp: 40,
        concept: '`enumerate(lista, start=1)` te da la posición y el elemento en cada vuelta:\n```\nfor i, x in enumerate(["a", "b"], start=1):\n    print(i, x)\n```',
        prompt: 'Imprime el ranking con su posición, así:\n1. Ana\n2. Luis\n3. Eva',
        starter: 'ranking = ["Ana", "Luis", "Eva"]\n',
        solution: py`
          ranking = ["Ana", "Luis", "Eva"]
          for i, nombre in enumerate(ranking, start=1):
              print(f"{i}. {nombre}")
        `,
        hint: 'for i, nombre in enumerate(ranking, start=1): print(f"{i}. {nombre}")',
        expectedOutput: '1. Ana\n2. Luis\n3. Eva',
        test: 'assert "enumerate" in __source__, "Practica con enumerate."',
      },
      {
        id: 'py-u9-zip',
        kind: 'code',
        title: 'Unir listas con zip',
        xp: 45,
        concept: '`zip(a, b)` recorre dos listas en paralelo, formando pares. `dict(zip(claves, valores))` arma un diccionario en un paso.',
        prompt: 'Crea el diccionario tabla que asocie cada nombre con sus puntos, e imprímelo.',
        starter: 'nombres = ["Ana", "Luis", "Eva"]\npuntos = [90, 75, 82]\n',
        solution: py`
          nombres = ["Ana", "Luis", "Eva"]
          puntos = [90, 75, 82]
          tabla = dict(zip(nombres, puntos))
          print(tabla)
        `,
        hint: 'tabla = dict(zip(nombres, puntos))',
        expectedOutput: "{'Ana': 90, 'Luis': 75, 'Eva': 82}",
        test: py`
          assert tabla == {"Ana": 90, "Luis": 75, "Eva": 82}, "tabla debe asociar cada nombre con sus puntos."
          assert "zip" in __source__, "Usa zip para recorrer las dos listas juntas."
        `,
      },
    ],
  },
  {
    id: 'py-u10',
    title: 'Funciones pro',
    description: 'Parámetros flexibles, lambdas y recursión de verdad.',
    level: 4,
    exercises: [
      {
        id: 'py-u10-default',
        kind: 'code',
        title: 'Valores por defecto',
        xp: 40,
        concept: 'Un parámetro puede tener un valor por defecto. Si no lo pasas, se usa ese:\n```\ndef saludar(nombre="amigo"):\n    return f"Hola, {nombre}"\n```',
        prompt: 'Modifica potencia para que exp valga 2 si no se indica. potencia(3) → 9, potencia(2, 3) → 8.',
        starter: 'def potencia(base, exp):\n    return base ** exp\n',
        solution: py`
          def potencia(base, exp=2):
              return base ** exp
        `,
        hint: 'Solo cambia la primera línea: def potencia(base, exp=2):',
        test: py`
          assert potencia(3) == 9, "potencia(3) debería dar 9 (exp por defecto = 2)."
          assert potencia(2, 3) == 8, "potencia(2, 3) debería dar 8."
          assert potencia(5, exp=0) == 1, "potencia(5, exp=0) debería dar 1."
        `,
      },
      {
        id: 'py-u10-args',
        kind: 'code',
        title: 'Cuantos argumentos quieras',
        xp: 45,
        concept: 'Con `*numeros` una función recibe cualquier cantidad de argumentos, que llegan como una tupla. `sum()` y `len()` funcionan con ella.',
        prompt: 'Crea promedio(*numeros). Si no recibe números, debe devolver 0.',
        starter: 'def promedio(*numeros):\n    pass  # tu código aquí\n',
        solution: py`
          def promedio(*numeros):
              if not numeros:
                  return 0
              return sum(numeros) / len(numeros)
        `,
        hint: 'Primero: if not numeros: return 0. Luego return sum(numeros) / len(numeros).',
        test: py`
          assert promedio(2, 4, 6) == 4, f"promedio(2, 4, 6) devolvió {promedio(2, 4, 6)}; esperaba 4"
          assert promedio(10) == 10, "promedio(10) debería dar 10."
          assert promedio() == 0, "promedio() sin argumentos debería devolver 0 (¡ojo con dividir entre cero!)."
        `,
      },
      {
        id: 'py-u10-scope',
        kind: 'predict',
        title: 'Variables locales',
        xp: 15,
        concept: 'Una variable creada dentro de una función es **local**: no toca a la de afuera aunque se llame igual.',
        code: py`
          x = 10
          def cambiar():
              x = 5
          cambiar()
          print(x)
        `,
        options: ['5', '10', 'None', 'Error'],
        answer: 1,
        explain: 'La x = 5 vive solo dentro de cambiar(). La x de afuera sigue valiendo 10.',
      },
      {
        id: 'py-u10-sort',
        kind: 'code',
        title: 'Ordenar con lambda',
        xp: 45,
        concept: 'Una `lambda` es una función mini de una línea. Sirve para decirle a `sorted` por qué ordenar:\n```\nsorted(palabras, key=lambda p: len(p))\n```\n`reverse=True` ordena de mayor a menor.',
        prompt: 'Ordena los alumnos por nota, de mayor a menor, e imprime solo los nombres (uno por línea).',
        starter: 'alumnos = [("Ana", 18), ("Luis", 12), ("Eva", 15)]\n',
        solution: py`
          alumnos = [("Ana", 18), ("Luis", 12), ("Eva", 15)]
          ordenados = sorted(alumnos, key=lambda a: a[1], reverse=True)
          for nombre, nota in ordenados:
              print(nombre)
        `,
        hint: 'sorted(alumnos, key=lambda a: a[1], reverse=True) — a[1] es la nota de cada tupla.',
        expectedOutput: 'Ana\nEva\nLuis',
        test: 'assert "lambda" in __source__, "Usa una lambda como key para ordenar."',
      },
      {
        id: 'py-u10-fib',
        kind: 'code',
        title: 'Fibonacci recursivo',
        xp: 50,
        concept: 'La serie de Fibonacci: cada número es la suma de los dos anteriores. 0, 1, 1, 2, 3, 5, 8, 13…\n```\nfib(0) = 0\nfib(1) = 1\nfib(n) = fib(n - 1) + fib(n - 2)\n```',
        prompt: 'Crea fib(n) de forma recursiva siguiendo la definición.',
        starter: 'def fib(n):\n    pass  # tu código aquí\n',
        solution: py`
          def fib(n):
              if n < 2:
                  return n
              return fib(n - 1) + fib(n - 2)
        `,
        hint: 'Caso base: si n < 2, return n. Si no, return fib(n - 1) + fib(n - 2).',
        test: py`
          assert __source__.count("fib(") >= 2, "La función debe llamarse a sí misma."
          for n, esperado in [(0, 0), (1, 1), (2, 1), (10, 55), (20, 6765)]:
              got = fib(n)
              assert got == esperado, f"fib({n}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u10-digits',
        kind: 'code',
        title: 'Suma de dígitos',
        xp: 50,
        concept: 'Con números: `n % 10` da el último dígito y `n // 10` quita el último dígito. 1234 % 10 = 4, 1234 // 10 = 123.',
        prompt: 'Crea suma_digitos(n) recursiva: suma_digitos(1234) → 10.',
        starter: 'def suma_digitos(n):\n    pass  # tu código aquí\n',
        solution: py`
          def suma_digitos(n):
              if n < 10:
                  return n
              return n % 10 + suma_digitos(n // 10)
        `,
        hint: 'Caso base: si n < 10, return n. Si no: último dígito + suma_digitos(del resto).',
        test: py`
          assert __source__.count("suma_digitos(") >= 2, "La función debe llamarse a sí misma."
          for n, esperado in [(0, 0), (7, 7), (1234, 10), (9999, 36), (105, 6)]:
              got = suma_digitos(n)
              assert got == esperado, f"suma_digitos({n}) devolvió {got}; esperaba {esperado}"
        `,
      },
    ],
  },
  {
    id: 'py-u11',
    title: 'Errores bajo control',
    description: 'try, except y raise: tu código no se cae, se recupera.',
    level: 4,
    exercises: [
      {
        id: 'py-u11-try',
        kind: 'code',
        title: 'Atrapar errores',
        xp: 40,
        concept: '`try` intenta algo; si falla, `except` lo atrapa y el programa sigue:\n```\ntry:\n    n = int("hola")\nexcept ValueError:\n    n = 0\n```',
        prompt: 'Crea a_numero(texto) que devuelva el texto convertido a entero, o None si no se puede.',
        starter: 'def a_numero(texto):\n    return int(texto)\n',
        solution: py`
          def a_numero(texto):
              try:
                  return int(texto)
              except ValueError:
                  return None
        `,
        hint: 'Envuelve el return int(texto) en un try, y en except ValueError: return None.',
        test: py`
          assert "try" in __source__, "Usa try / except."
          for caso, esperado in [("42", 42), ("-3", -3), ("hola", None), ("3.5", None)]:
              got = a_numero(caso)
              assert got == esperado, f"a_numero({caso!r}) devolvió {got!r}; esperaba {esperado!r}"
        `,
      },
      {
        id: 'py-u11-finally',
        kind: 'predict',
        title: 'finally siempre corre',
        xp: 18,
        concept: 'El bloque `finally` se ejecuta siempre, haya error o no. Ideal para "limpiar" (cerrar archivos, etc.).',
        code: py`
          try:
              print(1 / 0)
          except ZeroDivisionError:
              print("A")
          finally:
              print("B")
        `,
        options: ['A', 'B', 'A\nB', 'Error'],
        answer: 2,
        explain: '1 / 0 lanza ZeroDivisionError, se atrapa e imprime A. Después finally imprime B.',
      },
      {
        id: 'py-u11-raise',
        kind: 'code',
        title: 'Lanzar tus propios errores',
        xp: 45,
        concept: 'Con `raise` tú decides cuándo algo es un error:\n```\nif edad < 0:\n    raise ValueError("Edad inválida")\n```',
        prompt: 'Haz que retirar(saldo, monto) lance ValueError("Saldo insuficiente") si el monto supera el saldo.',
        starter: 'def retirar(saldo, monto):\n    return saldo - monto\n',
        solution: py`
          def retirar(saldo, monto):
              if monto > saldo:
                  raise ValueError("Saldo insuficiente")
              return saldo - monto
        `,
        hint: 'Antes del return: if monto > saldo: raise ValueError("Saldo insuficiente")',
        test: py`
          assert retirar(100, 30) == 70, "retirar(100, 30) debería devolver 70."
          assert retirar(50, 50) == 0, "Retirar todo el saldo sí se puede."
          try:
              retirar(10, 50)
          except ValueError as e:
              assert str(e) == "Saldo insuficiente", f"El mensaje debe ser 'Saldo insuficiente', fue: {e}"
          else:
              raise AssertionError("retirar(10, 50) debería lanzar ValueError.")
        `,
      },
      {
        id: 'py-u11-fix',
        kind: 'code',
        title: 'Arregla el bug: índices',
        xp: 45,
        concept: 'Error clásico: los índices van de `0` a `len(lista) - 1`. Mejor aún: recorre los elementos directamente con `for x in lista`.',
        prompt: 'Este código debería imprimir 60, pero se rompe. Encuentra y arregla el bug.',
        starter: 'numeros = [10, 20, 30]\ntotal = 0\nfor i in range(1, len(numeros) + 1):\n    total += numeros[i]\nprint(total)\n',
        solution: py`
          numeros = [10, 20, 30]
          total = 0
          for n in numeros:
              total += n
          print(total)
        `,
        hint: 'range(1, len + 1) llega a 3, pero el último índice es 2. Usa range(len(numeros)) o for n in numeros.',
        expectedOutput: '60',
        test: py`
          assert "numeros = [10, 20, 30]" in __source__, "No cambies la lista."
          assert "print(total)" in __source__, "Imprime la variable total."
        `,
      },
      {
        id: 'py-u11-int',
        kind: 'predict',
        title: '¿Convierte o falla?',
        xp: 18,
        concept: '`int()` convierte textos que parecen enteros. Un texto con punto decimal necesita `float()` primero.',
        code: 'print(int("3.5"))',
        options: ['3', '3.5', '4', 'Error'],
        answer: 3,
        explain: 'int("3.5") lanza ValueError: "3.5" no parece un entero. Funcionaría int(float("3.5")) → 3.',
      },
    ],
  },
]
