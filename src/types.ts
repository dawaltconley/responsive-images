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

export interface Dimension {
  /** width */
  w: number

  /** height */
  h: number
}

export const isDimension = (object: unknown): object is Dimension =>
  !!object &&
  typeof object === 'object' &&
  'w' in object &&
  'h' in object &&
  !('dppx' in object)

export const isDimensionArray = (objects: unknown[]): objects is Dimension[] =>
  objects.every(isDimension)

export interface Image {
  /** width of an actual image */
  w: number

  /** device dppx at which this image size will apply */
  dppx: number

  /** device orientation in which this image will be used */
  orientation: Orientation

  /** if present treats this image as an alias for another image */
  use?: Omit<Image, 'use'>
}
