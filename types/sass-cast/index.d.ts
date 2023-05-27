declare module 'sass-cast' {
  import type { Value, CustomFunction } from 'sass/types'

  export function toSass(
    value: unknown,
    options?: {
      parseUnquotedStrings?: boolean
      resolveFunctions?: boolean
    }
  ): Value

  export function fromSass(
    value: object,
    options?: {
      preserveUnits?: boolean
      rgbColors?: boolean
    }
  ): unknown

  export const sassFunctions: Record<string, CustomFunction<'async'>>
}
