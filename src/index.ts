import type { Value as SassValue, CustomFunction } from 'sass/types'
import type { Orientation, Device, SassQuery } from './types'

import EleventyImage from '@11ty/eleventy-img'
import cast from 'sass-cast'
import defaultDevices from './data/devices'
import { isOrientation } from './types'
import { filterSizes, widthsFromSizes, queriesFromSizes } from './utilities'

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

type ImageMetadataByWidth = Record<number, EleventyImage.MetadataEntry>

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

const assertOrientation = (test: any): Orientation => {
  if (!isOrientation(test)) {
    throw new Error(`Invalid orientation: ${test}`)
  }
  return test
}

const assertValidImageFormat = (test: any): ValidImageFormat => {
  if (!validImageFormats.includes(test))
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
  devices?: Device[]

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
    let {
      defaults = {},
      devices = defaultDevices,
      sassPrefix = 'image',
      scalingFactor = 0.8,
      disable = false,
    } = options || {}

    this.defaults = defaults
    this.devices = devices
    this.sassPrefix = sassPrefix
    this.scalingFactor = scalingFactor
    this.disable = disable

    this.resize = this.resize.bind(this)
    this.generatePicture = this.generatePicture.bind(this)
    this.generateSources = this.generateSources.bind(this)
    this.metadataFromSizes = this.metadataFromSizes.bind(this)
    this.pictureFromSizes = this.pictureFromSizes.bind(this)
    this.sourceFromSizes = this.sourceFromSizes.bind(this)
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
    options: Partial<EleventyImage.ImageOptions> = {}
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
    let html = await this.generatePicture(image, kwargs)
    return html.replace(/(^<picture>|<\/picture>$)/g, '')
  }

  /**
   * Calculates image widths from a sizes query string.
   * Uses configured defaults for the `devices` and `scalingFactor`.
   */
  widthsFromSizes(sizes: string): number[] {
    return widthsFromSizes(sizes, {
      devices: this.devices,
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
    kwargs: FromSizesOptions = {}
  ): Promise<EleventyImage.Metadata> {
    const options = this._handleFromSizes(kwargs)
    return this.resize(image, options)
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

  async generateMediaQueries(
    src: EleventyImage.ImageSource,
    kwargs?: MediaQueryOptions
  ): Promise<SassQuery[]> {
    let {
      widths = null,
      formats = [null],
      orientations = ['landscape', 'portrait'],
      sizes = '100vw',
    } = kwargs || {}

    // TODO support multiple image formats using image-set and fallbacks https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set#providing_a_fallback
    if (formats.length > 1)
      throw new Error(
        `Currently only one background image format is supported, but multiple formats were specified: (${formats.join(
          ', '
        )})`
      )

    let originalImage = await EleventyImage(src, {
      statsOnly: true,
      widths: [null],
      formats: [null],
    }).then(metadata => Object.values(metadata)[0][0])

    let queries = queriesFromSizes(sizes, {
      devices: this.devices,
    })

    if (!widths)
      // fallback based on queries
      widths = Object.entries(queries).reduce(
        (flat: number[], [o, queries]) => {
          if (isOrientation(o) && !orientations.includes(o)) return flat
          let widths = queries.reduce((flat: number[], { images }) => {
            return flat.concat(images.map(img => img.w))
          }, [])
          return flat.concat(widths)
        },
        []
      )
    let filteredWidths = widths
      .map(w => (w === null || w === 'auto' ? originalImage.width : w))
      .filter(w => w <= originalImage.width)
    filteredWidths = filterSizes(filteredWidths, this.scalingFactor)

    const mediaQueries: SassQuery[] = []
    let metadata = await this.resize(src, {
      widths: filteredWidths,
      formats,
    }).then(
      // just picking the metadata images from the first resize format, since only one can be specified
      formats => Object.values(formats)[0] as EleventyImage.MetadataEntry[]
    )
    metadata = metadata.sort((a, b) => b.width - a.width)

    const metaByWidth: ImageMetadataByWidth = {}

    for (const o of orientations) {
      if (!isOrientation(o)) {
        console.warn(`Unrecognized orientation "${o}", skipping`)
        continue
      }
      const orientation = orientations.length > 1 && o

      queries[o].forEach(({ w, images }, i, queries) => {
        const next = queries[i + 1]
        const maxWidth = i > 0 && w,
          minWidth = next && next.w

        images.forEach((image, j, images) => {
          const next = images[j + 1]
          let imageMeta: EleventyImage.MetadataEntry | undefined =
            metaByWidth[image.w]
          if (imageMeta === undefined) {
            imageMeta = originalImage
            for (let i = 0, l = metadata.length; i < l; i++) {
              let m = metadata[i]
              let next = metadata[i + 1]
              if (m.width >= image.w && (!next || next.width < image.w)) {
                imageMeta = m
                break
              }
            }
            metaByWidth[image.w] = imageMeta
          }
          const { url, sourceType, format } = imageMeta
          const mq: SassQuery = {
            orientation,
            maxWidth,
            minWidth,
            maxResolution: j > 0 && image.dppx,
            minResolution: next && next.dppx,
            url,
            sourceType,
            format,
          }
          mediaQueries.push(mq)
        })
      })
    }

    return mediaQueries
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
        let src: string = args[0].assertString('src').text
        let widths = args[1].asList
          .toArray()
          .map(n => n.realNull && n.assertNumber('widths').value)
        let formats = args[2].asList
          .toArray()
          .map(s =>
            assertValidImageFormat(s.realNull && s.assertString('formats').text)
          )

        let metadata = await this.resize(src, { widths, formats })
        return cast.toSass(metadata)
      },
      [queriesFunction]: async (args: SassValue[]): Promise<SassValue> => {
        let src = args[0].assertString('src').text
        let widths = args[1].realNull
          ? args[1].asList
              .toArray()
              .map(n => n.realNull && n.assertNumber().value)
          : undefined
        let formats = args[2].asList
          .toArray()
          .map(s => assertValidImageFormat(s.realNull && s.assertString().text))
        let orientations = args[3].asList
          .toArray()
          .map(s => assertOrientation(s.assertString().text))
        let sizes = args[4].assertString('sizes').text

        let mediaQueries = await this.generateMediaQueries(src, {
          widths,
          formats,
          orientations,
          sizes,
        })

        return cast.toSass(mediaQueries)
      },
    }
  }
}

export { ResponsiveImages }
