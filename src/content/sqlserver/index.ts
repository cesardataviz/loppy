import type { Course } from '../types'
import { sqlBasicUnits } from './basics'
import { sqlIntermediateUnits } from './intermediate'
import { sqlAdvancedUnits } from './advanced'

// T-SQL no corre en el navegador: se practica marcando y escribiendo respuestas sobre tablas de ejemplo.
export const sqlServerCourse: Course = {
  id: 'sqlserver',
  name: 'SQL Server',
  available: true,
  units: [...sqlBasicUnits, ...sqlIntermediateUnits, ...sqlAdvancedUnits],
}
