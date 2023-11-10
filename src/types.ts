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

/** represents a supported device */
export interface Device extends Dimension {
  /** possible dppx for devices with these dimensions */
  dppx: number[]

  /** whether the device can be rotated and the dimensions flipped */
  flip: boolean
}

export const MediaFeature = [
  'max-width',
  'max-height',
  'min-width',
  'min-height',
] as const
export type MediaFeature = (typeof MediaFeature)[number]

export const isMediaFeature = (s: string): s is MediaFeature =>
  MediaFeature.some(f => f === s)

/** represents a media query condition, such as `(min-width: 600px)` */
export interface MediaCondition {
  /** type of media query; usually 'min-width' or 'max-width' */
  mediaFeature: MediaFeature

  /** breakpoint where this applies */
  value: string
}

/**
 * represents a valid rule for the img sizes attribute,
 * such as `(min-width: 600px) 400px` or `100vw`
 */
export interface SizesQuery {
  /** the conditions under which a sizes rule applies */
  conditions: MediaCondition[]

  /** the image width applied under these conditions */
  width: string
}

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

export interface QueryObject extends Dimension {
  images: Image[]
}

/**
 * A data structure that pairs media queries with appropriately-sized images
 * Media queries are based on the configured devices (@see {@link Device}).
 */
export type QueryMap = Record<Orientation, QueryObject[]>

/** sent to sass mixin */
export interface SassQuery {
  orientation: Orientation | false
  maxWidth: number | boolean | undefined
  minWidth: number | boolean | undefined
  maxResolution: number | boolean | undefined
  minResolution: number | boolean | undefined
  url: string
  sourceType: string
  format: string
}
