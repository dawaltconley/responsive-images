import type { ImageOptions, Metadata, MetadataEntry } from '@11ty/eleventy-img'
import type { Image as ImageTarget } from './types'
import type { MediaQuery, MediaQueriesOptions } from './media-queries'
import type Sizes from './sizes'
import type Image from './image'
import Device from './device'
import MediaQueries from './media-queries'
import { filterSizes, groupBy } from './utilities'

export default class DeviceSizes {
  readonly sizes: Sizes
  readonly devices: Device[]
  readonly landscape: number[]
  readonly portrait: number[]
  readonly targets: ImageTarget[]

  constructor(sizes: Sizes, devices: Device[]) {
    this.sizes = sizes
    this.devices = [...devices].sort(Device.sort)
    this.landscape = this.devices
      .map((d, i) => (d.orientation === 'landscape' ? i : null))
      .filter((n): n is number => n !== null)
    this.portrait = this.devices
      .map((d, i) => (d.orientation === 'portrait' ? i : null))
      .filter((n): n is number => n !== null)
    this.targets = this.devices.map(d => d.getImage(sizes))
  }

  groupBySize(devices: number[]): number[][] {
    return groupBy(devices, d => {
      const { w, h } = this.devices[d]
      return `${w},${h}`
    })
  }

  async resize(
    image: Image,
    { minScale, ...options }: ImageOptions & { minScale?: number } = {}
  ): Promise<Metadata> {
    const { width: maxWidth } = await image.stat()
    const widths = filterSizes(
      this.targets
        .map(img => img.w)
        .filter(w => w <= maxWidth)
        .sort((a, b) => b - a),
      minScale
    )
    return image.resize({ widths, ...options })
  }

  /** @returns a MetadataEntry array where the index of each set corresponds to a device/target */
  mapMetadata(metadata: Metadata): MetadataEntry[][] {
    const entries: MetadataEntry[] = Object.values(metadata)
      .flat()
      .sort((a, b) => b.width - a.width)
    const metaWidths = entries.reduce((map, m) => {
      const sameWidth = map.get(m.width) || []
      return map.set(m.width, [...sameWidth, m])
    }, new Map<number, MetadataEntry[]>())
    const metaWidthsEntries = Array.from(metaWidths.entries())

    return this.targets.map<MetadataEntry[]>(target => {
      const exactMatch = metaWidths.get(target.w)
      if (exactMatch) return exactMatch
      for (let i = 1, l = metaWidthsEntries.length; i < l; i++) {
        const [mWidth, m] = metaWidthsEntries[i]
        const [nextWidth, next] = metaWidthsEntries[i + 1] || []
        if (mWidth >= target.w && (!next || nextWidth < target.w)) {
          return m
        }
      }
      return metaWidthsEntries[0][1]
    })
  }

  toMediaQueries(
    metadata: Metadata,
    { orientations = ['landscape', 'portrait'] }: MediaQueriesOptions
  ): MediaQueries {
    const queries: MediaQuery[] = []
    const map = this.mapMetadata(metadata)

    for (const o of orientations) {
      const orientation = orientations.length > 1 && o
      this.groupBySize(this[o] ?? []).forEach((size, i, sizes) => {
        const current = this.devices[size[0] ?? -1]
        const next = this.devices[sizes[i + 1]?.[0]]
        const maxWidth = i > 0 && current?.w
        const minWidth = next && next?.w

        size.forEach((d, j, devices) => {
          const current = this.devices[d]
          const next = this.devices[devices[j + 1]]
          const maxResolution = j > 0 && current.dppx
          const minResolution = next && next.dppx

          queries.push(
            ...map[d].map<MediaQuery>(({ url, sourceType, format }) => ({
              orientation,
              maxWidth,
              minWidth,
              maxResolution,
              minResolution,
              url,
              sourceType,
              format,
            }))
          )
        })
      })
    }

    return new MediaQueries(queries)
  }
}
