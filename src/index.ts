import type EleventyImage from '11ty__eleventy-img'
import type { Value as SassValue, CustomFunction } from 'sass/types'

import Image from '@11ty/eleventy-img'
import cast from 'sass-cast'
import defaultDevices from './data/devices'
import { filterSizes, widthsFromSizes, queriesFromSizes } from './utilities'

interface KeywordArguments extends EleventyImage.BaseImageOptions {
  alt: string
  sizes?: string
  __keywords?: true
}

type ImageMetadataByWidth = Record<number, EleventyImage.MetadataEntry>

type ValidImageFormat = 'auto' | EleventyImage.ImageFormatWithAliases | null

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

const assertValidImageFormat = (test: any): ValidImageFormat => {
  if (!validImageFormats.includes(test))
    throw new Error(`Invalid image format: ${test}`)
  return test
}

const validOrientations: Query.Orientation[] = ['landscape', 'portrait']

const isOrientation = (test: any): test is Query.Orientation =>
  validOrientations.includes(test)

export interface ResponsiveImagesOptions {
  defaults?: Partial<EleventyImage.ImageOptions>
  devices?: Device[]
  sassPrefix?: string
  scalingFactor?: number
  disable?: boolean
}

class ResponsiveImageFunctions implements ResponsiveImagesOptions {
  defaults: Partial<EleventyImage.ImageOptions>
  devices: Device[]
  sassPrefix: string
  scalingFactor: number
  disable: boolean

  constructor(options?: Partial<ResponsiveImagesOptions>) {
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
    this.pictureFromSizes = this.pictureFromSizes.bind(this)
    this.sourceFromSizes = this.sourceFromSizes.bind(this)
  }

  /**
   * @param {string} image - file or url of the source image
   * @param {Object} [options] - options used by eleventy-img
   * @returns {Promise<Object>} - a promise resolving to a metadata object for the generated images
   */
  resize(
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
    return Image(image, imgOpts)
  }

  async generatePicture(
    image: Image.ImageSource,
    kwargs: Partial<KeywordArguments> = {}
  ): Promise<string> {
    let {
      widths = this.defaults.widths,
      formats = this.defaults.formats,
      ...properties
    } = kwargs
    delete properties.__keywords

    let metadata = await this.resize(image, { widths, formats })
    return Image.generateHTML(metadata, {
      alt: '',
      ...properties,
    })
  }

  async generateSources(
    image: Image.ImageSource,
    kwargs: Partial<KeywordArguments> = {}
  ): Promise<string> {
    let html = await this.generatePicture(image, kwargs)
    return html.replace(/(^<picture>|<\/picture>$)/g, '')
  }

  private _fromSizes(
    method: 'generatePicture' | 'generateSources',
    image: Image.ImageSource,
    kwargs: KeywordArguments
  ): Promise<string> {
    let { sizes, ...generatorOptions } = kwargs
    delete generatorOptions.__keywords
    return this[method](image, {
      ...(sizes
        ? {
            sizes: sizes,
            widths: widthsFromSizes(sizes, {
              devices: this.devices,
              minScale: this.scalingFactor,
            }),
          }
        : {}),
      ...generatorOptions,
    })
  }

  pictureFromSizes(
    image: Image.ImageSource,
    kwargs: Partial<KeywordArguments> = {}
  ): Promise<string> {
    return this._fromSizes('generatePicture', image, { alt: '', ...kwargs })
  }

  sourceFromSizes(
    image: Image.ImageSource,
    kwargs: Partial<KeywordArguments> = {}
  ): Promise<string> {
    return this._fromSizes('generateSources', image, { alt: '', ...kwargs })
  }

  async generateMediaQueries(
    src: Image.ImageSource,
    kwargs?: Partial<{
      widths: (number | null)[] | null
      formats: ValidImageFormat[]
      orientations: string[]
      sizes: SizesQuery.String
    }>
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

    let originalImage = await Image(src, {
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
          if (!orientations.includes(o)) return flat
          let widths = queries.reduce((flat: number[], { images }) => {
            return flat.concat(images.map(img => img.w))
          }, [])
          return flat.concat(widths)
        },
        []
      )
    let filteredWidths = widths
      .map(w => (w === null ? originalImage.width : w))
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
        let widths =
          args[1].realNull &&
          args[1].asList
            .toArray()
            .map(n => n.realNull && n.assertNumber().value)
        let formats = args[2].asList
          .toArray()
          .map(s => assertValidImageFormat(s.realNull && s.assertString().text))
        let orientations = args[3].asList
          .toArray()
          .map(s => s.assertString().text)
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

export default ResponsiveImageFunctions
