import { describe, test, expect } from 'vitest'
import ResponsiveImages, {
  getWidthsFromSizes,
  type ConfigOptions,
} from '../src/index'
import Metadata, { SizesMetadata } from '../src/lib/metadata'
import { parse as parseHtml } from 'node-html-parser'
import { toHtml } from 'hast-util-to-html'

const devices = [
  {
    w: 1920,
    h: 1200,
    dppx: [1],
    flip: false,
  },
  {
    w: 1024,
    h: 768,
    dppx: [2, 1],
    flip: true,
  },
  {
    w: 768,
    h: 432,
    dppx: [4, 2.5],
    flip: true,
  },
]
const defaultConfig: ConfigOptions = {
  devices,
  scalingFactor: 0.5,
  defaults: {
    dryRun: true,
    filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
  },
}
const { responsive } = new ResponsiveImages(defaultConfig)

describe('responsive.resize()', () => {
  const resizing = responsive('./tests/assets/xlg.jpg').resize({
    widths: [null, 1129, 666],
    formats: ['png'],
  })

  test('returns metadata with expected structure', async () => {
    const m = await resizing
    expect(m).toBeInstanceOf(Metadata)
    expect(m.metadata).toHaveProperty('png')
    expect(m.metadata.png).toBeTruthy()
    m.metadata.png?.forEach(entry => {
      expect(entry).toMatchObject({
        format: 'png',
        width: expect.any(Number),
        height: expect.any(Number),
        url: expect.stringMatching(/output-\d+\.png/),
        sourceType: 'image/png',
        srcset: expect.stringMatching(/output-\d+\.png \d+w/),
        outputPath: expect.stringMatching(/output-\d+\.png/),
        size: expect.any(Number),
      })
    })
  })

  test('produces correct sizes', async () => {
    const { metadata } = await resizing
    expect(metadata).toMatchObject({
      png: [{ width: 666 }, { width: 1129 }, { width: 5312 }],
    })
  })

  test('produces valid html with a single format', async () => {
    const metadata = await responsive('./tests/assets/xlg.jpg').resize({
      widths: [null, 1129, 666],
      formats: ['png'],
    })
    const props = { sizes: '100vw', alt: 'test image' }
    const result =
      '<img alt="test image" src="/img/output-666.png" width="5312" height="2988" srcset="/img/output-666.png 666w, /img/output-1129.png 1129w, /img/output-5312.png 5312w" sizes="100vw">'
    expect(metadata.toPicture(props)).toStrictEqual(result)
    expect(metadata.toSources(props)).toStrictEqual(result)
    expect(toHtml(metadata.toHast(props))).toStrictEqual(result)
  })

  test('determines whether sources need to be wrapped in a picture element', async () => {
    const singleFormat = await responsive('./tests/assets/xlg.jpg').resize({
      widths: [null, 1129, 666],
      formats: ['png'],
    })
    const multiFormat = await responsive('./tests/assets/xlg.jpg').resize({
      widths: [1024, 432],
      formats: ['webp', null],
    })
    expect(singleFormat.needsPicture).toBe(false)
    expect(multiFormat.needsPicture).toBe(true)
  })

  test('produces valid html with multiple formats', async () => {
    const metadata = await responsive('./tests/assets/xlg.jpg').resize({
      widths: [1024, 432],
      formats: ['webp', null],
    })
    const props = { sizes: '100vw', alt: '' }
    const result =
      '<source type="image/webp" srcset="/img/output-432.webp 432w, /img/output-1024.webp 1024w" sizes="100vw"><img alt="" src="/img/output-432.jpeg" width="1024" height="576" srcset="/img/output-432.jpeg 432w, /img/output-1024.jpeg 1024w" sizes="100vw">'

    expect(metadata.toPicture(props)).toStrictEqual(
      `<picture>${result}</picture>`,
    )
    expect(metadata.toSources(props)).toStrictEqual(result)
    expect(toHtml(metadata.toHast(props))).toStrictEqual(result)
  })

  test('produces valid html with optional attributes', async () => {
    const metadata = await responsive('./tests/assets/xlg.jpg').resize({
      widths: [1024, 432],
      formats: ['webp', null],
    })
    const attributes = {
      class: 'foo foo--bar',
      loading: 'lazy',
      decoding: 'async',
      foo: 'bar',
      sizes: '100vw',
      alt: '',
    }
    expect(
      parseHtml(metadata.toPicture(attributes)).querySelector('img')
        ?.attributes,
    ).toMatchObject(attributes)
    expect(
      parseHtml(toHtml(metadata.toHast(attributes))).querySelector('img')
        ?.attributes,
    ).toMatchObject(attributes)
  })

  test('allows chaining further methods without awaiting', async () => {
    const result =
      '<source type="image/webp" srcset="/img/output-432.webp 432w, /img/output-1024.webp 1024w" sizes="100vw"><img alt="" src="/img/output-432.jpeg" width="1024" height="576" srcset="/img/output-432.jpeg 432w, /img/output-1024.jpeg 1024w" sizes="100vw">'
    expect(
      await responsive('./tests/assets/xlg.jpg')
        .resize({
          widths: [1024, 432],
          formats: ['webp', null],
        })
        .toSources({ sizes: '100vw', alt: '' }),
    ).toEqual(result)
    expect(
      await responsive('./tests/assets/xlg.jpg')
        .resize({
          widths: [1024, 432],
          formats: ['webp', null],
        })
        .toHast({ sizes: '100vw', alt: '' })
        .then(toHtml),
    ).toEqual(result)
  })
})

describe('responsive.stat()', () => {
  test('returns correct metadata for a local image', async () => {
    const metadata = await responsive('./tests/assets/landscape.jpeg').stat()
    expect(metadata).toMatchObject({
      format: 'jpeg',
      width: 1920,
      height: 1280,
      sourceType: 'image/jpeg',
    })
  })
  test('returns correct metadata for a remote image', async () => {
    const metadata = await responsive(
      'https://raw.githubusercontent.com/dawaltconley/responsive-images/main/tests/assets/landscape.jpeg',
    ).stat()
    expect(metadata).toMatchObject({
      format: 'jpeg',
      width: 1920,
      height: 1280,
      sourceType: 'image/jpeg',
    })
  })
})

describe('responsive.fromSizes()', () => {
  const resizing = responsive('./tests/assets/xlg.jpg').fromSizes(
    '(min-width: 1600px) 52vh, (max-width: 800px) 360px, 80vw',
  )

  test('returns metadata with expected structure', async () => {
    const m = await resizing
    expect(m).toBeInstanceOf(SizesMetadata)
    expect(m.metadata).toHaveProperty('webp')
    expect(m.metadata).toHaveProperty('jpeg')
    expect(m.metadata.webp).toBeTruthy()
    m.metadata.webp?.forEach(entry => {
      expect(entry).toMatchObject({
        format: 'webp',
        width: expect.any(Number),
        height: expect.any(Number),
        url: expect.stringMatching(/output-\d+\.webp/),
        sourceType: 'image/webp',
        srcset: expect.stringMatching(/output-\d+\.webp \d+w/),
        outputPath: expect.stringMatching(/output-\d+\.webp/),
        size: expect.any(Number),
      })
    })
  })

  test('resizes based on available units', async () => {
    const { metadata } = await resizing
    expect(metadata).toMatchObject({
      webp: [
        { width: 360, height: 202 },
        { width: 624, height: 351 },
        { width: 900, height: 506 },
        { width: 1639, height: 921 },
      ],
      jpeg: [
        { width: 360, height: 202 },
        { width: 624, height: 351 },
        { width: 900, height: 506 },
        { width: 1639, height: 921 },
      ],
    })
  })

  test('resizes remote images', async () => {
    const { metadata } = await responsive(
      'https://raw.githubusercontent.com/dawaltconley/responsive-images/main/tests/assets/portrait.jpeg',
    ).fromSizes('(min-width: 1380px) 30vh, (max-width: 700px) 360px, 60vw')
    expect(JSON.parse(JSON.stringify(metadata))).toMatchObject({
      webp: [
        { height: 479, width: 360 },
        { height: 819, width: 615 },
        { height: 1281, width: 961 },
      ],
      jpeg: [
        { height: 479, width: 360 },
        { height: 819, width: 615 },
        { height: 1281, width: 961 },
      ],
    })
  })

  test('works with images too small to resize', async () => {
    const m = await responsive('./tests/assets/tiny.png').fromSizes(
      '(min-width: 1536px) 476px, (min-width: 1280px) 396px, (min-width: 1024px) 438px, (min-width: 768px) 320px, (min-width: 640px) 576px, 100vw',
    )
    expect(m).toBeInstanceOf(Metadata)
    expect(m.metadata).toHaveProperty('jpeg')
    expect(m.metadata.jpeg).toBeTruthy()
    expect(m.metadata.jpeg?.length).greaterThan(0)
    expect(m.metadata.jpeg && m.metadata.jpeg[0]).toMatchObject({
      format: 'jpeg',
      width: expect.any(Number),
      height: expect.any(Number),
      url: expect.stringMatching(/output-\d+\.jpeg/),
      sourceType: 'image/jpeg',
      srcset: expect.stringMatching(/output-\d+\.jpeg \d+w/),
      outputPath: expect.stringMatching(/output-\d+\.jpeg/),
      size: expect.any(Number),
    })
  })

  test('produces valid html with a single format', async () => {
    const metadata = await responsive('./tests/assets/xlg.jpg').fromSizes(
      '(min-width: 1600px) 52vh, (max-width: 800px) 360px, 80vw',
      {
        formats: ['avif'],
      },
    )
    const result =
      '<img alt="" src="/img/output-360.avif" width="1639" height="921" srcset="/img/output-360.avif 360w, /img/output-624.avif 624w, /img/output-900.avif 900w, /img/output-1639.avif 1639w" sizes="(min-width: 1600px) 52vh, (max-width: 800px) 360px, 80vw">'
    expect(metadata.toPicture({ alt: '' })).toStrictEqual(result)
    expect(metadata.toSources({ alt: '' })).toStrictEqual(result)
  })

  test('produces valid html with multiple formats', async () => {
    const metadata = await resizing
    const expected =
      '<source type="image/webp" srcset="/img/output-360.webp 360w, /img/output-624.webp 624w, /img/output-900.webp 900w, /img/output-1639.webp 1639w" sizes="(min-width: 1600px) 52vh, (max-width: 800px) 360px, 80vw"><img alt="" src="/img/output-360.jpeg" width="1639" height="921" srcset="/img/output-360.jpeg 360w, /img/output-624.jpeg 624w, /img/output-900.jpeg 900w, /img/output-1639.jpeg 1639w" sizes="(min-width: 1600px) 52vh, (max-width: 800px) 360px, 80vw">'
    expect(metadata.toPicture({ alt: '' })).toStrictEqual(
      `<picture>${expected}</picture>`,
    )
    expect(metadata.toSources({ alt: '' })).toStrictEqual(expected)
    expect(toHtml(metadata.toHast({ alt: '' }))).toStrictEqual(expected)
  })

  test('produces valid html with optional attributes', async () => {
    const output = parseHtml(
      (await resizing).toPicture({
        class: 'foo foo--bar',
        loading: 'lazy',
        decoding: 'async',
        foo: 'bar',
        sizes: '100vw',
        alt: '',
      }),
    ).querySelector('img')?.attributes

    expect(output).toMatchObject({
      class: 'foo foo--bar',
      loading: 'lazy',
      decoding: 'async',
      foo: 'bar',
      sizes: '100vw',
      alt: '',
    })
  })

  test('produces valid css for background images', async () => {
    const css = await resizing.toCss('.bg-test')
    expect(css).toStrictEqual(
      [
        "@media (orientation: landscape) and (min-width: 1025px) { .bg-test { background-image: image-set(url('/img/output-624.webp') 1x type('image/webp'), url('/img/output-624.jpeg') 1x type('image/jpeg')); } }",
        "@media (orientation: landscape) and (max-width: 1024px) and (min-width: 769px) { .bg-test { background-image: image-set(url('/img/output-1639.webp') 2x type('image/webp'), url('/img/output-1639.jpeg') 2x type('image/jpeg'), url('/img/output-900.webp') 1x type('image/webp'), url('/img/output-900.jpeg') 1x type('image/jpeg')); } }",
        "@media (orientation: landscape) and (max-width: 768px) { .bg-test { background-image: image-set(url('/img/output-1639.webp') 4x type('image/webp'), url('/img/output-1639.jpeg') 4x type('image/jpeg'), url('/img/output-900.webp') 2.5x type('image/webp'), url('/img/output-900.jpeg') 2.5x type('image/jpeg'), url('/img/output-360.webp') 1x type('image/webp'), url('/img/output-360.jpeg') 1x type('image/jpeg')); } }",
        "@media (orientation: portrait) and (min-width: 433px) { .bg-test { background-image: image-set(url('/img/output-900.webp') 2x type('image/webp'), url('/img/output-900.jpeg') 2x type('image/jpeg'), url('/img/output-360.webp') 1x type('image/webp'), url('/img/output-360.jpeg') 1x type('image/jpeg')); } }",
        "@media (orientation: portrait) and (max-width: 432px) { .bg-test { background-image: image-set(url('/img/output-1639.webp') 4x type('image/webp'), url('/img/output-1639.jpeg') 4x type('image/jpeg'), url('/img/output-900.webp') 2.5x type('image/webp'), url('/img/output-900.jpeg') 2.5x type('image/jpeg'), url('/img/output-360.webp') 1x type('image/webp'), url('/img/output-360.jpeg') 1x type('image/jpeg')); } }",
      ].join('\n'),
    )
  })

  test('allows chaining further methods without awaiting', async () => {
    expect(await resizing.devices).toBe((await resizing).devices)
    expect(await resizing.devices.sizes).toBe((await resizing).devices.sizes)
    expect(await resizing.devices.sizes.string).toBe(
      (await resizing).devices.sizes.string,
    )
    expect(await resizing.toSources({ alt: '' })).toEqual(
      (await resizing).toSources({ alt: '' }),
    )
    expect(await resizing.toHast({ alt: '' })).toEqual(
      (await resizing).toHast({ alt: '' }),
    )
    expect(await resizing.toCss('.foo')).toEqual((await resizing).toCss('.foo'))
    const toCss = resizing.toCss
    expect(await toCss('.foo')).toEqual((await resizing).toCss('.foo'))
  })
})

describe('getWidthsFromSizes()', () => {
  test('generates correct widths from a sizes string', () => {
    expect(
      getWidthsFromSizes(
        '(min-width: 1600px) 52vh, (max-width: 800px) 360px, 80vw',
        { devices, scalingFactor: 0.5 },
      ),
    ).toEqual([1639, 900, 624, 360])
  })
  test('generates widths constrained by the image width', () => {
    expect(
      getWidthsFromSizes(
        '(min-width: 1380px) 30vh, (max-width: 700px) 360px, 60vw',
        { devices, scalingFactor: 0.5, width: 961 },
      ),
    ).toEqual([961, 615, 360])
  })
})
