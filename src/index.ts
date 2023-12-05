import type { Value as SassValue, CustomFunction } from 'sass/types'
import type { Orientation } from './types'
import type { MediaQuery } from './media-queries'
import type MediaQueries from './media-queries'

import EleventyImage from '@11ty/eleventy-img'
import cast from 'sass-cast'
import { assertOrientation, assertValidImageFormat } from './types'
import Config, { ConfigOptions } from './config'
import Image, { ConfiguredImage } from './image'
import DeviceSizes from './device-sizes'
import { toLegacyAsyncFunctions } from './legacy-sass'

/**
 * Defines properties for image markup. `alt` is required.
 * Passed to the `EleventyImage.generateHTML` function.
 */
export interface HtmlOptions {
  alt: string
  sizes?: string
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

export type { ConfigOptions }

export default class ResponsiveImages extends Config {
  constructor(options?: ConfigOptions) {
    super(options)

    this.resize = this.resize.bind(this)
    this.responsive = this.responsive.bind(this)
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

  responsive(image: EleventyImage.ImageSource): ConfiguredImage {
    return new ConfiguredImage(image, this)
  }

  async generatePicture(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this._handleMixedOptions(kwargs)
    return this.responsive(image)
      .resize(options)
      .then(meta => meta.toPicture(properties))
  }

  async generateSources(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this._handleMixedOptions(kwargs)
    return this.responsive(image)
      .resize(options)
      .then(meta => meta.toSources(properties))
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
   * Uses a sizes attribute to parse images and returns a metadata object. Defaults to 100vw.
   */
  async metadataFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<ImageMetadata> {
    const [options, properties] = this._handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    const { metadata } = await new DeviceSizes(sizes, this.devices).resize(
      new Image(image),
      options
    )
    return {
      ...properties,
      metadata,
    }
  }

  async pictureFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this._handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toPicture(properties))
  }

  async sourceFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this._handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toSources(properties))
  }

  async #generateMediaQueries(
    src: EleventyImage.ImageSource,
    kwargs: MediaQueryOptions = {}
  ): Promise<MediaQueries> {
    const {
      widths = null,
      formats = this.defaults.formats || [null],
      orientations = ['landscape', 'portrait'],
      sizes = '100vw',
    } = kwargs

    const image = this.responsive(src)
    const deviceImages = new DeviceSizes(sizes, this.devices)
    const metadata = widths
      ? await image.resize({ widths, formats })
      : await deviceImages.resize(image, {
          formats,
          minScale: this.scalingFactor,
        })
    return deviceImages.toMediaQueries(metadata, { orientations })
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

        const { metadata } = await this.responsive(src).resize({
          widths,
          formats,
        })
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
