import EleventyImage from '11ty__eleventy-img'
import generateHTML from '11ty__eleventy-img/generate-html'
import { SassList, SassString, SassNumber, Value } from 'sass/types'

import Image from '@11ty/eleventy-img'
import cast from 'sass-cast'
import defaultDevices from './data/devices'
import { parseSizes, deviceWidths, widthsFromSizes } from './utilities'
// const { images, queries } = require(path.join('data', 'responsive'))

interface KeywordArguments extends EleventyImage.BaseImageOptions {
  alt: string
  sizes: string
  __keywords?: true
}

type ImageMetadataByWidth = Record<number, EleventyImage.MetadataEntry>

type ImageMap = Record<Query.Orientation, Dimension[]>

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

class ResponsiveImageFunctions {
  defaults?: EleventyImage.ImageOptions
  // images: ImageMap
  devices: Device[]
  // queries: Query.Map
  sassPrefix: string
  scalingFactor?: number

  constructor(
    options?: Partial<{
      defaults: Partial<EleventyImage.ImageOptions>
      images: ImageMap
      devices: Device[]
      queries: Query.Map
      sassPrefix: string
    }>
  ) {
    let {
      defaults = {},
      images,
      devices = defaultDevices,
      queries,
      sassPrefix = 'image',
    } = options || {}

    this.defaults = defaults
    // this.images = images
    this.devices = devices
    // this.queries = queries
    this.sassPrefix = sassPrefix

    this.resize = this.resize.bind(this)
    this.generatePicture = this.generatePicture.bind(this)
    this.generateSources = this.generateSources.bind(this)
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
    return Image(image, {
      ...this.defaults,
      ...options,
    })
  }

  async generatePicture(
    image: Image.ImageSource,
    kwargs: Partial<KeywordArguments> = {}
  ): Promise<string> {
    let { widths, formats, ...properties } = kwargs
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
      sizes: sizes,
      widths: widthsFromSizes(sizes, {
        devices: this.devices,
        minScale: this.scalingFactor,
      }),
      ...generatorOptions,
    })
  }

  pictureFromSizes(
    image: Image.ImageSource,
    kwargs: KeywordArguments = { alt: '', sizes: '100vw' }
  ): Promise<string> {
    return this._fromSizes('generatePicture', image, kwargs)
  }

  sourceFromSizes(
    image: Image.ImageSource,
    kwargs: KeywordArguments = { alt: '', sizes: '100vw' }
  ): Promise<string> {
    return this._fromSizes('generateSources', image, kwargs)
  }

  get sassFunctions() {
    const resizeFunction = `${this.sassPrefix}-resize($src, $widths: null, $formats: null)`
    const queriesFunction = `${this.sassPrefix}-queries($src, $widths: null, $formats: jpeg, $orientation: landscape portrait)`
    return {
      [resizeFunction]: async (args: [SassString, SassList, SassList]) => {
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
      [queriesFunction]: async (
        args: [SassString, SassList, SassList, SassList]
      ) => {
        let src = args[0].assertString('src').text
        let widths =
          args[1].realNull &&
          args[1].asList
            .toArray()
            .map(n => n.realNull && n.assertNumber().value)
        let formats = args[2].asList
          .toArray()
          .map(s => assertValidImageFormat(s.realNull && s.assertString().text))
        // TODO support multiple image formats using image-set and fallbacks https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set#providing_a_fallback
        if (formats.length > 1)
          throw new Error(
            `Currently only one background image format is supported, but multiple formats were specified: (${formats.join(
              ', '
            )})`
          )
        let orientations = args[3].asList
          .toArray()
          .map(s => s.assertString().text)

        if (!widths)
          // fallback based on orientation
          widths = Object.entries(this.images)
            .reduce((flat: number[], [o, sizes]) => {
              if (!orientations.includes(o)) return flat
              let widths = sizes.map(s => s.w)
              return flat.concat(widths)
            }, [])
            .filter((w, i, arr) => arr.indexOf(w) === i)

        const mediaQueries: SassQuery[] = []
        const metadata = await this.resize(src, { widths, formats })
        // this is just picking the metadata images from the first resize format, since only one can be specified
        const metadataEntry = Object.values(
          metadata
        )[0] as EleventyImage.MetadataEntry[]

        const metaByWidth: ImageMetadataByWidth = {}

        for (const o of orientations) {
          if (!isOrientation(o)) {
            console.warn(`Unrecognized orientation "${o}", skipping`)
            continue
          }
          const orientation = orientations.length > 1 && o

          let q = this.queries[o as keyof Query.Map] as Query.Object[]
          q.forEach(({ w, images }, i, queries) => {
            const next = queries[i + 1]
            const maxWidth = i > 0 && w,
              minWidth = next && next.w

            images.forEach((image, j, images) => {
              const next = images[j + 1]
              let imageMeta: EleventyImage.MetadataEntry | undefined =
                metaByWidth[image.w]
              if (imageMeta === undefined) {
                imageMeta = metadataEntry.find(m => m.width === image.w)
                if (!imageMeta)
                  throw new Error(
                    `Resize error: media query needs image of width ${image.w}, but none was created.`
                  )
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

        return cast.toSass(mediaQueries)
      },
    }
  }
}

export default ResponsiveImageFunctions
