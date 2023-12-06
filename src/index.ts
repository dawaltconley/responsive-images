import type { Value as SassValue, CustomFunction } from 'sass/types'
import type { HtmlOptions } from './lib/metadata'

import EleventyImage from '@11ty/eleventy-img'
import cast from 'sass-cast'
import { assertOrientation, assertValidImageFormat } from './lib/common'
import Config, { ConfigOptions } from './lib/config'
import { ConfiguredImage } from './lib/image'
import DeviceSizes from './lib/device-sizes'
import { toLegacyAsyncFunctions } from './sass/legacy'

/**
 * Options passed to the EleventyImage resize function.
 */
export interface ResizeOptions {
  /** @see {@link https://www.11ty.dev/docs/plugins/image/} */
  widths?: EleventyImage.BaseImageOptions['widths']
  /** @see {@link https://www.11ty.dev/docs/plugins/image/} */
  formats?: EleventyImage.BaseImageOptions['formats']
}

export interface MixedOptions extends HtmlOptions, ResizeOptions {}

export type { ConfigOptions }

export default class ResponsiveImages extends Config {
  constructor(options?: ConfigOptions) {
    super(options)
    this.responsive = this.responsive.bind(this)
    this.pictureFromSizes = this.pictureFromSizes.bind(this)
    this.sourceFromSizes = this.sourceFromSizes.bind(this)
  }

  responsive(image: EleventyImage.ImageSource): ConfiguredImage {
    return new ConfiguredImage(image, this)
  }

  async resize(
    image: EleventyImage.ImageSource,
    options: EleventyImage.ImageOptions = {}
  ): Promise<EleventyImage.Metadata> {
    const { metadata } = await this.responsive(image).resize(options)
    return metadata
  }

  #handleMixedOptions(options: MixedOptions): [ResizeOptions, HtmlOptions] {
    const { widths, formats, ...html } = options
    const resizeOpts: ResizeOptions = {}
    if (widths) resizeOpts.widths = widths
    if (formats) resizeOpts.formats = formats
    return [resizeOpts, html]
  }

  async pictureFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this.#handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toPicture(properties))
  }

  async sourceFromSizes(
    image: EleventyImage.ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this.#handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toSources(properties))
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

        const image = this.responsive(src)
        const deviceImages = new DeviceSizes(sizes, this.devices)
        const metadata = widths
          ? await image.resize({ widths, formats })
          : await deviceImages.resize(image, {
              formats,
              minScale: this.scalingFactor,
            })
        const mediaQueries = deviceImages.toMediaQueries(metadata, {
          orientations,
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
