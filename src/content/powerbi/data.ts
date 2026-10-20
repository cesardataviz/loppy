import type { DataTable } from '../types'

// Un modelo pequeño de ventas que acompaña todo el curso de Power BI.
export const VENTAS: DataTable = {
  name: 'Ventas',
  columns: ['Fecha', 'Producto', 'Categoria', 'Region', 'Cantidad', 'Precio', 'Importe'],
  rows: [
    ['2025-01-05', 'Café', 'Bebidas', 'Norte', 10, 3, 30],
    ['2025-01-18', 'Té', 'Bebidas', 'Sur', 5, 2, 10],
    ['2025-02-02', 'Galletas', 'Snacks', 'Norte', 8, 4, 32],
    ['2025-02-20', 'Café', 'Bebidas', 'Sur', 6, 3, 18],
    ['2025-03-11', 'Chocolate', 'Snacks', 'Norte', 4, 5, 20],
    ['2025-03-25', 'Té', 'Bebidas', 'Norte', 10, 2, 20],
  ],
}

export const METAS: DataTable = {
  name: 'Metas',
  columns: ['Region', 'Meta'],
  rows: [
    ['Norte', 100],
    ['Sur', 40],
  ],
}

// Datos crudos como llegan a Power Query, antes de limpiarlos.
export const CRUDO: DataTable = {
  name: 'VentasCrudo (origen)',
  columns: ['fecha', 'producto', 'region', 'cantidad'],
  rows: [
    ['05/01/2025', ' café ', 'Norte', '10'],
    ['18/01/2025', 'té', 'Sur', '5'],
    ['02/02/2025', 'galletas', 'Norte', null],
    ['20/02/2025', 'café', 'sur', '6'],
  ],
}
