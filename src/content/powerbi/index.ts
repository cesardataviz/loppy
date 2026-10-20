import type { Course } from '../types'
import { pbiBasicUnits } from './basics'
import { pbiIntermediateUnits } from './intermediate'
import { pbiAdvancedUnits } from './advanced'

// DAX y M no corren en el navegador: se practica marcando y escribiendo respuestas sobre tablas de ejemplo.
export const powerBiCourse: Course = {
  id: 'powerbi',
  name: 'Power BI (DAX y M)',
  available: true,
  units: [...pbiBasicUnits, ...pbiIntermediateUnits, ...pbiAdvancedUnits],
}
