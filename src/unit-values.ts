export const Unit = ['px', 'vw', 'vh'] as const
export type Unit = (typeof Unit)[number]

export const isUnit = (s: string): s is Unit => Unit.some(u => u === s)

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

  uses<T extends Unit>(unit: T): this is UnitValue<T> {
    return (this.unit as Unit) === unit
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
        `Invalid unit: ${unit}\nOnly vw, vh, and px are supported.`
      )
    return new UnitValue(value, unit)
  }
}
