import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import ResponsiveImages, {
  type ConfigOptions,
  type ResizeOptions,
} from '../src/index'

const REMOTE_URL =
  'https://raw.githubusercontent.com/dawaltconley/responsive-images/main/tests/assets/landscape.jpeg'

const devices = [
  { w: 1024, h: 768, dppx: [1], flip: false },
  { w: 640, h: 480, dppx: [1], flip: false },
]

const tmpDir = mkdtempSync(path.join(tmpdir(), 'responsive-images-caching-'))

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

function getMtimes(dir: string): Map<string, number> {
  return new Map(
    readdirSync(dir).map(f => [f, statSync(path.join(dir, f)).mtimeMs]),
  )
}

describe('resize() caching', () => {
  const outputDir = path.join(tmpDir, 'resize')
  mkdirSync(outputDir)
  const { responsive } = new ResponsiveImages({
    devices,
    scalingFactor: 0.5,
    defaults: {
      outputDir,
      urlPath: '/img/',
      filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
    },
  } satisfies ConfigOptions)
  const resizeOpts: ResizeOptions = {
    widths: [800, 400],
    formats: ['jpeg'],
  }

  test('writes output files on the first call', async () => {
    await responsive('./tests/assets/xlg.jpg').resize(resizeOpts)
    const files = readdirSync(outputDir)
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      expect(statSync(path.join(outputDir, f)).size).toBeGreaterThan(0)
    }
  })

  test('reuses existing files on a repeated call (mtime unchanged)', async () => {
    const before = getMtimes(outputDir)
    await responsive('./tests/assets/xlg.jpg').resize(resizeOpts)
    const after = getMtimes(outputDir)
    expect(after.size).toBe(before.size)
    for (const [file, mtime] of before) {
      expect(after.get(file)).toBe(mtime)
    }
  })

  test('regenerates files when useCache is disabled', async () => {
    const before = getMtimes(outputDir)
    await responsive('./tests/assets/xlg.jpg').resize({
      ...resizeOpts,
      useCache: false,
    })
    const after = getMtimes(outputDir)
    expect(after.size).toBe(before.size)
    for (const [file, mtime] of before) {
      expect(after.get(file)).toBeGreaterThan(mtime)
    }
  })
})

describe('fromSizes() caching', () => {
  const outputDir = path.join(tmpDir, 'fromSizes')
  mkdirSync(outputDir)
  const { responsive } = new ResponsiveImages({
    devices,
    scalingFactor: 0.5,
    defaults: {
      outputDir,
      urlPath: '/img/',
      filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
    },
  } satisfies ConfigOptions)

  const sizes = '(max-width: 800px) 100vw, 50vw'

  test('writes output files on the first call', async () => {
    await responsive('./tests/assets/xlg.jpg').fromSizes(sizes)
    const files = readdirSync(outputDir)
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      expect(statSync(path.join(outputDir, f)).size).toBeGreaterThan(0)
    }
  })

  test('reuses existing files on a repeated call (mtime unchanged)', async () => {
    const before = getMtimes(outputDir)
    await responsive('./tests/assets/xlg.jpg').fromSizes(sizes)
    const after = getMtimes(outputDir)
    expect(after.size).toBe(before.size)
    for (const [file, mtime] of before) {
      expect(after.get(file)).toBe(mtime)
    }
  })

  test('regenerates files when useCache is disabled', async () => {
    const before = getMtimes(outputDir)
    await responsive('./tests/assets/xlg.jpg').fromSizes(sizes, {
      useCache: false,
    })
    const after = getMtimes(outputDir)
    expect(after.size).toBe(before.size)
    for (const [file, mtime] of before) {
      expect(after.get(file)).toBeGreaterThan(mtime)
    }
  })
})

describe('remote image caching', () => {
  const outputDir = path.join(tmpDir, 'remote')
  const fetchCacheDir = path.join(tmpDir, 'fetch-cache')
  mkdirSync(outputDir)
  mkdirSync(fetchCacheDir)
  const { responsive } = new ResponsiveImages({
    devices,
    scalingFactor: 0.5,
    defaults: {
      outputDir,
      urlPath: '/img/',
      filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
      cacheOptions: { directory: fetchCacheDir },
    },
  } satisfies ConfigOptions)

  const sizes = '(max-width: 800px) 100vw, 50vw'

  test('downloads and writes output files on the first call', async () => {
    await responsive(REMOTE_URL).fromSizes(sizes)
    expect(readdirSync(outputDir).length).toBeGreaterThan(0)
    expect(readdirSync(fetchCacheDir).length).toBeGreaterThan(0)
  }, 30_000)

  test('reuses cached output files on a repeated call (mtime unchanged)', async () => {
    const before = getMtimes(outputDir)
    await responsive(REMOTE_URL).fromSizes(sizes)
    const after = getMtimes(outputDir)
    expect(after.size).toBe(before.size)
    for (const [file, mtime] of before) {
      expect(after.get(file)).toBe(mtime)
    }
  })

  test('does not re-fetch the remote image on a repeated call', async () => {
    await responsive(REMOTE_URL).fromSizes(sizes)
    const spy = vi.spyOn(global, 'fetch')
    try {
      await responsive(REMOTE_URL).fromSizes(sizes)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})

describe('remote image caching when disable is true', () => {
  const outputDir = path.join(tmpDir, 'remote-disabled')
  const fetchCacheDir = path.join(tmpDir, 'fetch-cache-disabled')
  mkdirSync(outputDir)
  mkdirSync(fetchCacheDir)
  const { responsive } = new ResponsiveImages({
    devices,
    scalingFactor: 0.5,
    disable: true,
    defaults: {
      outputDir,
      urlPath: '/img/',
      filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
      cacheOptions: { directory: fetchCacheDir },
    },
  } satisfies ConfigOptions)

  const sizes = '(max-width: 800px) 100vw, 50vw'

  test('downloads and caches the remote source on the first call', async () => {
    await responsive(REMOTE_URL).fromSizes(sizes)
    expect(readdirSync(fetchCacheDir).length).toBeGreaterThan(0)
  }, 30_000)

  test('does not re-fetch the remote image via fromSizes() on a repeated call', async () => {
    await responsive(REMOTE_URL).fromSizes(sizes)
    const spy = vi.spyOn(global, 'fetch')
    try {
      await responsive(REMOTE_URL).fromSizes(sizes)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })

  test('does not re-fetch the remote image via resize() on a repeated call', async () => {
    await responsive(REMOTE_URL).resize()
    const spy = vi.spyOn(global, 'fetch')
    try {
      await responsive(REMOTE_URL).resize()
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})

describe('remote image caching with a slow server', () => {
  const outputDir = path.join(tmpDir, 'remote-slow')
  const fetchCacheDir = path.join(tmpDir, 'fetch-cache-slow')
  mkdirSync(outputDir)
  mkdirSync(fetchCacheDir)

  const SLOW_DELAY = 10000
  const imageBuffer = readFileSync('./tests/assets/landscape.jpeg')

  let server: Server
  let slowUrl: string

  beforeAll(
    () =>
      new Promise<void>(resolve => {
        server = createServer((_req, res) => {
          setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' })
            res.end(imageBuffer)
          }, SLOW_DELAY)
        })
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address() as AddressInfo
          slowUrl = `http://127.0.0.1:${addr.port}/slow.jpg`
          resolve()
        })
      }),
  )

  afterAll(
    () =>
      new Promise<void>(resolve => {
        server.close(() => resolve())
      }),
  )

  // mirrors a dev setup that disables resizing to avoid rebuild overhead
  const { responsive } = new ResponsiveImages({
    devices,
    scalingFactor: 0.5,
    disable: true,
    defaults: {
      outputDir,
      urlPath: '/img/',
      filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
      cacheOptions: { directory: fetchCacheDir },
    },
  } satisfies ConfigOptions)

  const sizes = '(max-width: 800px) 100vw, 50vw'

  test(
    'waits on the slow server on the first call',
    async () => {
      const start = Date.now()
      await responsive(slowUrl).fromSizes(sizes)
      expect(Date.now() - start).toBeGreaterThanOrEqual(SLOW_DELAY)
    },
    SLOW_DELAY + 10_000,
  )

  test('uses the cache on a repeated call instead of waiting on the server again', async () => {
    const spy = vi.spyOn(global, 'fetch')
    const start = Date.now()
    try {
      await responsive(slowUrl).fromSizes(sizes)
      expect(Date.now() - start).toBeLessThan(SLOW_DELAY)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})
