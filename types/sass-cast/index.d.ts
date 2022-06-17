declare module 'sass-cast' {
  export function toSass(
    value: any,
    options?: {
      parseUnquotedStrings?: boolean
      resolveFunctions?: boolean
    }
  ): object

  export function fromSass(
    value: object,
    options?: {
      preserveUnits?: boolean
      rgbColors?: boolean
    }
  ): any

  export const sassFunctions: object
}
