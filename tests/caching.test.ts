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
import http, { type Server } from 'node:http'
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

describe('remote image caching keyed on query string', () => {
  // serves a different image depending on the `variant` query param, so two
  // urls that only differ by query string are guaranteed to have different content
  let server: Server
  let origin: string

  const variants = {
    square: readFileSync('./tests/assets/square.jpeg'),
    portrait: readFileSync('./tests/assets/portrait.jpeg'),
  }

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const { searchParams } = new URL(req.url ?? '', 'http://localhost')
      const variant = searchParams.get('variant')
      const image = variant === 'portrait' ? variants.portrait : variants.square
      res.writeHead(200, { 'Content-Type': 'image/jpeg' })
      res.end(image)
    })
    await new Promise<void>(resolve => server.listen(0, resolve))
    const { port } = server.address() as AddressInfo
    origin = `http://127.0.0.1:${port}`
  })

  afterAll(() => {
    server.close()
  })

  const outputDir = path.join(tmpDir, 'remote-query-string')
  const fetchCacheDir = path.join(tmpDir, 'fetch-cache-query-string')
  mkdirSync(outputDir)
  mkdirSync(fetchCacheDir)
  const { responsive } = new ResponsiveImages({
    devices,
    scalingFactor: 0.5,
    defaults: {
      outputDir,
      urlPath: '/img/',
      cacheOptions: { directory: fetchCacheDir },
    },
  } satisfies ConfigOptions)

  const sizes = '100vw'

  test('generates distinct output files for urls differing only by query string', async () => {
    await responsive(`${origin}/photo.jpg?variant=square`).fromSizes(sizes)
    const squareFiles = new Set(readdirSync(outputDir))
    expect(squareFiles.size).toBeGreaterThan(0)

    await responsive(`${origin}/photo.jpg?variant=portrait`).fromSizes(sizes)
    const allFiles = readdirSync(outputDir)
    const portraitFiles = allFiles.filter(f => !squareFiles.has(f))

    // the portrait variant must produce its own files rather than
    // overwriting or being skipped in favor of the square variant's cache
    expect(portraitFiles.length).toBeGreaterThan(0)
    for (const f of allFiles) {
      expect(statSync(path.join(outputDir, f)).size).toBeGreaterThan(0)
    }
  })

  test('reuses the cached output and avoids re-fetching for a repeated query string', async () => {
    const before = getMtimes(outputDir)
    const spy = vi.spyOn(global, 'fetch')
    try {
      await responsive(`${origin}/photo.jpg?variant=square`).fromSizes(sizes)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
    const after = getMtimes(outputDir)
    expect(after.size).toBe(before.size)
    for (const [file, mtime] of before) {
      expect(after.get(file)).toBe(mtime)
    }
  })
})
