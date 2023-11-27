import type EleventyImage from '@11ty/eleventy-img'
import type { Orientation, Dimension, Image } from './types'
import type Device from './device'
import type Sizes from './sizes'
import MediaQueries, { type MediaQueriesOptions } from './media-queries'

export interface QueryObject extends Dimension {
  images: Image[]
}

/**
 * A data structure that pairs media queries with appropriately-sized images
 * Media queries are based on the configured devices (@see {@link Device}).
 */
export default class QueryMap implements Record<Orientation, QueryObject[]> {
  readonly landscape: QueryObject[] = []
  readonly portrait: QueryObject[] = []

  constructor(devices: Device[], sizes: Sizes) {
    const sharedSizes = devices.reduce((shared, d) => {
      const key = `${d.w},${d.h}`
      const s = shared.get(key) || []
      s.push(d)
      return shared.set(key, s)
    }, new Map<string, Device[]>())

    for (const devices of sharedSizes.values()) {
      const d = devices[0]
      this[d.orientation].push({
        w: d.w,
        h: d.h,
        images: devices
          .sort((a, b) => b.dppx - a.dppx)
          .map(d => d.getImage(sizes)),
      })
    }

    this.landscape = this.landscape.sort((a, b) => b.w - a.w)
    this.portrait = this.portrait.sort((a, b) => b.w - a.w)
  }

  /** @returns the widths of images used in this QueryMap */
  getImageWidths({
    orientations = ['landscape', 'portrait'],
  }: { orientations?: Orientation[] } = {}): number[] {
    return orientations
      .reduce<QueryObject[]>((queries, o) => queries.concat(this[o]), [])
      .reduce((widths: number[], queries) => {
        return widths.concat(queries.images.map(img => img.w))
      }, [])
  }

  toMediaQueries(
    metadata: EleventyImage.MetadataEntry[],
    options: MediaQueriesOptions
  ): MediaQueries {
    return new MediaQueries(metadata, this, options)
  }
}
