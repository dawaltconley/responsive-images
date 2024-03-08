type AnyFunc = (...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any

type Async<F extends AnyFunc> = (
  ...params: Parameters<F>
) => Promise<ReturnType<F>>

export type ChainedPromise<T> = {
  [K in keyof T]: T[K] extends AnyFunc
    ? Async<T[K]>
    : T[K] extends object
    ? ChainedPromise<T[K]>
    : Promise<T[K]>
} & Promise<T>

export function chain<T>(
  item: Promise<T>,
  parent?: Promise<unknown>
): ChainedPromise<T> {
  // wrap proxied promise in a function, which makes it callable in case it resolves to a function
  return new Proxy(() => item, {
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
            `Tried to access the property of a primitive (${typeof o}) in an ChainedPromise chain. Primitives must be awaited before being used.`
          )
        }),
        target
      )
    },
    // treat function calls as calls to the resolved method
    async apply(getMethod, _thisArg, argList) {
      const [object, method] = await Promise.all([parent, getMethod()])
      if (typeof method !== 'function') {
        throw new TypeError(
          `${method?.constructor.name || 'method'} is not callable`
        )
      }
      return method.apply(object, argList)
    },
  }) as unknown as ChainedPromise<T>
}
