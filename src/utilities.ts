import type EleventyImage from '@11ty/eleventy-img'
import type {
  Orientation,
  Dimension,
  Image,
  QueryMap,
  ImageSet,
  SassQuery,
} from './types'

import { isDimension, isDimensionArray, isOrientation } from './types'
import type { SizesQuery } from './sizes'
import UnitValue from './unit-values'
import Device from './device'
import { css } from './syntax'

/**
 * Takes a parsed img sizes attribute and a specific device,
 * returning the image dimensions needed to support that device.
 *
 * @return unique widths that will need to be produced for the given device
 */
function deviceImages(sizes: SizesQuery[], device: Device): Image[] {
  let imgWidth: UnitValue = new UnitValue(100, 'vw') // fallback to 100vw if no queries apply; this is the browser default

  whichSize: for (const { conditions, width } of sizes) {
    for (const condition of conditions) {
      const match = device.matches(condition)
      if (!match) continue whichSize
    }
    imgWidth = width
    break whichSize // break loop when device matches all conditions
  }

  let { value: pixelWidth, unit } = imgWidth
  if (unit === 'vw') {
    pixelWidth = (device.w * pixelWidth) / 100
  } else if (unit !== 'px') {
    throw new Error(
      `Invalid unit in sizes query: ${unit}\nOnly vw and px are supported.`
    )
  }

  const needImages: Image[] = []

  device.dppx.forEach(dppx => {
    // TODO handle flipping here...
    needImages.push({
      w: Math.ceil(pixelWidth * dppx),
      dppx,
      orientation: device.orientation,
    })
  })

  if (device.flip)
    needImages.push(
      ...deviceImages(
        sizes,
        new Device({
          ...device,
          w: device.h,
          h: device.w,
          flip: false,
        })
      )
    )

  return needImages
}

/**
 * Filters a dimensions list, returning only dimensions that meet a threshold for downsizing.
 *
 * @param list - an array of dimension objects
 * @param factor - the maximum value for downscaling; i.e. 0.8 means any values that reduce an images pixels by less than 20% will be removed from the list
 * @return filtered array of dimensions
 */
function filterSizes(list: number[], factor?: number): number[]
function filterSizes(list: Dimension[], factor?: number): Dimension[]
function filterSizes(
  list: number[] | Dimension[],
  factor = 0.8
): number[] | Dimension[] {
  // sort list from large to small
  const sorted = isDimensionArray(list)
    ? [...list].sort((a, b) => b.w * b.h - a.w * a.h)
    : [...list].sort((a, b) => b - a)

  const filtered: (number | Dimension)[] = []
  for (let i = 0, j = 1; i < sorted.length; j++) {
    const a = sorted[i],
      b = sorted[j]
    if (a && !b) {
      filtered.push(a)
      break
    }
    const scale1 = (isDimension(b) ? b.w : b) / (isDimension(a) ? a.w : a)
    const scale2 = (isDimension(b) ? b.h : b) / (isDimension(a) ? a.h : a)
    if (scale1 * scale2 < factor) {
      filtered.push(a)
      i = j
    }
  }
  return filtered as number[] | Dimension[]
}

interface GenerateMediaQueriesOptions {
  orientations?: Orientation[]
}

export const generateMediaQueries = (
  metadata: EleventyImage.MetadataEntry[],
  queries: QueryMap,
  { orientations = ['landscape', 'portrait'] }: GenerateMediaQueriesOptions
): SassQuery[] => {
  const mediaQueries: SassQuery[] = []
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
        mediaQueries.push(
          ...imageMeta.map<SassQuery>(({ url, sourceType, format }) => ({
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

  return mediaQueries
}

export const permute = <T>(
  matrix: T[][],
  permutations: T[][] = [],
  a: T[] = []
): T[][] => {
  if (a.length === matrix.length) {
    // if is matrix length, consider it a complete permutation and add it to perms
    permutations.push([...a])
    return permutations
  }
  const row = matrix[a.length]
  for (const item of row) permute(matrix, permutations, [...a, item]) // call function on each row
  return permutations
}

/**
 * @returns a map of media query selectors and the images used for image-set within a given selector.
 */
export const toMediaQueryMap = (
  queries: SassQuery[]
): Map<string, ImageSet[]> =>
  queries.reduce((map, q) => {
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
        resolutions.push(css`(min-resolution: ${q.minResolution * 96 + 1}dpi)`)
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

export const queriesToCss = (
  selector: string,
  queryMap: Map<string, ImageSet[]>
): string =>
  Array.from(queryMap.entries())
    .map(([selectors, images]) => {
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

export { deviceImages, filterSizes }
