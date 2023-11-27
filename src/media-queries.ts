import type EleventyImage from '@11ty/eleventy-img'
import type QueryMap from './query-map'
import { isOrientation, type Orientation } from './types'
import { permute } from './utilities'
import { css } from './syntax'

export interface MediaQuery {
  orientation: Orientation | false
  maxWidth?: number | false
  minWidth?: number | false
  maxResolution?: number | false
  minResolution?: number | false
  url: string
  sourceType: string
  format: string
}

export interface ImageSource {
  /** pixel density only, string list of srcs and dppx */
  srcset?: string
  type: string
  media: string
}

export interface ImageSet {
  image: string
  dppx?: number
  type?: string
}

export type ImageSetMap = Map<string, ImageSet[]>

export interface MediaQueriesOptions {
  orientations?: Orientation[]
}

export default class MediaQueries {
  readonly queries: MediaQuery[] = []

  constructor(
    metadata: EleventyImage.MetadataEntry[],
    queries: QueryMap,
    { orientations = ['landscape', 'portrait'] }: MediaQueriesOptions
  ) {
    const metaCache: Record<number, EleventyImage.MetadataEntry[]> = {}
    const metaWidths = metadata
      .sort((a, b) => b.width - a.width)
      .reduce((map, m) => {
        const sameWidth = map.get(m.width) || []
        return map.set(m.width, [...sameWidth, m])
      }, new Map<number, EleventyImage.MetadataEntry[]>())
    const metaWidthsEntries = Array.from(metaWidths.entries())

    for (const o of orientations) {
      if (!isOrientation(o)) {
        // eslint-disable-next-line no-console
        console.warn(`Unrecognized orientation "${o}", skipping`)
        continue
      }
      const orientation = orientations.length > 1 && o

      queries[o].forEach(({ w, images }, i, queries) => {
        const next = queries[i + 1]
        const maxWidth = i > 0 && w,
          minWidth = next && next.w

        images.forEach((image, j, images) => {
          const next = images[j + 1]
          let imageMeta: EleventyImage.MetadataEntry[] | undefined =
            metaWidths.get(image.w)
          if (imageMeta === undefined) {
            imageMeta = metaWidthsEntries[0][1]
            for (let i = 1, l = metaWidthsEntries.length; i < l; i++) {
              const [mWidth, m] = metaWidthsEntries[i]
              const [nextWidth, next] = metaWidthsEntries[i + 1] || []
              if (mWidth >= image.w && (!next || nextWidth < image.w)) {
                imageMeta = m
                break
              }
            }
            metaCache[image.w] = imageMeta
          }
          this.queries.push(
            ...imageMeta.map<MediaQuery>(({ url, sourceType, format }) => ({
              orientation,
              maxWidth,
              minWidth,
              maxResolution: j > 0 && image.dppx,
              minResolution: next && next.dppx,
              url,
              sourceType,
              format,
            }))
          )
        })
      })
    }
  }

  #imageSet?: ImageSetMap

  /**
   * a map of media query selectors and the images used for image-set within a given selector.
   */
  get imageSet(): ImageSetMap {
    this.#imageSet ??= this.queries.reduce((map, q) => {
      const andQueries: string[] = []
      const orQueries: string[][] = []

      if (q.orientation) {
        andQueries.push(css`(orientation: ${q.orientation})`)
      }
      if (q.maxWidth) {
        andQueries.push(css`(max-width: ${q.maxWidth}px)`)
      }
      if (q.minWidth) {
        orQueries.push([css`(min-width: ${q.minWidth + 1}px)`])
      }

      if (q.maxResolution || q.minResolution) {
        const resolutions: string[] = []
        if (q.maxResolution) {
          resolutions.push(css`(max-resolution: ${q.maxResolution * 96}dpi)`)
        }
        if (q.minResolution) {
          resolutions.push(
            css`(min-resolution: ${q.minResolution * 96 + 1}dpi)`
          )
        }
        orQueries.push([resolutions.join(' and ')])
      }

      const selectors = permute(orQueries)
        .map(set => [...andQueries, ...set].join(' and '))
        .join(', ')

      const images = map.get(selectors) || []
      images.push({
        image: q.url,
        type: q.sourceType,
        // dppx: q.maxResolution || undefined,
      })

      return map.set(selectors, images)
    }, new Map<string, ImageSet[]>())

    return this.#imageSet
  }

  toCss(selector: string): string {
    return Array.from(this.imageSet.entries())
      .map<string>(([selectors, images]) => {
        if (images.length === 1)
          return css`
            @media ${selectors} {
              ${selector} {
                background-image: url('${images[0].image}');
              }
            }
          `

        const imageSet = `image-set(${images
          .map(({ image, type }) => `url('${image}') type('${type}')`)
          .join(', ')})`
        const fallback = images.reduce(
          (fallback, img) =>
            img.dppx && fallback.dppx && img.dppx < fallback.dppx
              ? img
              : fallback,
          images[images.length - 1]
        )
        return css`
          @media ${selectors} {
            ${selector} {
              background-image: ${imageSet};
            }
            @supports not (background-image: ${imageSet}) {
              ${selector} {
                background-image: url('${fallback.image}');
              }
            }
          }
        `
          .replace(/\s+/g, ' ')
          .trim()
      })
      .join('\n')
  }
}
