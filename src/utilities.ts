import type { Dimension } from './types'
import { isDimension, isDimensionArray } from './types'

/**
 * Filters a dimensions list, returning only dimensions that meet a threshold for downsizing.
 *
 * @param list - an array of dimension objects
 * @param factor - the maximum value for downscaling; i.e. 0.8 means any values that reduce an images pixels by less than 20% will be removed from the list
 * @return filtered array of dimensions
 */
export function filterSizes(list: number[], factor?: number): number[]
export function filterSizes(list: Dimension[], factor?: number): Dimension[]
export function filterSizes(
  list: number[] | Dimension[],
  factor = 0.8
): number[] | Dimension[] {
  // sort list from large to small
  const sorted = isDimensionArray(list)
    ? [...list].sort((a, b) => b.w * b.h - a.w * a.h)
    : [...list].sort((a, b) => b - a)

  const filtered: (number | Dimension)[] = []
  for (let i = 0, j = 1; i < sorted.length; j++) {
    const a = sorted[i],
      b = sorted[j]
    if (a && !b) {
      filtered.push(a)
      break
    }
    const scale1 = (isDimension(b) ? b.w : b) / (isDimension(a) ? a.w : a)
    const scale2 = (isDimension(b) ? b.h : b) / (isDimension(a) ? a.h : a)
    if (scale1 * scale2 < factor) {
      filtered.push(a)
      i = j
    }
  }
  return filtered as number[] | Dimension[]
}

export const permute = <T>(
  matrix: T[][],
  permutations: T[][] = [],
  a: T[] = []
): T[][] => {
  if (a.length === matrix.length) {
    // if is matrix length, consider it a complete permutation and add it to perms
    permutations.push([...a])
    return permutations
  }
  const row = matrix[a.length]
  for (const item of row) permute(matrix, permutations, [...a, item]) // call function on each row
  return permutations
}

export function groupBy<T>(array: T[], cb: (item: T) => unknown): T[][] {
  const grouped = array.reduce((shared, item) => {
    const key = cb(item)
    const s = shared.get(key) || []
    s.push(item)
    return shared.set(key, s)
  }, new Map<unknown, T[]>())
  return Array.from(grouped.values())
}

export function findFrom<T>(
  array: T[],
  start: number,
  cb: (arg: T) => boolean
): T | undefined {
  for (let i = start; i < array.length; i++) {
    if (cb(array[i])) {
      return array[i]
    }
  }
}

export function findLastFrom<T>(
  array: T[],
  start: number,
  cb: (arg: T) => boolean
): T | undefined {
  for (let i = start; i > -1; i--) {
    if (cb(array[i])) {
      return array[i]
    }
  }
}
