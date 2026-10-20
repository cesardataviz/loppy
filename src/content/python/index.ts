import type { Course } from '../types'
import { basicUnits } from './basics'
import { intermediateUnits } from './intermediate'
import { advancedUnits } from './advanced'
import { masterUnits } from './master'
import { legendUnits } from './legend'

export const pythonCourse: Course = {
  id: 'python',
  language: 'python',
  name: 'Python',
  available: true,
  units: [...basicUnits, ...intermediateUnits, ...advancedUnits, ...masterUnits, ...legendUnits],
}
