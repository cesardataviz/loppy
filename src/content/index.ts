import type { Course, Exercise, Unit } from './types'
import { pythonCourse } from './python/index'
import { sqlServerCourse } from './sqlserver/index'
import { powerBiCourse } from './powerbi/index'

export const courses: Course[] = [
  pythonCourse,
  sqlServerCourse,
  powerBiCourse,
  { id: 'javascript', name: 'JavaScript', available: false, units: [] },
  { id: 'cpp', name: 'C++', available: false, units: [] },
  { id: 'java', name: 'Java', available: false, units: [] },
  { id: 'r', name: 'R', available: false, units: [] },
]

export interface ExerciseRef {
  course: Course
  unit: Unit
  exercise: Exercise
}

export function findExercise(id: string): ExerciseRef | null {
  for (const course of courses)
    for (const unit of course.units)
      for (const exercise of unit.exercises) if (exercise.id === id) return { course, unit, exercise }
  return null
}

/** Una unidad se desbloquea al completar la anterior. */
export function isUnitUnlocked(course: Course, unitIndex: number, completed: Record<string, unknown>): boolean {
  if (unitIndex === 0) return true
  return course.units[unitIndex - 1].exercises.every((e) => completed[e.id])
}

export function unlockedExercises(course: Course, completed: Record<string, unknown>): Exercise[] {
  return course.units.filter((_, i) => isUnitUnlocked(course, i, completed)).flatMap((u) => u.exercises)
}

/** Siguiente ejercicio sin resolver, para el botón "Continuar". */
export function nextExercise(course: Course, completed: Record<string, unknown>): Exercise | null {
  for (const e of unlockedExercises(course, completed)) if (!completed[e.id]) return e
  return null
}
