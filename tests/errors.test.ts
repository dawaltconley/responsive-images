import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ResponsiveImages, { type ConfigOptions } from '../src/index'

const devices = [{ w: 1920, h: 1200, dppx: [1], flip: false }]

const cacheDir = mkdtempSync(path.join(tmpdir(), 'responsive-images-errors-'))

let server: Server
let serverUrl: string

beforeAll(
  () =>
    new Promise<void>(resolve => {
      server = createServer((req, res) => {
        if (req.url === '/not-found.jpg') {
          res.writeHead(404, 'Not Found')
          res.end()
        } else if (req.url === '/not-an-image.jpg') {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end('<html>this is not an image</html>')
        }
      })
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo
        serverUrl = `http://127.0.0.1:${addr.port}`
        resolve()
      })
    }),
)

afterAll(
  () =>
    new Promise<void>(resolve => {
      server.close(() => {
        rmSync(cacheDir, { recursive: true, force: true })
        resolve()
      })
    }),
)

const { responsive } = new ResponsiveImages({
  devices,
  scalingFactor: 0.5,
  defaults: {
    dryRun: true,
    cacheOptions: { directory: cacheDir },
  },
} satisfies ConfigOptions)

describe('local file errors', () => {
  test('resize() throws for a non-existent file', () => {
    expect(() =>
      responsive('./nonexistent.jpg').resize({
        widths: [null],
        formats: [null],
      }),
    ).toThrow('ENOENT')
  })

  test('stat() rejects for a non-existent file', async () => {
    await expect(responsive('./nonexistent.jpg').stat()).rejects.toThrow(
      'ENOENT',
    )
  })

  test('resize() rejects for a local file that is not an image', async () => {
    await expect(
      responsive('./tests/assets/not-an-image.txt').resize({
        widths: [null],
        formats: [null],
      }),
    ).rejects.toThrow(/unsupported image format/i)
  })
})

describe('remote URL errors', () => {
  test('resize() rejects when the server returns 404', async () => {
    await expect(
      responsive(`${serverUrl}/not-found.jpg`).resize({
        widths: [null],
        formats: [null],
      }),
    ).rejects.toThrow('404')
  })

  test('fromSizes() rejects when the server returns 404', async () => {
    await expect(
      responsive(`${serverUrl}/not-found.jpg`).fromSizes('100vw'),
    ).rejects.toThrow('404')
  })

  test('stat() rejects when the server returns 404', async () => {
    await expect(
      responsive(`${serverUrl}/not-found.jpg`).stat(),
    ).rejects.toThrow('404')
  })

  test('resize() rejects when the response is not an image', async () => {
    await expect(
      responsive(`${serverUrl}/not-an-image.jpg`).resize({
        widths: [null],
        formats: [null],
      }),
    ).rejects.toThrow(/unsupported image format/i)
  })
})
