/** Turns a function into an async function. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Async<F extends (...args: any[]) => any> = (
  ...params: Parameters<F>
) => Promise<ReturnType<F>>

/**
 * A proxied `Promise` object, which passes any non-promise property accessors
 * to its resolved value. What this means in practice is that you can call
 * methods of the resolved value before it's resolved, but those methods will
 * be async. You can also `await` and resolve a `ChainedPromise` like a normal
 * `Promise`.
 *
 * This is what allows you to write this...
 * ```ts
 * const html = (await new ResponsiveImages()
 *   .responsive('image.png')
 *   .fromSizes('100vw'))
 *   .toPicture({ alt: '' })
 * ```
 * ...like this:
 * ```ts
 * const html = await new ResponsiveImages()
 *   .responsive('image.png')
 *   .fromSizes('100vw')
 *   .toPicture({ alt: '' })
 * ```
 *
 * @internal
 */
export type ChainedPromise<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any
    ? Async<T[K]>
    : T[K] extends object
      ? ChainedPromise<T[K]>
      : PromiseLike<T[K]>
} & PromiseLike<T>

export function chain<T>(
  item: T | PromiseLike<T>,
  parent?: PromiseLike<unknown>,
): ChainedPromise<T> {
  // wrap proxied promise in a function, which makes it callable in case it resolves to a function
  return new Proxy(() => Promise.resolve(item), {
    get(getTarget, accessed) {
      const target = getTarget()
      const property = Reflect.get(target, accessed)
      // return any promise props normally
      if (property !== undefined) {
        return typeof property === 'function' ? property.bind(target) : property
      }
      // otherwise try to return props of awaited object
      return chain(
        target.then(o => {
          if (o && typeof o === 'object') {
            return Reflect.get(o, accessed)
          }
          throw new Error(
            `Tried to access the property of a primitive (${typeof o}) in an ChainedPromise chain. Primitives must be awaited before being used.`,
          )
        }),
        target,
      )
    },
    // treat function calls as calls to the resolved method
    async apply(getMethod, _thisArg, argList) {
      const [object, method] = await Promise.all([parent, getMethod()])
      if (typeof method !== 'function') {
        throw new TypeError(
          `${method?.constructor.name || 'method'} is not callable`,
        )
      }
      return method.apply(object, argList)
    },
  }) as unknown as ChainedPromise<T>
}
