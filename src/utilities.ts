import type { ResizeInstructions } from './types'
import type { ConfiguredImage, ImageOptions } from './image'
import type Image from './image'
import type DeviceSizes from './device-sizes'
import type Metadata from './metadata'

/**
 * Filters a dimensions list, returning only dimensions that meet a threshold for downsizing.
 *
 * @param list - An array of items.
 * @param factor - The maximum value for downscaling; i.e. 0.8 means any values that reduce an images pixels by less than 20% will be removed from the list.
 * @param calculate - The function to calculate the value of each item for comparison. By default it tries to square numbers and fails on non-numbers.
 * @return filtered array of dimensions
 */

export function filterSizes<T>(
  list: T[],
  factor?: number,
  calculate: (item: T) => number = filterFallback
): T[] {
  // sort list from large to small
  const sorted = [...list].sort((a, b) => calculate(b) - calculate(a))
  if (!factor) return sorted
  const filtered: T[] = []
  for (let i = 0, j = 1; i < sorted.length; j++) {
    const a = sorted[i],
      b = sorted[j]
    if (a && b === undefined) {
      filtered.push(a)
      break
    }
    const scale = calculate(b) / calculate(a)
    if (Number.isNaN(scale) || scale < factor) {
      filtered.push(a)
      i = j
    }
  }
  return filtered
}

const filterFallback = (n: unknown): number =>
  typeof n === 'number' ? n * n : -Infinity

export type ResizeFromSizesOptions = ImageOptions & { minScale?: number }

export async function resizeFromSizes(
  image: Image | ConfiguredImage,
  devices: DeviceSizes,
  { minScale, ...options }: ResizeFromSizesOptions = {}
): Promise<Metadata> {
  const { width, height } = await image.stat()
  const scalingFactor =
    minScale ?? ('scalingFactor' in image ? image.scalingFactor : undefined)

  const widths = filterSizes(
    devices.targets
      .map(target => Math.ceil(instructionsToWidth(target, width / height)))
      .filter(w => w <= width),
    scalingFactor
  )

  return image.resize({ widths, ...options })
}

export function instructionsToWidth(
  resize: ResizeInstructions<number>,
  aspect: number
): number {
  if ('fit' in resize) {
    const resizeAspect = resize.width / resize.height
    if (resize.fit === 'cover') {
      // if instructions are wider than image, use instruction width; if instructions are taller than image, use instruction height
      return resizeAspect > aspect ? resize.width : resize.height * aspect
    } else {
      // if instructions are wider than image, use instruction height; if instructions are taller than image, use instruction width
      return resizeAspect < aspect ? resize.width : resize.height * aspect
    }
  } else if ('height' in resize) {
    return resize.height * aspect
  } else {
    return resize.width
  }
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
