import { describe, test, expect } from 'vitest'
import _ from 'lodash'
import * as sass from 'sass'
import ResponsiveImages, { ConfigOptions } from '../src/index'
import { scss } from '../src/lib/syntax'
import { getSassFunctions, getLegacySassFunctions } from '../src/sass'

const defaultConfig: ConfigOptions = {
  scalingFactor: 0.5,
  defaults: {
    dryRun: true,
    filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
  },
  devices: [
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
  ],
}

const compile = async (
  sassString: string,
  config: ConfigOptions = {},
): Promise<string> => {
  const merged = new ResponsiveImages(_.merge(defaultConfig, config))
  return sass
    .compileStringAsync(sassString, {
      loadPaths: [import.meta.dirname],
      functions: getSassFunctions(merged),
    })
    .then(result => result.css)
}

const compileLegacy = async (
  sassString: string,
  config: ConfigOptions = {},
): Promise<string> => {
  const merged = new ResponsiveImages(_.merge(defaultConfig, config))
  return new Promise((resolve, reject) =>
    sass.render(
      {
        data: sassString,
        includePaths: [import.meta.dirname],
        functions: getLegacySassFunctions(merged),
      },
      (e, result) => {
        if (e) reject(e)
        if (result) resolve(result.css.toString())
      },
    ),
  )
}

const defaultExpected = scss`
  .bg-image {
    @media (orientation: landscape)  and (min-width: 1025px) {
      background-image: url('/img/output-2048.jpeg');
    }
    @media (orientation: landscape) and (max-width: 1024px) and (min-width: 769px) and (min-resolution: 97dpi) {
      background-image: url("/img/output-2048.jpeg");
    }
    @media (orientation: landscape) and (max-width: 1024px) and (min-width: 769px) and (max-resolution: 96dpi) {
      background-image: url("/img/output-1080.jpeg");
    }
    @media (orientation: landscape) and (max-width: 768px) and (min-resolution: 241dpi) {
      background-image: url("/img/output-3072.jpeg");
    }
    @media (orientation: landscape) and (max-width: 768px) and (max-resolution: 240dpi) and (min-resolution: 97dpi) {
      background-image: url("/img/output-2048.jpeg");
    }
    @media (orientation: landscape) and (max-width: 768px) and (max-resolution: 96dpi) {
      background-image: url("/img/output-1080.jpeg");
    }
    @media (orientation: portrait) and (min-width: 433px) and (min-resolution: 97dpi) {
      background-image: url("/img/output-2048.jpeg");
    }
    @media (orientation: portrait) and (min-width: 433px) and (max-resolution: 96dpi) {
      background-image: url("/img/output-1080.jpeg");
    }
    @media (orientation: portrait) and (max-width: 432px) and (min-resolution: 241dpi) {
      background-image: url("/img/output-2048.jpeg");
    }
    @media (orientation: portrait) and (max-width: 432px) and (max-resolution: 240dpi) and (min-resolution: 97dpi) {
      background-image: url("/img/output-1080.jpeg");
    }
    @media (orientation: portrait) and (max-width: 432px) and (max-resolution: 96dpi) {
      background-image: url("/img/output-432.jpeg");
    }
  }
`

const defaultExpectedFormats = scss`
  .bg-image {
    @media (orientation: landscape)  and (min-width: 1025px) {
      @supports not (background-image: image-set(url('/img/output-2048.webp') type('image/webp'), url('/img/output-2048.jpeg') type('image/jpeg'))) {
        background-image: url('/img/output-2048.jpeg');
      }
      background-image: image-set(url('/img/output-2048.webp') type('image/webp'), url('/img/output-2048.jpeg') type('image/jpeg'));
    }
    @media (orientation: landscape) and (max-width: 1024px) and (min-width: 769px) and (min-resolution: 97dpi) {
      @supports not (background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-2048.jpeg");
      }
      background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'));
    }
    @media (orientation: landscape) and (max-width: 1024px) and (min-width: 769px) and (max-resolution: 96dpi) {
      @supports not (background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-1080.jpeg");
      }
      background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'));
    }
    @media (orientation: landscape) and (max-width: 768px) and (min-resolution: 241dpi) {
      @supports not (background-image: image-set(url("/img/output-3072.webp") type('image/webp'), url("/img/output-3072.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-3072.jpeg");
      }
      background-image: image-set(url("/img/output-3072.webp") type('image/webp'), url("/img/output-3072.jpeg") type('image/jpeg'));
    }
    @media (orientation: landscape) and (max-width: 768px) and (max-resolution: 240dpi) and (min-resolution: 97dpi) {
      @supports not (background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-2048.jpeg");
      }
      background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'));
    }
    @media (orientation: landscape) and (max-width: 768px) and (max-resolution: 96dpi) {
      @supports not (background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-1080.jpeg");
      }
      background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'));
    }
    @media (orientation: portrait) and (min-width: 433px) and (min-resolution: 97dpi) {
      @supports not (background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-2048.jpeg");
      }
      background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'));
    }
    @media (orientation: portrait) and (min-width: 433px) and (max-resolution: 96dpi) {
      @supports not (background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-1080.jpeg");
      }
      background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'));
    }
    @media (orientation: portrait) and (max-width: 432px) and (min-resolution: 241dpi) {
      @supports not (background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-2048.jpeg");
      }
      background-image: image-set(url("/img/output-2048.webp") type('image/webp'), url("/img/output-2048.jpeg") type('image/jpeg'));
    }
    @media (orientation: portrait) and (max-width: 432px) and (max-resolution: 240dpi) and (min-resolution: 97dpi) {
      @supports not (background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-1080.jpeg");
      }
      background-image: image-set(url("/img/output-1080.webp") type('image/webp'), url("/img/output-1080.jpeg") type('image/jpeg'));
    }
    @media (orientation: portrait) and (max-width: 432px) and (max-resolution: 96dpi) {
      @supports not (background-image: image-set(url("/img/output-432.webp") type('image/webp'), url("/img/output-432.jpeg") type('image/jpeg'))) {
        background-image: url("/img/output-432.jpeg");
      }
      background-image: image-set(url("/img/output-432.webp") type('image/webp'), url("/img/output-432.jpeg") type('image/jpeg'));
    }
  }
`

describe('bg mixin', () => {
  test('generates responsive background images from default values', async () => {
    const [output, expected] = await Promise.all([
      compile(scss`
        @use '../src/sass/_mixins.scss' as responsive;
        .bg-image {
          @include responsive.bg('./tests/assets/xlg.jpg');
        }
      `),
      compile(defaultExpected),
    ])
    expect(output).toEqual(expected)
  })

  test('works with legacy sass apis', async () => {
    const [output, expected] = await Promise.all([
      compileLegacy(scss`
        @use '../src/sass/_mixins.scss' as responsive;
        .bg-image {
          @include responsive.bg('./tests/assets/xlg.jpg');
        }
      `),
      compileLegacy(defaultExpected),
    ])
    expect(output).toEqual(expected)
  })

  test('generates responsive background images with multiple formats', async () => {
    const [output, expected] = await Promise.all([
      compile(scss`
        @use '../src/sass/_mixins.scss' as responsive;
        .bg-image {
          @include responsive.bg('./tests/assets/xlg.jpg', $formats: webp null);
        }
      `),
      compile(defaultExpectedFormats),
    ])
    expect(output).toEqual(expected)
  })

  test('generates same output with different function prefixes', async () => {
    const sassPrefix = 'foobar'
    const [output, expected] = await Promise.all([
      compile(
        scss`
          @use '../src/sass/_mixins.scss' as responsive with ($prefix: ${sassPrefix});
          .bg-image {
            @include responsive.bg('./tests/assets/xlg.jpg');
          }
        `,
        { sassPrefix },
      ),
      compile(defaultExpected),
    ])
    expect(output).toEqual(expected)
  })
})

describe('responsive.fromSizes().toCss()', () => {
  const { responsive } = new ResponsiveImages({
    ...defaultConfig,
    scalingFactor: 0.5,
  })

  test('generates responsive background css from default values', async () => {
    const css = await responsive('./tests/assets/xlg.jpg')
      .fromSizes('100vw', { formats: [null] })
      .then(r => r.toCss('.bg-image'))
    const [output, expected] = await Promise.all([
      compile(css),
      compile(defaultExpected),
    ])
    expect(output).toEqual(expected)
  })

  test('generates responsive background css with multiple formats', async () => {
    const css = await responsive('./tests/assets/xlg.jpg')
      .fromSizes('100vw')
      .then(r => r.toCss('.bg-image'))
    const [output, expected] = await Promise.all([
      compile(css),
      compile(defaultExpectedFormats),
    ])
    expect(output).toEqual(expected)
  })
})
