import { type Orientation } from './common'
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

  constructor(queries: MediaQuery[]) {
    this.queries = queries
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
            css`(min-resolution: ${q.minResolution * 96 + 1}dpi)`,
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

        // TODO don't use image-set when there's only one type
        const imageSet = `image-set(${images
          .map(({ image, type }) => `url('${image}') type('${type}')`)
          .join(', ')})`
        const fallback = images.reduce(
          (fallback, img) =>
            img.dppx && fallback.dppx && img.dppx < fallback.dppx
              ? img
              : fallback,
          images[images.length - 1],
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
