import {
  parseMediaCondition,
  parseMediaQuery,
  stringify,
  type QueryNode,
  type ConditionNode,
  // type FeatureNode,
  type PlainFeatureNode,
  type NumericValueNode,
  type NumberNode,
  type DimensionNode,
  type ParserError,
} from 'media-query-parser'
import {
  Rect,
  ResizeInstructions,
  SizeKeyword,
  isSizeKeyword,
  Dimension,
  isDimension,
} from './common'
import { ImageSize } from './unit-values'
import { instructionsToWidth } from './utilities'

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

export interface ValidSizesQuery extends SizesQuery {
  size: { width: ImageSize }
  isValid: true
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
    if (d === 'height' && ImageSize.isUnitValue(l)) {
      return { height: l }
    }
  }
  if (tokens.length === 3) {
    const [d, width, height] = tokens
    if (
      typeof d === 'string' &&
      isSizeKeyword(d) &&
      ImageSize.isUnitValue(width) &&
      ImageSize.isUnitValue(height)
    ) {
      return { width, height, fit: d }
    }
  }
  throw new Error(`Unable to parse image sizes: ${tokens.join(' ')}`)
}

function stringifySizesQuery({ conditions, size }: SizesQuery): string | null {
  if ('height' in size) return null
  if (!conditions) return size.width.toString()
  return `${stringify(conditions)} ${size.width}`
}

// const math

function makeValid(
  { conditions, size }: SizesQuery,
  image: Rect,
): ValidSizesQuery[] {
  if (!('height' in size)) return { conditions, size, isValid: true }
  const imageAspect = image.w / image.h
  if (!('fit' in size)) {
    const { height } = size
    const width = height.copy(h => h * (image.w / image.h))
    return [{ conditions, size: { width }, isValid: true }]
  }
  //
  // const { width, height, fit } = size
  // if (size.width.uses('px') && size.height.uses('px')) {
  if (size.width.unit === size.height.unit) {
    const resizeAspect = size.width.value / size.height.value
    let width: ImageSize
    // let width: ImageSize<'px'>
    if (size.fit === 'cover') {
      // if instructions are wider than image, use instruction width; if instructions are taller than image, use instruction height
      width =
        resizeAspect > imageAspect
          ? size.width
          : size.height.copy(h => h * imageAspect)
    } else {
      // if instructions are wider than image, use instruction height; if instructions are taller than image, use instruction width
      width =
        resizeAspect < imageAspect
          ? size.width
          : size.height.copy(h => h * imageAspect)
    }
    return [{ conditions, size: { width }, isValid: true }]
  }
  // if (size.width.unit === size.height.unit) {
  //   const width = instructionsToWidth({ width }, imageAspect)
  // }

  // else, need to calculate breakpoint
  // const bpWidth = getBreakpoint(size.width, image.w)
  // const bpHeight = getBreakpoint(size.height, image.h)
  // let bp: FeatureNode
  // if (typeof bpWidth === 'number' && bpHeight instanceof ImageSize) {
  //   bpHeight.value *= bpWidth
  // }
  // if (typeof bpHeight === 'number' && bpWidth instanceof ImageSize) {
  //   bpWidth.value *= bpHeight
  // }

  const bp = getBreakpoint(size, image)

  const newConditions = structuredClone(conditions)
  if (!newConditions) {
    return [{ conditions: bp, ... }, { conditions: null, size, isValid: true }]
  }

  // if ('fit' in size) {
  //   console.log(size)
  // }
}

type WithoutLoc<N extends PlainFeatureNode> = Omit<N, 'value' | 'start' | 'end'> & { value: Omit<NumericValueNode, 'start' | 'end'> }

interface Breakpoint extends Partial<Rect> {
  gt?: ImageSize,
  lt?: ImageSize
}

function getBreakpoint(
  // size: ResizeInstructions<ImageSize>,
  { width, height, fit }: { width: ImageSize, height: ImageSize, fit: SizeKeyword },
  image: Rect,
): PlainFeatureNode {
  // let bp: ResizeInstructions<number>
  let bp: Breakpoint = {}

  // this all assumes fit = 'cover'
  if (width.uses('px') && !height.uses('px')) {
    const breakAt = width.value * (image.h / image.w) * (100 / height.value)
      bp.gt = height.copy(h => h * (image.w / image.h))
      bp.lt = width
    if (height.uses('vw')) {
      bp.w = breakAt
    } else if (height.uses('vh')) {
      bp.h = breakAt
    }
  }
  if (!width.uses('px') && height.uses('px')) {
    const breakAt = height.value * (image.w / image.h) * (100 / width.value)
    bp.gt = width
    bp.lt = height.copy(h => h * (image.w / image.h))
    if (width.uses('vw')) {
      bp.w = breakAt // calculate width bp
    } else if (width.uses('vh')) {
      bp.h = breakAt // calculate height bp
    }
  }
  if (width.uses('vw') && height.uses('vh')) {
    // bp = bp.w / bp.h
    bp.w = image.w / (100 / width.value)
    bp.h = image.h / (100 / height.value)
    bp.gt = height.copy(h => h * (image.w / image.h))
    bp.lt = width
  }
  if (width.uses('vh') && height.uses('vw')) {
    // bp = bp.w / bp.h
    bp.w = image.h / (100 / height.value)
    bp.h = image.w / (100 / width.value)
    bp.gt = height.copy(h => h * (image.w / image.h))
    bp.lt = width
  }

  if (!bp.gt || !bp.lt) {
    throw new Error()
  }

  if (fit === 'contain') {
    // just swap the values applied when above/below the breakpoint
    const _gt = bp.gt
    bp.gt = bp.lt
    bp.lt = _gt
  }

  if (bp.w && bp.h) {
    // need to return gt/lt somehow too? or handle outside?
    return {
      "_t": "feature",
      "context": "value",
      "feature": "min-aspect-ratio",
      "value": {
        "_t": "number",
        "value": bp.w / bp.h,
        "flag": "number",
        start: -1,
        end: -1,
      },
      start: -1,
      end: -1,
}


  }

  if (bp.w) {
    return {
  "_t": "feature",
  "context": "value",
  "feature": "min-width", // alternately switch between min/max to handle gt/lt
  "value": {
    "_t": "dimension",
    "value": bp.w,
    "unit": "px",
    "start": -1,
    "end": -1
  },
  "start": -1,
  "end": -1
}


  }

  if (bp.h) {
    return {
  "_t": "feature",
  "context": "value",
  "feature": "min-height", // alternately switch between min/max to handle gt/lt
  "value": {
    "_t": "dimension",
    "value": bp.h,
    "unit": "px",
    "start": -1,
    "end": -1
  },
  "start": -1,
  "end": -1
}
  }

  throw Error()
}

// function getBreakpoint(resize: ImageSize, image: number): ImageSize<'px'> | number {
//   if (resize.uses('px')) {
//     return resize.value / image
//   }
//   return new ImageSize(image * (100 / resize.value), 'px')
//   // return resize.copy(v => (100 / v))
// }

function makeBreakpointQuery(value: ImageSize | number): FeatureNode {
  
}

// function getBreakpoint(
//   // size: ResizeInstructions<ImageSize>,
//   size: { width: ImageSize, height: ImageSize, fit: SizeKeyword },
//   image: Rect,
// ): FeatureNode | null {

}

function instructionsToWidth(
  resize: ResizeInstructions<ImageSize>,
  aspect: number,
): ImageSize {
  if ('fit' in resize) {
    const resizeAspect = resize.width / resize.height
    if (resize.fit === 'cover') {
      // if instructions are wider than image, use instruction width; if instructions are taller than image, use instruction height
      return resizeAspect > aspect ? resize.width : resize.height * aspect
    } else {
      // if instructions are wider than image, use instruction height; if instructions are taller than image, use instruction width
      return resizeAspect < aspect ? resize.width : resize.height * aspect
    }
  } else if ('height' in resize) {
    return resize.height * aspect
  } else {
    return resize.width
  }
}
