import type { Image } from './types'
import type Device from './device'
import mediaParser from 'postcss-media-query-parser'
import UnitValue from './unit-values'
import QueryMap from './query-map'
import { filterSizes } from './utilities'

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
  value: UnitValue<'px'>
}

/**
 * represents a valid rule for the img sizes attribute,
 * such as `(min-width: 600px) 400px` or `100vw`
 */
export interface SizesQuery {
  /** the conditions under which a sizes rule applies */
  conditions: MediaCondition[]

  /** the image width applied under these conditions */
  width: UnitValue
}

export default class Sizes {
  readonly string: string
  readonly queries: SizesQuery[]

  constructor(sizes: string) {
    this.string = sizes
    this.queries = Sizes.parse(sizes)
  }

  toString(): string {
    return this.string
  }

  getImages(devices: Device[]): Image[] {
    return devices.map(d => d.getImage(this))
  }

  /**
   * @returns an array of dimensions, which represent image copies that should be produced to satisfy these sizes.
   */
  toWidths(
    devices: Device[],
    { minScale }: { minScale?: number } = {}
  ): number[] {
    const needWidths = new Set<number>(devices.map(d => d.getImage(this).w))
    return filterSizes(Array.from(needWidths), minScale)
  }

  toQueries(devices: Device[]): QueryMap {
    return new QueryMap(devices, this)
  }

  /**
   * Parses the value of the img element's sizes attribute.
   *
   * @param sizesQueryString - a string representation of a valid img 'sizes' attribute
   * @return an array of SizesQuery.Object objects describing media query parameters
   */
  static parse(sizesQueryString: string): SizesQuery[] {
    return sizesQueryString
      .split(/\s*,\s*/)
      .map<SizesQuery>((descriptor: string) => {
        const conditions: MediaCondition[] = []
        const parsed = descriptor.match(/^(.*)\s+(\S+)$/) // TODO get this from parser instead; last node in media-query
        if (!parsed) return { conditions, width: UnitValue.parse(descriptor) }

        const [, mediaCondition, widthString]: string[] = parsed
        const width = UnitValue.parse(widthString)
        if (mediaCondition) {
          // TODO handle expressions wrapped in extra parenthesis
          const mediaQuery = mediaParser(mediaCondition).nodes[0]
          for (const node of mediaQuery.nodes) {
            if (node.type === 'media-feature-expression') {
              const mediaFeature = node.nodes.find(
                n => n.type === 'media-feature'
              )?.value
              const valueString = node.nodes.find(
                n => n.type === 'value'
              )?.value
              if (mediaFeature && isMediaFeature(mediaFeature) && valueString) {
                // mediaFeature should always be truthy. value is only falsy with boolean media features, which in our case can be safely ignored.
                const value = UnitValue.parse(valueString)
                if (!value.uses('px'))
                  throw new Error(
                    `Invalid query unit ${value}: only px is supported`
                  )
                conditions.push({ mediaFeature, value })
              }
            } else if (node.type === 'keyword') {
              // } else if (node.type === 'keyword' && node.value === 'and') {
              // continue // TODO wouldn't be valid sizes attribute, but regardless this doesn't work
              // // maybe parse with cssValue here?

              if (node.value === 'and' || node.value === 'only') {
                // ignore; add next valid node to the conditions list
                continue
              } else if (node.value === 'not') {
                // TODO handle not
                // eslint-disable-next-line no-console
                console.warn(`not keyword is not yet handled; ignoring`)
                continue
              } else {
                throw new Error(`invalid media query keyword: ${node.value}`)
              }
            } else if (node.type === 'media-type') {
              if (node.value === 'all')
                // ignore; all is the only valid media-type
                continue
              else
                throw new Error(
                  `media type ${node.value} cannot be used in a sizes attribute`
                )
            } else {
              // eslint-disable-next-line no-console
              console.error(node)
              throw new Error('unhandled node type')
            }
          }
        }
        return { conditions, width }
      })
  }
}
