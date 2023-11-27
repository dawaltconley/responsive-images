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
    devices.forEach(device => {
      const images: Record<Orientation, Image[]> = {
        landscape: [],
        portrait: [],
      }
      sizes
        .getImages(device)
        .sort((a, b) => b.dppx - a.dppx)
        .forEach(img => images[img.orientation].push(img))
      if (images.landscape.length)
        this.landscape.push({
          w: device.w,
          h: device.h,
          images: images.landscape,
        })
      if (images.portrait.length)
        this.portrait.push({
          w: device.h,
          h: device.w,
          images: images.portrait,
        })
    })

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
