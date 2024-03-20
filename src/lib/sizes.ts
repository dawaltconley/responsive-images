import {
  parseMediaCondition,
  parseMediaQuery,
  stringify,
  type QueryNode,
  type ConditionNode,
  type ParserError,
} from 'media-query-parser'
import {
  ResizeInstructions,
  SizeKeyword,
  isSizeKeyword,
  Dimension,
  isDimension,
} from './common'
import { ImageSize } from './unit-values'

type SizesCondition = ConditionNode | QueryNode | null

/**
 * represents a valid rule for the img sizes attribute,
 * such as `(min-width: 600px) 400px` or `100vw`
 */
export interface SizesQuery {
  /**
   * the conditions under which a sizes rule applies
   * 'null' should be treated as 'all', true no matter what
   */
  conditions: SizesCondition

  /** the image width applied under these conditions */
  size: ResizeInstructions<ImageSize>

  /** whether this SizesQuery is valid in the browser */
  isValid: boolean
}

export default class Sizes {
  readonly original: string
  readonly queries: SizesQuery[]
  readonly isValid: boolean

  constructor(sizes: string) {
    this.original = sizes
    this.queries = Sizes.parse(sizes)
    this.isValid = this.queries.every(q => q.isValid)
  }

  toString(): string {
    return this.queries
      .map(stringifySizesQuery)
      .filter((q): q is string => q !== null)
      .join(', ')
  }

  get string(): string {
    return this.toString()
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
          conditions: parseConditions(tokens.join(' ').trim()),
          size: parseImageSize(imageSize),
          isValid: imageSize.length === 1,
        }
      })
      .filter((s): s is SizesQuery => s !== null)
  }
}

function parseConditions(queryString: string): SizesCondition {
  if (!queryString) return null
  let query: SizesCondition | ParserError
  try {
    if (queryString === 'all' || queryString === 'not all') {
      query = parseMediaQuery(queryString)
    } else {
      query = parseMediaCondition(queryString)
    }
    if ('_errid' in query) {
      const { _errid, start, end } = query
      throw new Error(`${_errid} ${start},${end}`)
    }
  } catch (e) {
    let message = ''
    if (e instanceof Error) {
      message = '\n' + e.message
    }
    throw new Error(`Couldn't parse sizes query: ${queryString}${message}`)
  }
  return query
}

function parseImageSize(
  tokens: (string | ImageSize)[],
): ResizeInstructions<ImageSize> {
  if (tokens.length === 1 && ImageSize.isUnitValue(tokens[0])) {
    return { width: tokens[0] }
  }
  if (tokens.length === 2) {
    const [d, l] = tokens
    if (d === 'width' && ImageSize.isUnitValue(l)) {
      return { width: l }
    }
  }
  throw new Error(`Unable to parse image sizes: ${tokens.join(' ')}`)
}

function stringifySizesQuery({ conditions, size }: SizesQuery): string | null {
  if ('height' in size) return null
  if (!conditions) return size.width.toString()
  return `${stringify(conditions)} ${size.width}`
}
