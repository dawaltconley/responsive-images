import type { HtmlOptions } from './lib/metadata'
import type {
  ImageSource,
  ImageOptions,
  BaseImageOptions,
  Metadata as EleventyMetadata,
} from '@11ty/eleventy-img'
import Config, { ConfigOptions } from './lib/config'
import { ConfiguredImage } from './lib/image'

/**
 * Options passed to the EleventyImage resize function.
 */
export interface ResizeOptions {
  /** @see {@link https://www.11ty.dev/docs/plugins/image/} */
  widths?: BaseImageOptions['widths']
  /** @see {@link https://www.11ty.dev/docs/plugins/image/} */
  formats?: BaseImageOptions['formats']
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

  responsive(image: ImageSource): ConfiguredImage {
    return new ConfiguredImage(image, this)
  }

  async resize(
    image: ImageSource,
    options: ImageOptions = {}
  ): Promise<EleventyMetadata> {
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
    image: ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this.#handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toPicture(properties))
  }

  async sourceFromSizes(
    image: ImageSource,
    kwargs: MixedOptions
  ): Promise<string> {
    const [options, properties] = this.#handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toSources(properties))
  }
}

export { ResponsiveImages }
