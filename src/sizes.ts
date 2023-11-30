import type { Image } from './types'
import type Device from './device'
import { toAST, type MediaQuery, type MediaCondition } from 'media-query-parser'
import { ImageSize } from './unit-values'
import QueryMap from './query-map'
import { filterSizes } from './utilities'

/**
 * represents a valid rule for the img sizes attribute,
 * such as `(min-width: 600px) 400px` or `100vw`
 */
export interface SizesQuery {
  /**
   * the conditions under which a sizes rule applies
   * 'null' should be treated as 'all', true no matter what
   */
  conditions: MediaCondition | null

  /** the image width applied under these conditions */
  width: ImageSize
}

export default class Sizes {
  readonly string: string
  readonly queries: SizesQuery[]

  constructor(sizes: string) {
    this.string = sizes
    this.queries = Sizes.parse(sizes)
  }

  toString(): string {
    return this.string
  }

  getImages(devices: Device[]): Image[] {
    return devices.map(d => d.getImage(this))
  }

  /**
   * @returns an array of dimensions, which represent image copies that should be produced to satisfy these sizes.
   */
  toWidths(
    devices: Device[],
    { minScale }: { minScale?: number } = {}
  ): number[] {
    const needWidths = new Set<number>(devices.map(d => d.getImage(this).w))
    return filterSizes(Array.from(needWidths), minScale)
  }

  toQueries(devices: Device[]): QueryMap {
    return new QueryMap(devices, this)
  }

  /**
   * Parses the value of the img element's sizes attribute.
   *
   * @param sizesQueryString - a string representation of a valid img 'sizes' attribute
   * @return an array of SizesQuery.Object objects describing media query parameters
   */
  static parse(sizesQueryString: string): SizesQuery[] {
    return sizesQueryString
      .split(/\s*,\s*/)
      .map<SizesQuery | null>(sizeQuery => {
        const imageSize: (SizeKeyword | Dimension | ImageSize)[] = []
        const tokens = sizeQuery.split(/\s+/)
        while (tokens.length) {
          const t = tokens.pop()
          if (!t) break
          if (isSizeKeyword(t) || isDimension(t)) {
            imageSize.unshift(t)
            continue
          }
          try {
            const u = ImageSize.parse(t)
            imageSize.unshift(u)
            continue
          } catch (e) {
            tokens.push(t)
            break
          }
        }
        return {
          conditions: parseConditions(tokens.join(' ')),
          width: parseImageSize(imageSize),
        }
      })
      .filter((s): s is SizesQuery => s !== null)
  }
}

function parseConditions(queryString: string): MediaCondition | null {
  let query: MediaQuery
  try {
    query = toAST(queryString)[0]
  } catch (e) {
    let message = ''
    if (e instanceof Error) {
      message = '\n' + e.message
    }
    throw new Error(`Couldn't parse sizes query: ${queryString}${message}`)
  }
  if (query.mediaType !== 'all') {
    throw new Error(`Invalid media type, only "all" is allowed: ${queryString}`)
  }
  if (query.mediaPrefix === 'not') {
    // this should only fire for 'not all', which can be ignored
    return null
  }
  return query.mediaCondition
}

type SizeKeyword = 'cover' | 'contain'
const isSizeKeyword = (str: string): str is SizeKeyword =>
  str === 'cover' || str === 'contain'

type Dimension = 'width' | 'height'
const isDimension = (str: string): str is SizeKeyword =>
  str === 'width' || str === 'height'

function parseImageSize(tokens: (string | ImageSize)[]): ImageSize {
  if (tokens.length === 1 && ImageSize.isUnitValue(tokens[0])) {
    return tokens[0]
  }
  if (tokens.length === 2) {
    const [d, l] = tokens
    if (d === 'width' && ImageSize.isUnitValue(l)) {
      return l
    }
  }
  throw new Error(`Unable to parse image sizes: ${tokens.join(' ')}`)
}
