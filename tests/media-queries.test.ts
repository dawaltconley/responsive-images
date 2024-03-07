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
      },
    })
  )

  test('generates media query data from sizes', async () => {
    const image = responsive('./tests/assets/xlg.jpg')
    const metadata = await sizes.resize(image)
    const { queries } = sizes.toMediaQueries(metadata)
    expect(queries).toEqual<MediaQuery[]>([
      {
        orientation: 'landscape',
        maxWidth: false,
        minWidth: 1920,
        maxResolution: false,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1920,
        minWidth: 1680,
        maxResolution: false,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1680,
        minWidth: 1440,
        maxResolution: false,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1440,
        minWidth: 1366,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1440,
        minWidth: 1366,
        maxResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1366,
        minWidth: 1280,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1366,
        minWidth: 1280,
        maxResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1280,
        minWidth: 1024,
        maxResolution: false,
        minResolution: 1.5,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1280,
        minWidth: 1024,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1280,
        minWidth: 1024,
        maxResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1024,
        minWidth: 960,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1024,
        minWidth: 960,
        maxResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 960,
        minWidth: 768,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 960,
        minWidth: 768,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 960,
        minWidth: 768,
        maxResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: 3,
        minResolution: 2.5,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: 2.5,
        minResolution: 1,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 690,
        minWidth: 640,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 690,
        minWidth: 640,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 690,
        minWidth: 640,
        maxResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-3072.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 1,
        url: '/img/output-640.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 1,
        url: '/img/output-640.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: false,
        minWidth: 800,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: false,
        minWidth: 800,
        maxResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 800,
        minWidth: 768,
        maxResolution: false,
        minResolution: 1.5,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 800,
        minWidth: 768,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 800,
        minWidth: 768,
        maxResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 768,
        minWidth: 600,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 768,
        minWidth: 600,
        maxResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 600,
        minWidth: 432,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 600,
        minWidth: 432,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 600,
        minWidth: 432,
        maxResolution: 1,
        url: '/img/output-640.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-2048.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: 3,
        minResolution: 2.5,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: 2.5,
        minResolution: 1,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: 1,
        url: '/img/output-432.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 412,
        minWidth: 360,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 412,
        minWidth: 360,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 412,
        minWidth: 360,
        maxResolution: 1,
        url: '/img/output-432.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-640.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 1,
        url: '/img/output-432.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1442.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-960.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-640.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-640.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 1,
        url: '/img/output-432.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
    ])
  })

  test('generates queries from a small image', async () => {
    const image = responsive('./tests/assets/landscape.jpeg')
    const metadata = await sizes.resize(image)
    const { queries } = sizes.toMediaQueries(metadata)
    expect(queries).toEqual<MediaQuery[]>([
      {
        orientation: 'landscape',
        maxWidth: false,
        minWidth: 1920,
        maxResolution: false,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1920,
        minWidth: 1680,
        maxResolution: false,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1680,
        minWidth: 1440,
        maxResolution: false,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1440,
        minWidth: 1366,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1440,
        minWidth: 1366,
        maxResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1366,
        minWidth: 1280,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1366,
        minWidth: 1280,
        maxResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1280,
        minWidth: 1024,
        maxResolution: false,
        minResolution: 1.5,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1280,
        minWidth: 1024,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1280,
        minWidth: 1024,
        maxResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1024,
        minWidth: 960,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 1024,
        minWidth: 960,
        maxResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 960,
        minWidth: 768,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 960,
        minWidth: 768,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 960,
        minWidth: 768,
        maxResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: 3,
        minResolution: 2.5,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: 2.5,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 768,
        minWidth: 690,
        maxResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 690,
        minWidth: 640,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 690,
        minWidth: 640,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 690,
        minWidth: 640,
        maxResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 640,
        minWidth: 480,
        maxResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'landscape',
        maxWidth: 480,
        maxResolution: 1,
        url: '/img/output-540.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: false,
        minWidth: 800,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: false,
        minWidth: 800,
        maxResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 800,
        minWidth: 768,
        maxResolution: false,
        minResolution: 1.5,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 800,
        minWidth: 768,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 800,
        minWidth: 768,
        maxResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 768,
        minWidth: 600,
        maxResolution: false,
        minResolution: 1,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 768,
        minWidth: 600,
        maxResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 600,
        minWidth: 432,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 600,
        minWidth: 432,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 600,
        minWidth: 432,
        maxResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: 3,
        minResolution: 2.5,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: 2.5,
        minResolution: 1,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 432,
        minWidth: 412,
        maxResolution: 1,
        url: '/img/output-540.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 412,
        minWidth: 360,
        maxResolution: false,
        minResolution: 2,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 412,
        minWidth: 360,
        maxResolution: 2,
        minResolution: 1,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 412,
        minWidth: 360,
        maxResolution: 1,
        url: '/img/output-540.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1920.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-540.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 360,
        minWidth: 320,
        maxResolution: 1,
        url: '/img/output-360.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: false,
        minResolution: 3,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 3,
        minResolution: 2,
        url: '/img/output-1296.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 2,
        minResolution: 1.5,
        url: '/img/output-824.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 1.5,
        minResolution: 1,
        url: '/img/output-540.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
      {
        orientation: 'portrait',
        maxWidth: 320,
        maxResolution: 1,
        url: '/img/output-360.jpeg',
        sourceType: 'image/jpeg',
        format: 'jpeg',
      },
    ])
  })
})
