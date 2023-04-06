import type { Orientation, Dimension } from './common'

/** represents a media query condition, such as `(min-width: 600px)` */
export interface MediaCondition {
  /** type of media query; usually 'min-width' or 'max-width' */
  mediaFeature: string

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
