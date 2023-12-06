export const Orientation = ['landscape', 'portrait'] as const
export type Orientation = (typeof Orientation)[number]

export const isOrientation = (test: string): test is Orientation =>
  Orientation.includes(test as Orientation)

export const assertOrientation = (test: string): Orientation => {
  if (!isOrientation(test)) {
    throw new Error(`Invalid orientation: ${test}`)
  }
  return test
}

export const Order = ['min', 'max'] as const
export type Order = (typeof Order)[number]

export const isOrder = (test: string): test is Order =>
  Order.some(o => o === test)

export type SizeKeyword = 'cover' | 'contain'
export const isSizeKeyword = (str: string): str is SizeKeyword =>
  str === 'cover' || str === 'contain'

export type Dimension = 'width' | 'height'
export const isDimension = (str: string): str is Dimension =>
  str === 'width' || str === 'height'

import type { ImageFormatWithAliases } from '@11ty/eleventy-img'

export type ValidImageFormat = 'auto' | ImageFormatWithAliases | null

const validImageFormats: ValidImageFormat[] = [
  'webp',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'svg+xml',
  'avif',
  'auto',
  null,
]

export const isValidImageFormat = (
  test: string | null
): test is ValidImageFormat => validImageFormats.some(f => f === test)

export const assertValidImageFormat = (
  test: string | null
): ValidImageFormat => {
  if (!isValidImageFormat(test))
    throw new Error(`Invalid image format: ${test}`)
  return test
}

export type ResizeInstructions<T> =
  | { width: T }
  | { height: T }
  | { width: T; height: T; fit: SizeKeyword }

export interface Rect {
  /** width */
  w: number

  /** height */
  h: number
}

export const isRect = (object: unknown): object is Rect =>
  !!object &&
  typeof object === 'object' &&
  'w' in object &&
  'h' in object &&
  !('dppx' in object)

export const isRectArray = (objects: unknown[]): objects is Rect[] =>
  objects.every(isRect)
