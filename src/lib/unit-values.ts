import type Device from './device'

export const units = new Set([
  'px',
  'vw',
  'vh',
  'dpi',
  'dpcm',
  'dppx',
  'x',
] as const)

/** @see one of {@link units} */
export type Unit = Parameters<typeof units.has>[number]

export const isUnit = (s: string): s is Unit => units.has(s as Unit)

/**
 * Represents a value with a unit, such as 600px, 40vw, etc.
 * Used internally for parsing the sizes query string.
 */
export default class UnitValue<U extends Unit = Unit> {
  value: number
  unit: U

  constructor(value: number, unit: U) {
    this.value = value
    this.unit = unit
  }

  toString(): string {
    return this.value.toString() + this.unit
  }

  valueOf(): number {
    return this.value
  }

  uses<T extends U>(...units: T[]): this is UnitValue<T> {
    return units.some(u => u === this.unit)
  }

  /** @constant used for parsing a CSS value */
  static readonly valueRegex = /([\d.]+)(\D*)/

  /** Parses a string as a value with an optional unit. */
  static parse(v: string): UnitValue {
    const [, valStr, unit = 'px'] = v.match(UnitValue.valueRegex) || []
    const value = Number(valStr)
    if (Number.isNaN(value))
      throw new Error(`Invalid UnitValue string, couldn't parse: ${value}`)
    if (!isUnit(unit))
      throw new Error(
        `Invalid unit: ${unit}\nOnly the following are supported: ${Array.from(
          units,
        ).join(' ')}`,
      )
    return new UnitValue(value, unit)
  }

  static isUnitValue(test: unknown): test is UnitValue {
    return test instanceof UnitValue
  }
}

export type ImageUnit = 'px' | 'vw' | 'vh'
export class ImageSize<U extends ImageUnit = ImageUnit> extends UnitValue<U> {
  constructor(value: number, unit: U) {
    super(value, unit)
  }

  static parse(v: string): ImageSize {
    const parsed = super.parse(v)
    if (!parsed.uses('px', 'vw', 'vh')) {
      throw new Error(
        `Invalid unit: ${parsed}\n ImageSize can only use: px vw vh`,
      )
    }
    return parsed
  }
}

export type ResolutionUnit = 'dpi' | 'dpcm' | 'dppx' | 'x'
export class Resolution<
  U extends ResolutionUnit = ResolutionUnit,
> extends UnitValue<U> {
  constructor(value: number, unit: U) {
    super(value, unit)
  }

  static parse(v: string): Resolution {
    const parsed = super.parse(v)
    if (!parsed.uses('dpi', 'dpcm', 'dppx', 'x')) {
      throw new Error(
        `Invalid unit: ${parsed}\n ResolutionValue can only use: dpi dpcm dppx x`,
      )
    }
    return parsed
  }
}

export function toDevicePixels(
  { value, unit }: ImageSize,
  device: Device,
): number {
  let pixels = value
  if (unit === 'vw') {
    pixels = (device.w * value) / 100
  } else if (unit === 'vh') {
    pixels = (device.h * value) / 100
  }
  return Math.ceil(pixels * device.dppx)
}

export function toDppx({ value, unit }: Resolution): Resolution<'dppx'> {
  let dppx = value,
    dpi = NaN
  if (unit === 'dpi') {
    dpi = value
  } else if (unit === 'dpcm') {
    dpi = value * 2.54
  }
  if (dpi) dppx = dpi / 96
  return new Resolution(dppx, 'dppx')
}
