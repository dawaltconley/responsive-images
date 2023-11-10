import type {
  Orientation,
  Dimension,
  Device,
  SizesQuery,
  MediaCondition,
  Image,
  QueryMap,
} from './types'

import { isMediaFeature } from './types'
import mediaParser from 'postcss-media-query-parser'
import defaultDevices from './data/devices'

/** @constant used for parsing a CSS value */
const valueRegex = /([\d.]+)(\D*)/

/** Parses a string as a value with an optional unit. */
const cssValue = (v: string): [number, string] => {
  let value = v,
    unit = ''
  const match = v.match(valueRegex)
  if (match) [, value, unit] = match
  return [Number(value), unit]
}

const isDimension = (object: unknown): object is Dimension =>
  !!object &&
  typeof object === 'object' &&
  'w' in object &&
  'h' in object &&
  !('dppx' in object)

const isDimensionArray = (objects: unknown[]): objects is Dimension[] =>
  objects.every(isDimension)

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
  let imgWidth = '100vw' // fallback to 100vw if no queries apply; this is the browser default
  const orientation: Orientation =
    device.w >= device.h ? 'landscape' : 'portrait'

  whichSize: for (const { conditions, width } of sizes) {
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
    imgWidth = width
    break whichSize // break loop when device matches all conditions
  }

  let [scaledWidth, unit = 'px'] = cssValue(imgWidth)
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
      if (!parsed) return { conditions, width: descriptor }

      const [, mediaCondition, width]: string[] = parsed
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
      return { conditions, width }
    })
}

export {
  widthsFromSizes,
  queriesFromSizes,
  parseSizes,
  deviceImages,
  filterSizes,
}
