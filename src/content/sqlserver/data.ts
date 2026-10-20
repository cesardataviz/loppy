import type { DataTable } from '../types'

// Una mini tienda que acompaña todo el curso: siempre las mismas tablas, para que los datos se vuelvan familiares.
export const CLIENTES: DataTable = {
  name: 'Clientes',
  columns: ['ClienteID', 'Nombre', 'Ciudad', 'FechaAlta'],
  rows: [
    [1, 'Ana', 'Lima', '2024-01-15'],
    [2, 'Bruno', 'Quito', '2024-03-02'],
    [3, 'Carla', 'Lima', '2024-05-20'],
    [4, 'Diego', 'Bogotá', '2025-02-11'],
    [5, 'Elena', null, '2025-06-30'],
  ],
}

export const PRODUCTOS: DataTable = {
  name: 'Productos',
  columns: ['ProductoID', 'Nombre', 'Categoria', 'Precio'],
  rows: [
    [1, 'Teclado', 'Accesorios', 50],
    [2, 'Mouse', 'Accesorios', 20],
    [3, 'Monitor', 'Pantallas', 300],
    [4, 'Laptop', 'Equipos', 1200],
    [5, 'Cable HDMI', 'Accesorios', 10],
    [6, 'Webcam', 'Accesorios', 70],
  ],
}

export const PEDIDOS: DataTable = {
  name: 'Pedidos',
  columns: ['PedidoID', 'ClienteID', 'ProductoID', 'Cantidad', 'Fecha'],
  rows: [
    [101, 1, 1, 2, '2025-01-10'],
    [102, 1, 3, 1, '2025-01-12'],
    [103, 2, 2, 3, '2025-02-05'],
    [104, 3, 4, 1, '2025-02-20'],
    [105, 3, 2, 1, '2025-03-01'],
    [106, 4, 5, 4, '2025-03-15'],
    [107, 2, 4, 1, '2025-04-02'],
  ],
}

export const PUNTAJES: DataTable = {
  name: 'Puntajes',
  columns: ['Alumno', 'Puntos'],
  rows: [
    ['Ana', 90],
    ['Bruno', 85],
    ['Carla', 90],
    ['Diego', 70],
  ],
}
