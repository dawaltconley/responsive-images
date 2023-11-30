import type Device from './device'
import type { ImageSource, Metadata, MetadataEntry } from '@11ty/eleventy-img'
import EleventyImage from '@11ty/eleventy-img'
import Sizes from './sizes'
import { filterSizes } from './utilities'

export interface ImageOptions extends EleventyImage.BaseImageOptions {
  disableResize?: boolean
}

export default class Image {
  src: ImageSource
  defaults: ImageOptions
  disabled: boolean

  constructor(
    src: ImageSource,
    { disableResize = false, ...options }: ImageOptions = {}
  ) {
    this.src = src
    this.defaults = options
    this.disabled = disableResize
  }

  /**
   * Generates multiple new sizes for an image. This is a wrapper method around
   * `@11ty/eleventy-img`, which just handles default options and allows disabling.
   * @param image - file or url of the source image
   * @param options - options passed to `@11ty/eleventy-img`
   * @returns a promise resolving to a metadata object for the generated images
   */
  async resize(options: ImageOptions = {}): Promise<Metadata> {
    let imgOpts = {
      ...this.defaults,
      ...options,
    }
    if (this.disabled)
      imgOpts = {
        ...imgOpts,
        widths: [null],
        formats: [null],
      }
    return EleventyImage(this.src, imgOpts)
  }

  async stat(): Promise<MetadataEntry> {
    return this.resize({
      statsOnly: true,
      widths: [null],
      formats: [null],
    }).then(metadata => Object.values(metadata)[0][0])
  }
}

// could be a method on QueryMap, or some similar class
// that combines Sizes and Device[]
export async function resizeFromSizes(
  image: Image,
  sizes: Sizes, // could attach devices to sizes, potentially easier than attaching to image
  devices: Device[],
  { minScale, ...options }: ImageOptions & { minScale?: number } = {}
): Promise<Metadata> {
  const { width: maxWidth } = await image.stat()
  const widths = filterSizes(
    sizes
      .toWidths(devices)
      .filter(w => w <= maxWidth)
      .sort((a, b) => b - a),
    minScale
  )
  return image.resize({ widths: widths, ...options })
}

import type Config from './config'

export class ConfiguredImage extends Image {
  devices: Device[]
  scalingFactor: number

  constructor(
    image: ImageSource,
    { defaults, scalingFactor, disable, devices }: Config
  ) {
    super(image, { ...defaults, disableResize: disable })
    this.devices = devices
    this.scalingFactor = scalingFactor
  }

  async fromSizes(
    sizesQueryString: string,
    options: EleventyImage.ImageOptions = {}
  ): Promise<Metadata> {
    const { width: maxWidth } = await this.stat()
    const widths = filterSizes(
      new Sizes(sizesQueryString)
        .toWidths(this.devices)
        .filter(w => w <= maxWidth)
        .sort((a, b) => b - a),
      this.scalingFactor
    )
    return this.resize({ widths, ...options })
  }
}
