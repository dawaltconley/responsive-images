import type { SassQuery } from '../src/types'
import ResponsiveImages, {
  FromSizesOptions,
  MixedOptions,
  ResponsiveImagesOptions,
} from '../src/index'

const defaultConfig: ResponsiveImagesOptions = {
  defaults: {
    dryRun: true,
    filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
  },
}

describe('_handleKwargs()', () => {
  const images = new ResponsiveImages(defaultConfig)
  const handleFromSizes = images['_handleFromSizes'].bind(
    images
  ) as (typeof images)['_handleFromSizes']

  test('generates widths from sizes argument', () => {
    jest.restoreAllMocks()
    const parseMethod = jest.spyOn(images, 'widthsFromSizes')
    expect(
      handleFromSizes<FromSizesOptions>({
        sizes: '400px',
      })
    ).toEqual<FromSizesOptions>({
      widths: [1600, 1400, 1200, 1000, 800, 600, 400],
      sizes: '400px',
    })
    expect(
      handleFromSizes<MixedOptions>({
        sizes: '(min-width: 680px) 400px, 50vw',
        alt: 'Html alt text',
        class: 'some-class',
      })
    ).toEqual<MixedOptions>({
      widths: [
        1600, 1400, 1200, 1000, 864, 721, 640, 540, 480, 412, 360, 320, 270,
        240, 206, 180, 160,
      ],
      sizes: '(min-width: 680px) 400px, 50vw',
      alt: 'Html alt text',
      class: 'some-class',
    })
    expect(parseMethod).toHaveBeenCalled()
  })
  test("doesn't parse sizes if widths provided", () => {
    jest.restoreAllMocks()
    const parseMethod = jest.spyOn(images, 'widthsFromSizes')
    const kwargs = { widths: [800, 600], sizes: '600px' }
    const output = handleFromSizes(kwargs)
    expect(output).toEqual(kwargs)
    expect(parseMethod).not.toHaveBeenCalled()
  })
})

describe('generateMediaQueries()', () => {
  const images = new ResponsiveImages({
    ...defaultConfig,
    scalingFactor: 0.5,
  })

  test('generates media query data from sizes', async () => {
    const queries = await images.generateMediaQueries('./tests/assets/xlg.jpg')
    expect(queries).toEqual<SassQuery[]>([
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
})
