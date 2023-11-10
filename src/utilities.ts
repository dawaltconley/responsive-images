import type EleventyImage from '@11ty/eleventy-img'
import type {
  Orientation,
  UnitValue,
  Dimension,
  Device,
  SizesQuery,
  MediaCondition,
  ImageSize,
  Image,
  QueryMap,
  ImageSet,
  SassQuery,
} from './types'

import {
  isUnit,
  isDimension,
  isDimensionArray,
  isOrientation,
  isMediaFeature,
} from './types'
import mediaParser from 'postcss-media-query-parser'
import defaultDevices from './data/devices'
import { css } from './syntax'

/** @constant used for parsing a CSS value */
const valueRegex = /([\d.]+)(\D*)/

/** Parses a string as a value with an optional unit. */
const cssValue = (v: string): UnitValue => {
  let value = v,
    unit = ''
  const match = v.match(valueRegex)
  if (match) [, value, unit] = match
  if (!unit) unit = 'px'
  if (!isUnit(unit))
    throw new Error(`Invalid unit: ${unit}\nOnly vw, vh, and px are supported.`)
  return [Number(value), unit]
}

/**
 * Takes a parsed img sizes attribute and a specific device,
 * returning the image dimensions needed to support that device.
 *
 * @param sizes
 * @param device - object representing an expected device
 * @param order - whether the widths should be interpreted as 'min' or 'max'
 * @return unique widths that will need to be produced for the given device
 */
function deviceImages(
  sizes: SizesQuery[],
  device: Device /* , order: SizesQuery.Order */
): Image[] {
  let imgSize: ImageSize = { width: '100vw' } // fallback to 100vw if no queries apply; this is the browser default
  const orientation: Orientation =
    device.w >= device.h ? 'landscape' : 'portrait'

  whichSize: for (const { conditions, size } of sizes) {
    for (const { mediaFeature, value: valueString } of conditions) {
      const [value, unit]: [number, string] = cssValue(valueString)
      if (unit !== 'px')
        throw new Error(`Invalid query unit ${unit}: only px is supported`)
      const match: boolean =
        (mediaFeature === 'min-width' && device.w >= value) ||
        (mediaFeature === 'max-width' && device.w <= value) ||
        (mediaFeature === 'min-height' && device.h >= value) ||
        (mediaFeature === 'max-height' && device.h <= value)
      if (!match) continue whichSize
    }
    imgSize = size
    break whichSize // break loop when device matches all conditions
  }

  let [scaledWidth, unit = 'px'] = cssValue(imgSize)
  if (unit === 'vw') {
    scaledWidth = (device.w * scaledWidth) / 100
  } else if (unit !== 'px') {
    throw new Error(
      `Invalid unit in sizes query: ${unit}\nOnly vw and px are supported.`
    )
  }

  const needImages: Image[] = []
  const { dppx } = device
  if (dppx.indexOf(1) < 0) dppx.push(1) // always include a dppx value of one for queries, to avoid upscaling when screen resizes on larger 1dppx displays. TODO any way I can require this as part of the type?

  dppx.forEach(dppx => {
    // TODO handle flipping here...
    needImages.push({
      w: Math.ceil(scaledWidth * dppx),
      dppx,
      orientation,
    })
  })

  if (device.flip)
    needImages.push(
      ...deviceImages(sizes, {
        ...device,
        w: device.h,
        h: device.w,
        flip: false,
      })
    )

  return needImages
}

/**
 * @param sizesQueryString - a string representation of a valid img 'sizes' attribute
 * @returns an array of dimensions, which represent image copies that should be produced to satisfy these sizes.
 */

function widthsFromSizes(
  sizesQueryString: string,
  opt?: {
    devices?: Device[]
    // order?: Order
    minScale?: number
  }
): number[] {
  const { devices = defaultDevices, minScale } = opt || {}
  const sizes = parseSizes(sizesQueryString)

  const needWidths: Set<number> = devices.reduce((all, device) => {
    deviceImages(sizes, device).forEach(n => all.add(n.w), all)
    return all
  }, new Set<number>())

  const widthsArray: number[] = Array.from(needWidths)

  return filterSizes(widthsArray, minScale)
}

function queriesFromSizes(
  sizesQueryString: string,
  opt?: {
    devices?: Device[]
    // order?: Order
    // minScale?: number
  }
): QueryMap {
  const { devices = defaultDevices } = opt || {}
  const sizes = parseSizes(sizesQueryString)

  const queries: QueryMap = {
    landscape: [],
    portrait: [],
  }

  devices.forEach(device => {
    const images: Record<Orientation, Image[]> = {
      landscape: [],
      portrait: [],
    }
    deviceImages(sizes, device)
      .sort((a, b) => b.dppx - a.dppx)
      .forEach(img => images[img.orientation].push(img))
    if (images.landscape.length)
      queries.landscape.push({
        w: device.w,
        h: device.h,
        images: images.landscape,
      })
    if (images.portrait.length)
      queries.portrait.push({
        w: device.h,
        h: device.w,
        images: images.portrait,
      })
  })

  queries.landscape = queries.landscape.sort((a, b) => b.w - a.w)
  queries.portrait = queries.portrait.sort((a, b) => b.w - a.w)

  return queries // this works, just need to filter
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

/**
 * Parses the value of the img element's sizes attribute.
 *
 * @param sizesQueryString - a string representation of a valid img 'sizes' attribute
 * @return an array of SizesQuery.Object objects describing media query parameters
 */
function parseSizes(sizesQueryString: string): SizesQuery[] {
  return sizesQueryString
    .split(/\s*,\s*/)
    .map<SizesQuery>((descriptor: string) => {
      const conditions: MediaCondition[] = []
      const parsed = descriptor.match(/^(.*)\s+(\S+)$/) // TODO get this from parser instead; last node in media-query
      if (!parsed) return { conditions, size: { width: descriptor } }

      const [, mediaCondition, width] = parsed
      if (mediaCondition) {
        // TODO handle expressions wrapped in extra parenthesis
        const mediaQuery = mediaParser(mediaCondition).nodes[0]
        for (const node of mediaQuery.nodes) {
          if (node.type === 'media-feature-expression') {
            const mediaFeature = node.nodes.find(
              n => n.type === 'media-feature'
            )?.value
            const value = node.nodes.find(n => n.type === 'value')?.value
            if (mediaFeature && isMediaFeature(mediaFeature) && value) {
              // mediaFeature should always be truthy. value is only falsy with boolean media features, which in our case can be safely ignored.
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
      return { conditions, size: { width } }
    })
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

export {
  widthsFromSizes,
  queriesFromSizes,
  parseSizes,
  deviceImages,
  filterSizes,
}
