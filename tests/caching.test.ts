import { describe, test, expect, afterAll, vi } from 'vitest'
import { mkdtempSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
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
