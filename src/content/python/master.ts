import type { Unit } from '../types'
import { py } from '../py'

// Nivel 5 · Maestro del Loop: clases, algoritmos clásicos, archivos y módulos.
export const masterUnits: Unit[] = [
  {
    id: 'py-u12',
    title: 'Clases y objetos',
    description: 'Crea tus propios tipos de datos con estado y comportamiento.',
    level: 5,
    exercises: [
      {
        id: 'py-u12-class',
        kind: 'code',
        title: 'Tu primera clase',
        xp: 55,
        concept: 'Una clase es un molde para crear objetos. `__init__` se ejecuta al crear cada objeto y `self` es el objeto mismo:\n```\nclass Jugador:\n    def __init__(self, nombre):\n        self.nombre = nombre\n        self.puntos = 0\n```',
        prompt: 'Completa Mascota: guarda el nombre en self.nombre y haz que toda mascota empiece con self.energia = 100.',
        starter: 'class Mascota:\n    def __init__(self, nombre):\n        pass  # tu código aquí\n',
        solution: py`
          class Mascota:
              def __init__(self, nombre):
                  self.nombre = nombre
                  self.energia = 100
        `,
        hint: 'Dentro de __init__: self.nombre = nombre y self.energia = 100.',
        test: py`
          m = Mascota("Loppy")
          assert getattr(m, "nombre", None) == "Loppy", "Guarda el nombre en self.nombre."
          assert getattr(m, "energia", None) == 100, "Cada mascota empieza con self.energia = 100."
          assert Mascota("Bit").nombre == "Bit", "El nombre debe venir del parámetro."
        `,
      },
      {
        id: 'py-u12-methods',
        kind: 'code',
        title: 'Métodos',
        xp: 60,
        concept: 'Los métodos son funciones dentro de la clase. Siempre reciben `self` primero, para poder leer y cambiar el estado del objeto.',
        prompt: 'Agrega a Contador los métodos incrementar() (suma 1 a valor) y reiniciar() (vuelve a 0).',
        starter: 'class Contador:\n    def __init__(self):\n        self.valor = 0\n',
        solution: py`
          class Contador:
              def __init__(self):
                  self.valor = 0

              def incrementar(self):
                  self.valor += 1

              def reiniciar(self):
                  self.valor = 0
        `,
        hint: 'def incrementar(self): self.valor += 1 — con la misma sangría que __init__.',
        test: py`
          c = Contador()
          assert hasattr(c, "incrementar"), "Falta el método incrementar()."
          assert hasattr(c, "reiniciar"), "Falta el método reiniciar()."
          c.incrementar(); c.incrementar(); c.incrementar()
          assert c.valor == 3, f"Después de 3 incrementos valor es {c.valor}; esperaba 3"
          otro = Contador()
          otro.incrementar()
          assert c.valor == 3 and otro.valor == 1, "Cada contador debe llevar su propia cuenta (usa self)."
          c.reiniciar()
          assert c.valor == 0, "reiniciar() debe dejar valor en 0."
        `,
      },
      {
        id: 'py-u12-str',
        kind: 'predict',
        title: 'Objetos que se imprimen bonito',
        xp: 20,
        concept: 'El método especial `__str__` decide cómo se ve un objeto cuando lo imprimes.',
        code: py`
          class Punto:
              def __init__(self, x, y):
                  self.x = x
                  self.y = y

              def __str__(self):
                  return f"({self.x}, {self.y})"

          print(Punto(2, 3))
        `,
        options: ['(2, 3)', 'Punto(2, 3)', '<Punto object>', '2 3'],
        answer: 0,
        explain: 'print usa __str__, que arma el texto "(2, 3)".',
      },
      {
        id: 'py-u12-bank',
        kind: 'code',
        title: 'Cuenta bancaria',
        xp: 65,
        concept: 'Un objeto protege sus reglas: los métodos deciden qué cambios están permitidos.',
        prompt: 'Completa CuentaBancaria: guarda titular y saldo; depositar(monto) suma; retirar(monto) resta y devuelve True, o devuelve False sin tocar el saldo si no alcanza.',
        starter: py`
          class CuentaBancaria:
              def __init__(self, titular, saldo=0):
                  pass

              def depositar(self, monto):
                  pass

              def retirar(self, monto):
                  pass
        ` + '\n',
        solution: py`
          class CuentaBancaria:
              def __init__(self, titular, saldo=0):
                  self.titular = titular
                  self.saldo = saldo

              def depositar(self, monto):
                  self.saldo += monto

              def retirar(self, monto):
                  if monto > self.saldo:
                      return False
                  self.saldo -= monto
                  return True
        `,
        hint: 'En retirar: si monto > self.saldo, return False. Si no, resta y return True.',
        test: py`
          c = CuentaBancaria("Cesar")
          assert getattr(c, "saldo", None) == 0, "El saldo inicial por defecto es 0 (guárdalo en self.saldo)."
          assert getattr(c, "titular", None) == "Cesar", "Guarda el titular en self.titular."
          c.depositar(100)
          assert c.saldo == 100, f"Tras depositar 100 el saldo es {c.saldo}"
          assert c.retirar(30) is True, "retirar(30) con saldo 100 debería devolver True."
          assert c.saldo == 70, f"Tras retirar 30 el saldo es {c.saldo}; esperaba 70"
          assert c.retirar(500) is False, "retirar(500) con saldo 70 debería devolver False."
          assert c.saldo == 70, "Si no alcanza, el saldo no debe cambiar."
          assert CuentaBancaria("Ana", 50).saldo == 50, "El saldo inicial puede venir como parámetro."
        `,
      },
      {
        id: 'py-u12-inherit',
        kind: 'code',
        title: 'Herencia',
        xp: 65,
        concept: 'Una clase puede heredar de otra: recibe todo lo del padre y puede cambiar lo que necesite.\n```\nclass Gato(Animal):\n    def hablar(self):\n        return "miau"\n```',
        prompt: 'Crea Perro, que herede de Animal y cuyo hablar() devuelva "<nombre> dice guau".',
        starter: py`
          class Animal:
              def __init__(self, nombre):
                  self.nombre = nombre

              def hablar(self):
                  return "..."

          # Crea la clase Perro aquí
        ` + '\n',
        solution: py`
          class Animal:
              def __init__(self, nombre):
                  self.nombre = nombre

              def hablar(self):
                  return "..."

          class Perro(Animal):
              def hablar(self):
                  return f"{self.nombre} dice guau"
        `,
        hint: 'class Perro(Animal): y adentro redefine hablar(self) con return f"{self.nombre} dice guau". No necesitas __init__: lo hereda.',
        test: py`
          assert "Perro" in globals(), "Crea la clase Perro."
          assert issubclass(Perro, Animal), "Perro debe heredar de Animal: class Perro(Animal):"
          got = Perro("Rex").hablar()
          assert got == "Rex dice guau", f'Perro("Rex").hablar() devolvió {got!r}'
          assert Animal("x").hablar() == "...", "No cambies la clase Animal."
        `,
      },
      {
        id: 'py-u12-fix',
        kind: 'code',
        title: 'Arregla el bug: el self perdido',
        xp: 55,
        concept: 'Dos errores típicos con clases: olvidar `self.` al guardar atributos, y olvidar `self` como primer parámetro de los métodos.',
        prompt: 'Este rectángulo no funciona. Arréglalo para que imprima su área: 12',
        starter: py`
          class Rectangulo:
              def __init__(self, ancho, alto):
                  ancho = ancho
                  alto = alto

              def area():
                  return self.ancho * self.alto

          r = Rectangulo(3, 4)
          print(r.area())
        ` + '\n',
        solution: py`
          class Rectangulo:
              def __init__(self, ancho, alto):
                  self.ancho = ancho
                  self.alto = alto

              def area(self):
                  return self.ancho * self.alto

          r = Rectangulo(3, 4)
          print(r.area())
        `,
        hint: 'Hay dos bugs: falta self. en __init__ y falta self en def area().',
        expectedOutput: '12',
        test: 'assert Rectangulo(5, 2).area() == 10, "Rectangulo(5, 2).area() debería dar 10."',
      },
    ],
  },
  {
    id: 'py-u13',
    title: 'Algoritmos clásicos',
    description: 'Búsqueda, ordenamiento y los retos favoritos de las entrevistas.',
    level: 5,
    exercises: [
      {
        id: 'py-u13-binary',
        kind: 'code',
        title: 'Búsqueda binaria',
        xp: 70,
        concept: 'En una lista **ordenada** no hace falta revisar todo: mira el medio, descarta la mitad que no sirve y repite. Con 1 000 000 de elementos bastan ~20 pasos.',
        prompt: 'Crea busqueda_binaria(lista, objetivo) que devuelva la posición del objetivo, o -1 si no está. Sin usar .index() ni in.',
        starter: 'def busqueda_binaria(lista, objetivo):\n    izq, der = 0, len(lista) - 1\n    # tu código aquí\n    return -1\n',
        solution: py`
          def busqueda_binaria(lista, objetivo):
              izq, der = 0, len(lista) - 1
              while izq <= der:
                  medio = (izq + der) // 2
                  if lista[medio] == objetivo:
                      return medio
                  if lista[medio] < objetivo:
                      izq = medio + 1
                  else:
                      der = medio - 1
              return -1
        `,
        hint: 'while izq <= der: medio = (izq + der) // 2. Si lista[medio] < objetivo, busca a la derecha (izq = medio + 1); si no, a la izquierda.',
        test: py`
          assert ".index(" not in __source__ and " in lista" not in __source__, "Sin .index() ni in: implementa la búsqueda tú."
          assert "//" in __source__, "Calcula el medio con división entera //."
          datos = list(range(0, 100, 3))
          for x in [0, 3, 51, 99]:
              got = busqueda_binaria(datos, x)
              assert got == datos.index(x), f"Buscando {x} devolvió {got}; esperaba {datos.index(x)}"
          assert busqueda_binaria(datos, 50) == -1, "Si no está, devuelve -1."
          assert busqueda_binaria([], 5) == -1, "En una lista vacía devuelve -1."
        `,
      },
      {
        id: 'py-u13-bubble',
        kind: 'code',
        title: 'Ordenamiento burbuja',
        xp: 70,
        concept: 'Burbuja: recorre la lista comparando vecinos y los intercambia si están al revés. Repite hasta que no haya nada que cambiar. Los grandes "flotan" al final.',
        prompt: 'Crea ordenar(lista) que devuelva una lista NUEVA ordenada de menor a mayor, sin sorted() ni .sort().',
        starter: 'def ordenar(lista):\n    res = lista[:]  # copia\n    # tu código aquí\n    return res\n',
        solution: py`
          def ordenar(lista):
              res = lista[:]
              n = len(res)
              for i in range(n):
                  for j in range(n - 1 - i):
                      if res[j] > res[j + 1]:
                          res[j], res[j + 1] = res[j + 1], res[j]
              return res
        `,
        hint: 'Dos bucles anidados. Si res[j] > res[j + 1], intercámbialos: res[j], res[j + 1] = res[j + 1], res[j].',
        test: py`
          assert "sorted(" not in __source__ and ".sort(" not in __source__, "Sin sorted() ni .sort(): ¡constrúyelo tú!"
          for caso, esperado in [([5, 2, 9, 1], [1, 2, 5, 9]), ([], []), ([3, 3, 1], [1, 3, 3]), ([1, 2, 3], [1, 2, 3]), ([9, 7, 5, 3, 1], [1, 3, 5, 7, 9])]:
              got = ordenar(caso)
              assert got == esperado, f"ordenar({caso}) devolvió {got}; esperaba {esperado}"
          original = [3, 1, 2]
          ordenar(original)
          assert original == [3, 1, 2], "No modifiques la lista original: trabaja sobre la copia."
        `,
      },
      {
        id: 'py-u13-anagram',
        kind: 'code',
        title: 'Anagramas',
        xp: 60,
        concept: 'Dos palabras son anagramas si usan exactamente las mismas letras: "Roma" y "amor". Si ordenas sus letras, quedan iguales.',
        prompt: 'Crea son_anagramas(a, b) que devuelva True o False, ignorando mayúsculas y espacios.',
        starter: 'def son_anagramas(a, b):\n    pass  # tu código aquí\n',
        solution: py`
          def son_anagramas(a, b):
              def limpiar(s):
                  return sorted(s.replace(" ", "").lower())
              return limpiar(a) == limpiar(b)
        `,
        hint: 'sorted("roma") da [\'a\', \'m\', \'o\', \'r\']. Limpia ambos textos y compara sus letras ordenadas.',
        test: py`
          for a, b, esperado in [("Roma", "amor", True), ("Loppy", "Python", False), ("Dormitory", "Dirty room", True), ("abc", "abcc", False)]:
              got = son_anagramas(a, b)
              assert got == esperado, f"son_anagramas({a!r}, {b!r}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u13-twosum',
        kind: 'code',
        title: 'Dos que suman',
        xp: 70,
        concept: 'Un diccionario recuerda lo que ya viste. Para cada número, pregunta: "¿ya vi el que me falta para llegar al objetivo?". Así resuelves en una sola pasada.',
        prompt: 'Crea par_que_suma(nums, objetivo) que devuelva la tupla (i, j) con las posiciones de dos números que sumen objetivo, o None si no existen.',
        starter: 'def par_que_suma(nums, objetivo):\n    vistos = {}  # numero -> posición\n    # tu código aquí\n    return None\n',
        solution: py`
          def par_que_suma(nums, objetivo):
              vistos = {}
              for j, n in enumerate(nums):
                  falta = objetivo - n
                  if falta in vistos:
                      return (vistos[falta], j)
                  vistos[n] = j
              return None
        `,
        hint: 'Con enumerate: falta = objetivo - n. Si falta está en vistos, return (vistos[falta], j). Si no, guarda vistos[n] = j.',
        test: py`
          for nums, obj, esperado in [([2, 7, 11, 15], 9, (0, 1)), ([3, 2, 4], 6, (1, 2)), ([3, 3], 6, (0, 1))]:
              got = par_que_suma(nums, obj)
              assert got is not None and tuple(got) == esperado, f"par_que_suma({nums}, {obj}) devolvió {got}; esperaba {esperado}"
          assert par_que_suma([1, 2], 10) is None, "Si ningún par suma el objetivo, devuelve None."
        `,
      },
      {
        id: 'py-u13-mystery',
        kind: 'predict',
        title: 'La función misteriosa',
        xp: 22,
        concept: 'Para leer recursión, sigue las llamadas hacia abajo y arma el resultado de regreso.',
        code: py`
          def misterio(n):
              if n == 0:
                  return ""
              return misterio(n // 2) + str(n % 2)

          print(misterio(6))
        `,
        options: ['011', '110', '6', '3'],
        answer: 1,
        explain: 'misterio(6) = misterio(3) + "0" = (misterio(1) + "1") + "0" = "1" + "1" + "0" = "110". ¡Convierte a binario!',
      },
      {
        id: 'py-u13-primes',
        kind: 'code',
        title: 'Cazador de primos',
        xp: 65,
        concept: 'Un primo solo es divisible entre 1 y sí mismo. Truco: basta probar divisores hasta la raíz cuadrada (`int(k ** 0.5)`).',
        prompt: 'Crea primos_hasta(n) que devuelva la lista de primos menores o iguales a n.',
        starter: 'def primos_hasta(n):\n    primos = []\n    # tu código aquí\n    return primos\n',
        solution: py`
          def primos_hasta(n):
              primos = []
              for k in range(2, n + 1):
                  es_primo = True
                  for d in range(2, int(k ** 0.5) + 1):
                      if k % d == 0:
                          es_primo = False
                          break
                  if es_primo:
                      primos.append(k)
              return primos
        `,
        hint: 'Para cada k desde 2: si ningún d entre 2 y √k lo divide, es primo. break corta el bucle apenas encuentras un divisor.',
        test: py`
          casos = [(10, [2, 3, 5, 7]), (1, []), (2, [2]), (30, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29])]
          for n, esperado in casos:
              got = primos_hasta(n)
              assert got == esperado, f"primos_hasta({n}) devolvió {got}; esperaba {esperado}"
        `,
      },
    ],
  },
  {
    id: 'py-u14',
    title: 'Archivos y módulos',
    description: 'Usa la biblioteca de Python y guarda datos en archivos.',
    level: 5,
    exercises: [
      {
        id: 'py-u14-math',
        kind: 'code',
        title: 'Importar módulos',
        xp: 55,
        concept: 'Python trae "pilas incluidas": módulos listos para usar. Se cargan con `import`:\n```\nimport math\nprint(math.sqrt(25))   # 5.0\n```',
        prompt: 'Crea area_circulo(r) que devuelva π·r² redondeado a 2 decimales, usando math.pi.',
        starter: '',
        solution: py`
          import math

          def area_circulo(r):
              return round(math.pi * r ** 2, 2)
        `,
        hint: 'import math arriba. Luego return round(math.pi * r ** 2, 2).',
        test: py`
          assert "import math" in __source__, "Importa el módulo math."
          for r, esperado in [(1, 3.14), (2, 12.57), (0, 0)]:
              got = area_circulo(r)
              assert got == esperado, f"area_circulo({r}) devolvió {got}; esperaba {esperado}"
        `,
      },
      {
        id: 'py-u14-sqrt',
        kind: 'predict',
        title: 'from … import',
        xp: 20,
        concept: '`from math import sqrt` trae solo esa función, y la usas sin escribir `math.` delante.',
        code: py`
          from math import sqrt
          print(sqrt(16))
        `,
        options: ['4', '4.0', '16', 'Error'],
        answer: 1,
        explain: 'sqrt siempre devuelve un decimal (float): 4.0.',
      },
      {
        id: 'py-u14-files',
        kind: 'code',
        title: 'Escribir y leer archivos',
        xp: 60,
        concept: '`with open(nombre, "w")` abre para escribir y lo cierra solo al terminar. Sin `"w"` se abre para leer:\n```\nwith open("notas.txt", "w") as f:\n    f.write("hola\\n")\n\nwith open("notas.txt") as f:\n    print(f.read())\n```',
        prompt: 'Escribe en lema.txt tres líneas (Aprende, Ejecuta, Repite). Luego léelo e imprime cuántas líneas tiene.',
        starter: '',
        solution: py`
          with open("lema.txt", "w") as f:
              f.write("Aprende\nEjecuta\nRepite\n")

          with open("lema.txt") as f:
              lineas = f.readlines()
          print(len(lineas))
        `,
        hint: 'Escribe con f.write("Aprende\\nEjecuta\\nRepite\\n"). Para leer, f.readlines() te da una lista de líneas.',
        expectedOutput: '3',
        test: py`
          assert "with open" in __source__, "Usa with open(...) para trabajar con el archivo."
          with open("lema.txt") as f:
              contenido = f.read().split()
          assert contenido == ["Aprende", "Ejecuta", "Repite"], f"lema.txt contiene {contenido}"
        `,
      },
      {
        id: 'py-u14-json',
        kind: 'code',
        title: 'Datos en JSON',
        xp: 60,
        concept: 'JSON es el formato con el que se hablan las apps (por ejemplo, Loppy con un servidor). `json.loads(texto)` lo convierte en un diccionario de Python.',
        prompt: 'Convierte datos con json.loads e imprime: Loppy lleva 7 días',
        starter: 'datos = \'{"nombre": "Loppy", "racha": 7}\'\n',
        solution: py`
          import json

          datos = '{"nombre": "Loppy", "racha": 7}'
          info = json.loads(datos)
          print(f"{info['nombre']} lleva {info['racha']} días")
        `,
        hint: 'import json; info = json.loads(datos); luego usa info["nombre"] e info["racha"].',
        expectedOutput: 'Loppy lleva 7 días',
        test: 'assert "json.loads" in __source__, "Convierte el texto con json.loads."',
      },
      {
        id: 'py-u14-counter',
        kind: 'code',
        title: 'Counter: contar como pro',
        xp: 60,
        concept: '`collections.Counter` cuenta todo por ti. `.most_common(1)` devuelve el más repetido:\n```\nfrom collections import Counter\nCounter("aab").most_common(1)   # [(\'a\', 2)]\n```',
        prompt: 'Crea mas_comun(texto) que devuelva la letra que más se repite (ignora los espacios).',
        starter: 'from collections import Counter\n\ndef mas_comun(texto):\n    pass  # tu código aquí\n',
        solution: py`
          from collections import Counter

          def mas_comun(texto):
              conteo = Counter(texto.replace(" ", ""))
              return conteo.most_common(1)[0][0]
        `,
        hint: 'most_common(1) da una lista con una tupla (letra, veces). Toma [0][0].',
        test: py`
          for caso, esperado in [("banana", "a"), ("loop loop", "o"), ("abracadabra", "a"), ("zzz y", "z")]:
              got = mas_comun(caso)
              assert got == esperado, f"mas_comun({caso!r}) devolvió {got!r}; esperaba {esperado!r}"
        `,
      },
    ],
  },
]
