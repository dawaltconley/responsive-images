import type Device from './device'
import type { ImageSource, MetadataEntry } from '@11ty/eleventy-img'
import EleventyImage from '@11ty/eleventy-img'
import { RemoteAssetCache } from '@11ty/eleventy-fetch'
import DeviceSizes from './device-sizes'
import Metadata, { SizesMetadata } from './metadata'
import { isUrl, resizeFromSizes } from './utilities'
import { chain, type ChainedPromise } from './chained-promise'

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
  resize(options: ImageOptions = {}): ChainedPromise<Metadata> {
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
    return chain(EleventyImage(this.src, imgOpts).then(m => new Metadata(m)))
  }

  /** if the Image src is a url to a remote image, this method downloads and caches the entire image */
  async stat(): Promise<MetadataEntry> {
    const src = this.src.toString()
    const { cacheOptions } = this.defaults

    // handle remote assets
    if (isUrl(src)) {
      const cache = new RemoteAssetCache(
        src,
        cacheOptions?.directory,
        cacheOptions
      )
      await cache.fetch()
      const metadata = await EleventyImage(cache.getCachedContentsPath(), {
        statsOnly: true,
        widths: [null],
        formats: [null],
        cacheOptions,
      })
      return Object.values(metadata)[0][0]
    }

    return this.resize({
      statsOnly: true,
      widths: [null],
      formats: [null],
    }).then(({ metadata }) => Object.values(metadata)[0][0])
  }
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

  // should export EleventyImage.ImageOptions somehow...
  fromSizes(
    sizesQueryString: string,
    options: EleventyImage.ImageOptions = {}
  ): ChainedPromise<SizesMetadata> {
    const getMetadata = async () => {
      const sizes = new DeviceSizes(sizesQueryString, this.devices)
      const { metadata } = await resizeFromSizes(this, sizes, {
        minScale: this.scalingFactor,
        ...options,
      })
      return new SizesMetadata(metadata, sizes)
    }
    return chain(getMetadata())
  }
}
