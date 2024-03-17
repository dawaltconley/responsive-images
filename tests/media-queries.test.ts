import type { MediaQuery } from '../src/lib/media-queries'
import { describe, test, expect } from 'vitest'
import devices from '../src/data/devices'
import Device from '../src/lib/device'
import DeviceSizes from '../src/lib/device-sizes'
import ResponsiveImages, { ConfigOptions } from '../src/index'
import { merge } from 'lodash'

const defaultConfig: ConfigOptions = {
  defaults: {
    dryRun: true,
    filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
  },
}

const sizes = new DeviceSizes('100vw', Device.fromDefinitions(devices))

describe('generateMediaQueries()', () => {
  const { responsive } = new ResponsiveImages(
    merge(defaultConfig, {
      scalingFactor: 0.5,
      defaults: {
        formats: [null],
        dryRun: true,
        filenameFormat: (_id, _src, width, format) =>
          `output-${width}.${format}`,
      },
    }),
  )

  // test('generates media query data from sizes', async () => {
  test('generates media query data from sizes', async () => {
    const image = responsive('./tests/assets/xlg.jpg')
    const metadata = await sizes.resize(image)
    const { queries } = sizes.toMediaQueries(metadata)
    expect(queries).toEqual(
      expect.arrayContaining([
        {
          orientation: expect.stringMatching(/(landscape|portrait)/),
          maxWidth: expect.any(Number),
          minWidth: expect.any(Number),
          images: [
            expect.objectContaining({
              image: expect.stringMatching(/output-\d+\.jpeg/),
              type: 'image/jpeg',
              dppx: expect.any(Number),
            }),
          ],
        },
      ]),
    )
    expect(queries).toHaveLength(20)
  })

  test('generates queries from a small image', async () => {
    const image = responsive('./tests/assets/landscape.jpeg')
    const metadata = await sizes.resize(image)
    const { queries } = sizes.toMediaQueries(metadata)
    expect(queries[0]).toEqual<MediaQuery[]>({
      orientation: 'landscape',
      maxWidth: false,
      minWidth: 1920,
      images: [
        {
          image: '/img/output-1920.jpeg',
          type: 'image/jpeg',
          dppx: 1,
        },
      ],
    })
    expect(queries).toHaveLength(20)
  })
})
