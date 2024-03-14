import type {
  Value,
  CustomFunction,
  LegacyValue,
  LegacyAsyncFunction,
  LegacyAsyncFunctionDone,
} from 'sass/types'
import { toSass } from 'sass-cast'
import { fromSass as fromLegacySass } from 'sass-cast/legacy'

const legacyToModern = (value: LegacyValue): Value =>
  toSass(fromLegacySass(value))

export const toLegacyAsyncFunctions = (
  sassFunctions: Record<string, CustomFunction<'async'>>,
) => {
  return Object.entries(sassFunctions).reduce<
    Record<string, LegacyAsyncFunction>
  >(
    (fn, [name, modernFn]) => ({
      ...fn,
      [name]: (...args: LegacyValue[]): void => {
        const done = args.pop() as LegacyAsyncFunctionDone
        Promise.resolve(modernFn(args.map(legacyToModern))).then(done)
      },
    }),
    {},
  )
}
