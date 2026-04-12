/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@11ty/eleventy-fetch' {
  type ComplexSource =
    | ((...args: any[]) => any)
    | { then: (...args: any[]) => any }
    | { toString: () => string }

  type Source = string | URL | ComplexSource

  type CacheType = 'json' | 'text' | 'buffer' | 'xml' | 'parsed-xml'

  interface Options {
    type?: CacheType
    duration?: string
    directory?: string
    removeUrlQueryParams?: boolean
    formatUrlForDisplay?: (url: string) => string
    dryRun?: boolean
    verbose?: boolean
    concurrency?: number
    hashLength?: number
    /** Passed directly to the native fetch() call */
    fetchOptions?: RequestInit
    /** Return the full response object (url, status, headers, body, cache) instead of just the body */
    returnType?: 'response'
    /** Custom cache filename generator; return value must be a valid filename string */
    filenameFormat?: (uniqueKey: string, hash: string) => string
    /** Unique cache key for complex sources (functions/Promises) that can't be auto-keyed */
    requestId?: string
  }

  interface ResponseResult {
    url: string
    status: number
    headers: Record<string, string>
    body: any
    cache: 'hit' | 'miss'
  }

  export type { CacheType, Source, Options, ResponseResult }

  /** Fetch a remote asset, with caching. Returns the asset body (or a ResponseResult if returnType: 'response'). */
  export default function EleventyFetch(
    source: Source,
    options?: Options,
  ): Promise<any>

  /**
   * Create a RemoteAssetCache instance (managed by a module-level instance cache)
   * without immediately queuing a fetch. Call `.queue()` to fetch and cache.
   * Throws for invalid sources.
   */
  export function Fetch(source: Source, options?: Options): RemoteAssetCache

  /** @deprecated Use the default export instead. */
  export function queue(
    source: Source,
    queueCallback?: (...args: any[]) => any,
    options?: Options,
  ): Promise<any>

  export let concurrency: number

  export const Util: {
    isFullUrl: (url: string | URL) => boolean
  }

  export class AssetCache {
    uniqueKey: string
    hash: string
    cacheDirectory: string
    duration: string
    defaultDuration: string
    options: Options
    readonly cacheFilename: string
    readonly rootDir: string
    readonly cachePath: string
    readonly cache: any
    readonly cachedObject: any

    constructor(
      source: Source | string,
      cacheDirectory?: string,
      options?: Options,
    )

    static getCacheKey(source: Source | string, options?: Options): string
    static getHash(key: string | string[], hashLength?: number): string
    static cleanFilename(filename: string): string

    log(message: string): void
    getDurationMs(duration?: string): number
    setDirectoryManager(manager: any): void
    save(
      contents: any,
      type?: CacheType,
      metadata?: Record<string, any>,
    ): Promise<void>
    getCachedContents(): any
    getCachedValue(): any
    getCachedTimestamp(): number | undefined
    isCacheValid(duration?: string): boolean
    /** @deprecated Use isCacheValid() */
    needsToFetch(duration?: string): boolean
    fetch(optionsOverride?: Partial<Options>): Promise<any>
    /** For testing: returns true if any cache files exist on disk */
    hasAnyCacheFiles(): boolean
    /** For testing: deletes all cache files */
    destroy(): Promise<void>
  }

  export class RemoteAssetCache extends AssetCache {
    source: Source
    displayUrl: string
    fetchCount: number

    constructor(source: Source, cacheDirectory?: string, options?: Options)

    static getRequestId(source: Source, options?: Options): string
    static getCacheKey(source: Source, options?: Options): string
    static cleanUrl(url: string | URL): string
    static convertUrlToString(source: Source, options?: Options): string

    setQueue(queue: any): void
    /** Add to the shared fetch queue and return the resulting Promise. */
    queue(): Promise<any>
    isCacheValid(duration?: string): boolean
    /** True if the last fetch() call returned a cached result (no network request was made). */
    wasLastFetchCacheHit(): boolean
    getResponseValue(response: Response, type: 'json'): Promise<any>
    getResponseValue(response: Response, type: 'text' | 'xml'): Promise<string>
    getResponseValue(response: Response, type: 'parsed-xml'): Promise<any>
    getResponseValue(response: Response, type: 'buffer'): Promise<Buffer>
    getResponseValue(response: Response, type: CacheType): Promise<any>
    fetch(optionsOverride?: Partial<Options>): Promise<any>
  }

  export class Sources {
    static isFullUrl(url: string | URL): boolean
    static isValidSource(source: any): boolean
    static isValidComplexSource(source: any): boolean
    static getInvalidSourceError(source: any, errorCause?: any): Error
  }
}
