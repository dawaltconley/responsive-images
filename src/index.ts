/**
 * The main imports.
 *
 * ```
 * import ResponsiveImages from '@dawaltconley/responsive-images'
 * ```
 *
 * @see {@link ResponsiveImages}
 * @see {@link getWidthsFromSizes}
 *
 * @module
 */

import type { HtmlOptions } from './lib/metadata'
import type {
  ImageSource,
  ImageOptions,
  BaseImageOptions,
  Metadata as EleventyMetadata,
} from '@11ty/eleventy-img'
import Config, { ConfigOptions } from './lib/config'
import { ConfiguredImage } from './lib/image'
import {
  getWidthsFromSizes,
  type WidthsFromSizesOptions,
} from './lib/widthsFromSizes'

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

/**
 * This class can be used set global configuration options which are inherited but its subsequent methods.
 * @group public
 */
export default class ResponsiveImages extends Config {
  constructor(options?: ConfigOptions) {
    super(options)
    this.responsive = this.responsive.bind(this)
    this.resize = this.resize.bind(this)
    this.pictureFromSizes = this.pictureFromSizes.bind(this)
    this.sourceFromSizes = this.sourceFromSizes.bind(this)
  }

  /**
   * This is the main entrypoint for the responsive image API.
   * @param image - The path to an image that you want to make responsive; either a local image file or a url.
   * @returns An object with a few methods for resizing the image.
   */
  responsive(image: ImageSource): ConfiguredImage {
    return new ConfiguredImage(image, this)
  }

  async resize(
    image: ImageSource,
    options: ImageOptions = {},
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
    kwargs: MixedOptions,
  ): Promise<string> {
    const [options, properties] = this.#handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toPicture(properties))
  }

  async sourceFromSizes(
    image: ImageSource,
    kwargs: MixedOptions,
  ): Promise<string> {
    const [options, properties] = this.#handleMixedOptions(kwargs)
    const { sizes = '100vw' } = properties
    return this.responsive(image)
      .fromSizes(sizes, options)
      .then(meta => meta.toSources(properties))
  }

  /**
   * Same as {@link getWidthsFromSizes} but inheriting the default `devices`
   * and `scalingFactor` of this ResponsiveImages instance.
   */
  getWidthsFromSizes(
    sizes: string,
    { width, height }: Pick<WidthsFromSizesOptions, 'width' | 'height'> = {},
  ): number[] {
    return getWidthsFromSizes(sizes, {
      devices: this.devices,
      scalingFactor: this.scalingFactor,
      width,
      height,
    })
  }
}

export { ResponsiveImages, getWidthsFromSizes }
export type { Config, ConfigOptions, WidthsFromSizesOptions }

export { default as DeviceSizes } from './lib/device-sizes'
export { default as Sizes, SizesQuery } from './lib/sizes'
export type {
  default as Device,
  DeviceDefinition,
  DeviceOptions,
} from './lib/device'
export { default as Image } from './lib/image'
export {
  default as Metadata,
  SizesMetadata,
  HtmlOptions,
  HastOutput,
  HastSource,
  HastImage,
} from './lib/metadata'
export {
  default as UnitValue,
  Unit,
  units,
  ImageSize,
  ImageUnit,
} from './lib/unit-values'
export type { ConfiguredImage, ImageOptions } from './lib/image'
export type {
  default as MediaQueries,
  MediaQuery,
  MediaQueriesOptions,
  ImageSet,
  ImageSetMap,
} from './lib/media-queries'
export type { ResizeFromSizesOptions } from './lib/utilities'
export type { ChainedPromise, Async } from './lib/chained-promise'
export { SizeKeyword, Rect, ResizeInstructions } from './lib/common'
