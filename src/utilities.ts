import type { Dimension, Image } from './types'
import { isDimension, isDimensionArray } from './types'
import type { SizesQuery } from './sizes'
import UnitValue from './unit-values'
import Device from './device'

/**
 * Takes a parsed img sizes attribute and a specific device,
 * returning the image dimensions needed to support that device.
 *
 * @return unique widths that will need to be produced for the given device
 */
export function deviceImages(sizes: SizesQuery[], device: Device): Image[] {
  let imgWidth: UnitValue = new UnitValue(100, 'vw') // fallback to 100vw if no queries apply; this is the browser default

  whichSize: for (const { conditions, width } of sizes) {
    for (const condition of conditions) {
      const match = device.matches(condition)
      if (!match) continue whichSize
    }
    imgWidth = width
    break whichSize // break loop when device matches all conditions
  }

  if (imgWidth.unit === 'vh') {
    throw new Error(
      `Invalid unit in sizes query: ${imgWidth}\nOnly vw and px are supported.`
    )
  }

  const pixelWidth = imgWidth.toPixels(device)
  const needImages: Image[] = device.dppx.map(dppx => ({
    w: Math.ceil(pixelWidth * dppx),
    dppx,
    orientation: device.orientation,
  }))

  if (device.flip)
    needImages.push(
      ...deviceImages(
        sizes,
        new Device({
          ...device,
          w: device.h,
          h: device.w,
          flip: false,
        })
      )
    )

  return needImages
}

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
