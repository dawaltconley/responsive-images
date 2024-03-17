import type { MetadataEntry } from '@11ty/eleventy-img'
import type { ResizeInstructions } from './common'
import type { MediaQuery, MediaQueriesOptions } from './media-queries'
import type Image from './image'
import type Metadata from './metadata'
import Sizes from './sizes'
import Device from './device'
import MediaQueries, { type ImageSet } from './media-queries'
import {
  instructionsToWidth,
  resizeFromSizes,
  ResizeFromSizesOptions,
} from './utilities'
import groupBy from 'lodash.groupby'

export default class DeviceSizes {
  readonly sizes: Sizes
  readonly devices: Device[]
  readonly targets: ResizeInstructions<number>[]
  readonly landscape: number[]
  readonly portrait: number[]

  constructor(sizes: string | Sizes, devices: Device[]) {
    this.sizes = typeof sizes === 'string' ? new Sizes(sizes) : sizes
    this.devices = [...devices].sort(Device.sort)
    this.targets = this.devices.map(d => d.getImage(this.sizes))

    const { landscape, portrait } = groupBy(
      this.devices.map((_d, i) => i),
      i => this.devices[i].orientation,
    )
    this.landscape = landscape
    this.portrait = portrait
  }

  groupBySize(devices: number[]): number[][] {
    return Object.values(
      groupBy(devices, d => {
        const { w, h } = this.devices[d]
        return `${w},${h}`
      }),
    )
  }

  async resize(
    image: Image,
    options: ResizeFromSizesOptions = {},
  ): Promise<Metadata> {
    return resizeFromSizes(image, this, options)
  }

  /**
   * Assumes that all entries in the Metadata object have the same-ish aspect ratio.
   * Won't work if any of the entries have been cropped.
   * @returns a MetadataEntry array where the index of each set corresponds to a device/target
   */
  mapMetadata({ metadata }: Metadata): MetadataEntry[][] {
    const byWidth = Object.values(
      groupBy(Object.values(metadata).flat(), ({ width }) => width),
    ).sort((a, b) => b[0].width - a[0].width)

    return this.targets.map<MetadataEntry[]>(target => {
      for (let i = 1, l = byWidth.length; i < l; i++) {
        const { width, height } = byWidth[i][0]
        const next = byWidth[i + 1]?.[0]
        const targetWidth = Math.ceil(
          instructionsToWidth(target, width / height),
        )
        if (width >= targetWidth && (!next || next.width < targetWidth)) {
          return byWidth[i]
        }
      }
      return byWidth[0]
    })
  }

  toMediaQueries(
    metadata: Metadata,
    { orientations = ['landscape', 'portrait'] }: MediaQueriesOptions = {},
  ): MediaQueries {
    const queries: MediaQuery[] = []
    const metaMap = this.mapMetadata(metadata)

    for (const o of orientations) {
      const orientation = orientations.length > 1 && o
      this.groupBySize(this[o] ?? []).forEach((size, i, sizes) => {
        const current = this.devices[size[0]]
        const next = this.devices[sizes[i + 1]?.[0]]
        const maxWidth = i > 0 && current?.w
        const minWidth = next && next?.w

        queries.push({
          orientation,
          maxWidth,
          minWidth,
          images: size.reduce<ImageSet[]>((images, d) => {
            // const current = this.devices[d]
            // const next = this.devices[devices[j + 1]]

            return images.concat(
              ...metaMap[d].map<ImageSet>(({ url, sourceType }) => ({
                image: url,
                type: sourceType,
                dppx: this.devices[d].dppx,
              })),
            )

            // const maxResolution = j > 0 && current.dppx
            // const minResolution = next && next.dppx

            // queries.push(
            //   ...metaMap[d].map<MediaQuery>(({ url, sourceType, format }) => ({
            //     orientation,
            //     maxWidth,
            //     minWidth,
            //     // maxResolution,
            //     // minResolution,
            //     // url,
            //     // sourceType,
            //     // format,
            //   })),
            // )
          }, []),
        })
      })
    }

    return new MediaQueries(queries)
  }
}
