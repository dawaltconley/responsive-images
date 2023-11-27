import type { Value as SassValue, CustomFunction } from 'sass/types'
import type { Orientation } from './types'
import type { MediaQuery } from './media-queries'
import type MediaQueries from './media-queries'

import EleventyImage from '@11ty/eleventy-img'
import cast from 'sass-cast'
import defaultDevices from './data/devices'
import { isOrientation } from './types'
import Sizes from './sizes'
import Device, { DeviceDefinition } from './device'
import { filterSizes } from './utilities'
import { toLegacyAsyncFunctions } from './legacy-sass'

/**
 * Defines properties for image markup. `alt` is required.
 * Passed to the `EleventyImage.generateHTML` function.
 */
export interface HtmlOptions {
  alt: string
  [attribute: string]: unknown
}

/**
 * Options passed to the EleventyImage resize function.
 */
export interface ResizeOptions {
  /** @see {@link https://www.11ty.dev/docs/plugins/image/} */
  widths?: EleventyImage.BaseImageOptions['widths']
  /** @see {@link https://www.11ty.dev/docs/plugins/image/} */
  formats?: EleventyImage.BaseImageOptions['formats']
}

export interface FromSizesOptions extends ResizeOptions {
  sizes?: string
}

export interface MediaQueryOptions extends FromSizesOptions {
  orientations?: Orientation[]
}

export interface MixedOptions extends HtmlOptions, FromSizesOptions {}

export interface ImageMetadata extends HtmlOptions {
  metadata: EleventyImage.Metadata
}

export type ValidImageFormat =
  | 'auto'
  | EleventyImage.ImageFormatWithAliases
  | null

const validImageFormats: ValidImageFormat[] = [
  'webp',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'svg+xml',
  'avif',
  'auto',
  null,
]

const isValidImageFormat = (test: string | null): test is ValidImageFormat =>
  validImageFormats.includes(test as ValidImageFormat)

const assertOrientation = (test: string): Orientation => {
  if (!isOrientation(test)) {
    throw new Error(`Invalid orientation: ${test}`)
  }
  return test
}

const assertValidImageFormat = (test: string | null): ValidImageFormat => {
  if (!isValidImageFormat(test))
    throw new Error(`Invalid image format: ${test}`)
  return test
}

export interface ResponsiveImagesOptions {
  /**
   * Default options passed to EleventyImage whenever it is called.
   * @see {@link https://www.11ty.dev/docs/plugins/image/} for available options
   */
  defaults?: Partial<EleventyImage.ImageOptions>

  /**
   * Devices to support when calculating image sizes. Defaults to an
   * internal device list that can be imported from `@dawaltconley/responsive-images/devices`
   */
  devices?: DeviceDefinition[]

  /**
   * The maximum difference in size between any two images created when downsizing.
   * A higher scaling factor creates more images with smaller gaps in their sizes.
   * A lower scaling factor creates fewer images with larger gaps in their sizes. Some devices may need to load larger images than necessary.
   * @defaultValue `0.8`
   */
  scalingFactor?: number

  /**
   * Prefix for the generated Sass functions.
   * @defaultValue `'image'`
   */
  sassPrefix?: string

  /**
   * If true, disables new image generation so that all methods output image elements at their original size.
   * Useful for avoiding repeated rebuilds on development environments.
   * @defaultValue `false`
   */
  disable?: boolean
}

export default class ResponsiveImages
  implements Required<ResponsiveImagesOptions>
{
  /** @see ResponsiveImagesOptions {@link ResponsiveImagesOptions.defaults} */
  defaults: Partial<EleventyImage.ImageOptions>
  /** @see ResponsiveImagesOptions {@link ResponsiveImagesOptions.devices} */
  devices: Device[]
  /** @see ResponsiveImagesOptions {@link ResponsiveImagesOptions.sassPrefix} */
  sassPrefix: string
  /** @see ResponsiveImagesOptions {@link ResponsiveImagesOptions.scalingFactor} */
  scalingFactor: number
  /** @see ResponsiveImagesOptions {@link ResponsiveImagesOptions.disable} */
  disable: boolean

  constructor(options?: ResponsiveImagesOptions) {
    const {
      defaults = {},
      devices = defaultDevices,
      sassPrefix = 'image',
      scalingFactor = 0.8,
      disable = false,
    } = options || {}

    this.defaults = defaults
    this.devices = devices.map(d => new Device(d))
    this.sassPrefix = sassPrefix
    this.scalingFactor = scalingFactor
    this.disable = disable

    this.resize = this.resize.bind(this)
    this.generatePicture = this.generatePicture.bind(this)
    this.generateSources = this.generateSources.bind(this)
    this.metadataFromSizes = this.metadataFromSizes.bind(this)
    this.pictureFromSizes = this.pictureFromSizes.bind(this)
    this.sourceFromSizes = this.sourceFromSizes.bind(this)
    this.generateMediaQueries = this.generateMediaQueries.bind(this)
    this.backgroundFromSizes = this.backgroundFromSizes.bind(this)
  }

  /**
   * Generates multiple new sizes for an image. This is a wrapper method around
   * `@11ty/eleventy-img`, which just handles default options and allows disabling.
   * @param image - file or url of the source image
   * @param options - options passed to `@11ty/eleventy-img`
   * @returns a promise resolving to a metadata object for the generated images
   */
  async resize(
    image: EleventyImage.ImageSource,
    options: EleventyImage.ImageOptions = {}
  ): Promise<EleventyImage.Metadata> {
    let imgOpts = {
      ...this.defaults,
      ...options,
    }
    if (this.disable)
      imgOpts = {
        ...imgOpts,
        widths: [null],
        formats: [null],
      }
    return EleventyImage(image, imgOpts)
  }

  async generatePicture(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this._handleMixedOptions(kwargs)
    const metadata = await this.resize(image, options)
    return EleventyImage.generateHTML(metadata, properties)
  }

  async generateSources(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const html = await this.generatePicture(image, kwargs)
    return html.replace(/(^<picture>|<\/picture>$)/g, '')
  }

  /**
   * Calculates image widths from a sizes query string.
   * Uses configured defaults for the `devices` and `scalingFactor`.
   */
  widthsFromSizes(sizes: string): number[] {
    return new Sizes(sizes).toWidths(this.devices, {
      minScale: this.scalingFactor,
    })
  }

  private _handleMixedOptions(
    options: MixedOptions
  ): [ResizeOptions, HtmlOptions] {
    const {
      widths = this.defaults.widths,
      formats = this.defaults.formats,
      ...html
    } = options
    const resizeOpts: ResizeOptions = {}
    if (widths) resizeOpts.widths = widths
    if (formats) resizeOpts.formats = formats
    return [resizeOpts, html]
  }

  /**
   * Returns a copy of the config data with an undefined `widths` calculated from sizes.
   * If sizes is not specified, it will be specified in the return config as `'100vw'`.
   * @returns a new object with widths calculated from the sizes attribute
   */
  private _handleFromSizes<T extends FromSizesOptions>(kwargs: T): T {
    const processed = { ...kwargs }
    const { sizes = '100vw', widths } = processed
    if (!widths) {
      processed.widths = this.widthsFromSizes(sizes)
    }
    return { sizes, ...processed }
  }

  /** Uses a sizes attribute to parse images and returns a metadata object. Defaults to 100vw. */
  async metadataFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<ImageMetadata> {
    const [options, properties] = this._handleMixedOptions(
      this._handleFromSizes(kwargs)
    )
    const metadata = await this.resize(image, options)
    return {
      ...properties,
      metadata,
    }
  }

  async pictureFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    return this.generatePicture(image, this._handleFromSizes(kwargs))
  }

  async sourceFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    return this.generateSources(image, this._handleFromSizes(kwargs))
  }

  async #generateMediaQueries(
    src: EleventyImage.ImageSource,
    kwargs: MediaQueryOptions = {}
  ): Promise<MediaQueries> {
    const {
      formats = this.defaults.formats || [null],
      orientations = ['landscape', 'portrait'],
      sizes = '100vw',
    } = kwargs
    let { widths = null } = kwargs

    const originalImage = await EleventyImage(src, {
      statsOnly: true,
      widths: [null],
      formats: [null],
    }).then(metadata => Object.values(metadata)[0][0])

    const queries = new Sizes(sizes).toQueries(this.devices)
    widths ??= queries.getImageWidths({ orientations })
    let filteredWidths = widths
      .map(w => (w === null || w === 'auto' ? originalImage.width : w))
      .filter(w => w <= originalImage.width)
    filteredWidths = filterSizes(filteredWidths, this.scalingFactor)

    const metadata = await this.resize(src, {
      widths: filteredWidths,
      formats,
    }).then(formats => Object.values(formats).flat())

    return queries.toMediaQueries(metadata, {
      orientations,
    })
  }

  async generateMediaQueries(
    src: EleventyImage.ImageSource,
    kwargs: MediaQueryOptions = {}
  ): Promise<MediaQuery[]> {
    return this.#generateMediaQueries(src, kwargs).then(q => q.queries)
  }

  /**
   * Generates CSS for a responsive background image using a sizes string.
   * @param selector - a CSS selector for the intended elements
   */
  async backgroundFromSizes(
    selector: string,
    src: EleventyImage.ImageSource,
    kwargs: MediaQueryOptions = {}
  ): Promise<string> {
    const queries = await this.#generateMediaQueries(src, kwargs)
    return queries.toCss(selector)
  }

  /**
   * An object that can be passed to Sass's `compileAsync` or `compileStringAsync` methods.
   * @see {@link https://sass-lang.com/documentation/js-api/modules#compileAsync}
   */
  get sassFunctions(): Record<string, CustomFunction<'async'>> {
    const resizeFunction = `${this.sassPrefix}-resize($src, $widths: null, $formats: null)`
    const queriesFunction = `${this.sassPrefix}-queries($src, $widths: null, $formats: null, $orientation: landscape portrait, $sizes: '100vw')`
    return {
      [resizeFunction]: async (args: SassValue[]): Promise<SassValue> => {
        const src: string = args[0].assertString('src').text
        const widths = args[1].asList
          .toArray()
          .map(n => n.realNull && n.assertNumber('widths').value)
        const formats = args[2].asList
          .toArray()
          .map(s =>
            assertValidImageFormat(s.realNull && s.assertString('formats').text)
          )

        const metadata = await this.resize(src, { widths, formats })
        return cast.toSass(metadata)
      },
      [queriesFunction]: async (args: SassValue[]): Promise<SassValue> => {
        const src = args[0].assertString('src').text
        const widths = args[1].realNull
          ? args[1].asList
              .toArray()
              .map(n => n.realNull && n.assertNumber().value)
          : undefined
        const formats = args[2].asList
          .toArray()
          .map(s => assertValidImageFormat(s.realNull && s.assertString().text))
        const orientations = args[3].asList
          .toArray()
          .map(s => assertOrientation(s.assertString().text))
        const sizes = args[4].assertString('sizes').text

        const mediaQueries = await this.#generateMediaQueries(src, {
          widths,
          formats,
          orientations,
          sizes,
        })

        return cast.toSass(mediaQueries.imageSet)
      },
    }
  }

  /**
   * Sass functions, wrapped to support Sass's legacy `render` method.
   * @see {@link https://sass-lang.com/documentation/js-api/functions/render/}
   */
  get sassLegacyFunctions() {
    return toLegacyAsyncFunctions(this.sassFunctions)
  }
}

export { ResponsiveImages }
