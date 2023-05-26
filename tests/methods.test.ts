import merge from 'lodash/merge'
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
  const images = new ResponsiveImages(merge(defaultConfig, {}))
  const handleKwargs = images['_handleKwargs'].bind(
    images
  ) as (typeof images)['_handleKwargs']

  test('generates widths from sizes argument', () => {
    jest.restoreAllMocks()
    const parseMethod = jest.spyOn(images, 'widthsFromSizes')
    expect(
      handleKwargs<FromSizesOptions>({
        sizes: '400px',
      })
    ).toEqual<FromSizesOptions>({
      widths: [1600, 1400, 1200, 1000, 800, 600, 400],
      sizes: '400px',
    })
    expect(
      handleKwargs<MixedOptions>({
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
    const output = handleKwargs(kwargs)
    expect(output).toEqual(kwargs)
    expect(parseMethod).not.toHaveBeenCalled()
  })
})
