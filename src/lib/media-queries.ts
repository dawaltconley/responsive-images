import { type Orientation } from './common'
import { permute } from './utilities'
import { css } from './syntax'

// export interface MediaQuery {
//   orientation?: Orientation | false
//   maxWidth?: number | false
//   minWidth?: number | false
//   maxResolution?: number | false
//   minResolution?: number | false
//   url: string
//   sourceType: string
//   format: string
// }

export interface MediaQuery {
  orientation?: Orientation | false
  maxWidth?: number | false
  minWidth?: number | false
  // maxHeight?: number | false
  // minHeight?: number | false
  images: ImageSet[]
}

// interface Image {
//   source: string
//   type: string
// }

export interface ImageSource {
  // /** pixel density only, string list of srcs and dppx */
  srcSet: string
  type?: string
  media: string
}

export interface ImageSet {
  image: string
  dppx?: number
  type?: string
}

// benefit of separating out a function:
// 1. keep private, minimize api exposure
// 2. abstracting allows me to optimize queries for sources easily.
//    same logic but just delete minWidth and minResolution before
//    passing to the function.

// function makeQueryMap(queries: MediaQuery[]): Map<string, ImageSet[]> {
//   return queries.reduce((map, q) => {
//     const andQueries: string[] = []
//     const orQueries: string[][] = []
//
//     if (q.orientation) {
//       andQueries.push(css`(orientation: ${q.orientation})`)
//     }
//     if (q.maxWidth) {
//       andQueries.push(css`(max-width: ${q.maxWidth}px)`)
//     }
//     if (q.minWidth) {
//       orQueries.push([css`(min-width: ${q.minWidth + 1}px)`])
//     }
//
//     if (q.maxResolution || q.minResolution) {
//       const resolutions: string[] = []
//       if (q.maxResolution) {
//         resolutions.push(css`(max-resolution: ${q.maxResolution * 96}dpi)`)
//       }
//       if (q.minResolution) {
//         resolutions.push(css`(min-resolution: ${q.minResolution * 96 + 1}dpi)`)
//       }
//       orQueries.push([resolutions.join(' and ')])
//     }
//
//     const selectors = permute(orQueries)
//       .map(set => [...andQueries, ...set].join(' and '))
//       .join(', ')
//
//     const images = map.get(selectors) || []
//     images.push({
//       image: q.url,
//       type: q.sourceType,
//       // dppx: q.maxResolution || undefined,
//     })
//
//     return map.set(selectors, images)
//   }, new Map<string, ImageSet[]>())
// }

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
      if (q.maxHeight) {
        andQueries.push(css`(max-height: ${q.maxHeight}px)`)
      }
      if (q.minHeight) {
        orQueries.push([css`(min-height: ${q.minHeight + 1}px)`])
      }

      console.log(orQueries, permute(orQueries))

      const selectors = permute(orQueries)
        .map(set => [...andQueries, ...set].join(' and '))
        .join(', ')

      return map.set(selectors, q.images) // doesn't need to be a map
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
          .map(({ image, dppx, type }) => {
            const options = [`url('${image}')`]
            if (/* !noDppx && */ dppx) {
              options.push(`${dppx}x`)
            }
            if (/* !noTypes && */ type) {
              options.push(`type('${type}')`)
            }
            return options.join(' ')
          })
          .join(', ')})`

        return css`
          @media ${selectors} {
            ${selector} {
              background-image: ${imageSet};
            }
          }
        `
          .replace(/\s+/g, ' ')
          .trim()
      })
      .join('\n')
  }

  toSources(): ImageSource[] {
    // this could be compressed by removing the min queries, only using max
    // since you don't have to worry about overlapping queries with <picture> element
    return Array.from(this.imageSet.entries()).reduce<ImageSource[]>(
      (sources, [selectors, images]) => {
        const byFormat = images.reduce((map, { image, type, dppx }) => {
          const sources = map.get(type) || []
          sources.push({ image, dppx })
          return map.set(type, sources)
        }, new Map<string | undefined, ImageSet[]>())
        return sources.concat(
          Array.from(byFormat).map<ImageSource>(([type, sources]) => ({
            type,
            media: selectors,
            srcSet:
              sources.length > 1
                ? sources
                    .map(({ image, dppx = '1' }) => `${image} ${dppx}x`)
                    .join(' ')
                : `${sources[0].image}`,
          })),
          // images.map<ImageSource>(({image, type, dppx}) => ({
          //   srcSet: image,
          //   type,
          //
          //   media: selectors,
          // })),
        )
      },
      [],
    )
  }
}
