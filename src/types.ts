const Orientation = ['landscape', 'portrait'] as const
type Orientation = (typeof Orientation)[number]

const isOrientation = (test: string): test is Orientation =>
  Orientation.includes(test as Orientation)

const Order = ['min', 'max'] as const
type Order = (typeof Order)[number]

const isOrder = (test: string): test is Order => Order.includes(test as Order)

export { Orientation, Order, isOrientation, isOrder }

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

import type { DeviceDefinition } from './device'
export type { DeviceDefinition as Device }

import type { MediaFeature, MediaCondition, SizesQuery } from './sizes'
export type { MediaFeature, MediaCondition, SizesQuery }

import type { QueryObject } from './query-map'
import type QueryMap from './query-map'
export type { QueryObject, QueryMap }

import type { ImageSet, ImageSource, MediaQuery } from './media-queries'
export type { ImageSet, ImageSource, MediaQuery as SassQuery }
