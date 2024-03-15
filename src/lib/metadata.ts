import type { MediaQueriesOptions } from './media-queries'
import type Sizes from './sizes'
import type DeviceSizes from './device-sizes'
import type { Element, Root } from 'hast'
import EleventyImage from '@11ty/eleventy-img'

/**
 * Defines properties for image markup. `alt` is required.
 * Passed to the `EleventyImage.generateHTML` function.
 */
export interface HtmlOptions {
  alt: string
  sizes?: string
  [attribute: string]: unknown
}

export interface HastSource extends Element {
  tagName: 'source'
  // properties: {
  //   srcSet: string
  //   type?: string
  //   sizes?: string
  //   media?: string
  // }
  properties:
    | {
        srcSet: string
        type: string // should this be optional? if there's only one media type...
        sizes: string
      }
    | {
        srcSet: string
        type?: string
        media: string
      }
  children: []
}

export interface HastImage extends Element {
  tagName: 'img'
  properties: {
    alt: string
    src: string
    width: string
    height: string
    sizes?: string // optional because pictures using the `media` attribute won't use sizes
    srcSet?: string
  } & Element['properties']
  children: []
}

export interface HastOutput extends Root {
  children: [...HastSource[], HastImage]
}

function hastToHtml(hast: HastOutput): string {
  return hast.children.reduce((markup, e) => {
    const properties = Object.entries(e.properties)
      .reduce<string[]>((props, [key, value]) => {
        if (value === null || value === undefined || value === false)
          return props
        if (typeof value === 'object') {
          value = value.join(' ')
        }
        return props.concat(value === true ? key : `${key}="${value}"`)
      }, [])
      .join(' ')
    return markup + `<${e.tagName} ${properties}>`
  }, '')
}

/**
 * An object representing generated responsive images, and providing methods to represent that in markup.
 */
export default class Metadata {
  /** An object representing the generated images. This is the same object returned by the [EleventyImage](https://www.11ty.dev/docs/plugins/image/) function. */
  metadata: EleventyImage.Metadata // this could potentially be stored as MetadataEntry[][] or [string, MetadataEntry[]][]. i think it's always transformed into that when used
  /** Whether or not the output of {@link toSources} needs to be wrapped in a `<picture>` element. */
  needsPicture: boolean
  smallest: EleventyImage.MetadataEntry
  biggest: EleventyImage.MetadataEntry

  constructor(metadata: EleventyImage.Metadata) {
    this.metadata = metadata
    const metaValues = Object.values(metadata)
    this.needsPicture = metaValues.length > 1
    this.smallest = metaValues[metaValues.length - 1][0]
    this.biggest = metaValues[metaValues.length - 1][metaValues[0].length - 1]
  }

  /** @see {@link SizesMetadata.toPicture} */
  toPicture(attributes: Required<HtmlOptions>): string {
    return EleventyImage.generateHTML(this.metadata, attributes)
  }

  /** @see {@link SizesMetadata.toSources} */
  toSources(attributes: Required<HtmlOptions>): string {
    return this.toPicture(attributes).replace(/(^<picture>|<\/picture>$)/g, '')
  }

  /**
   * @param attributes
   * @see {@link SizesMetadata.toHast}
   */
  toHast({ sizes, alt, ...attributes }: Required<HtmlOptions>): HastOutput {
    const sources = Object.values(this.metadata).map(v => ({
      type: v[0].sourceType,
      srcSet: v.map(img => img.srcset).join(', '),
      sizes,
    }))
    const { srcSet } = sources.pop() ?? {}

    return {
      type: 'root',
      children: [
        ...sources.map<HastSource>(properties => ({
          type: 'element',
          tagName: 'source',
          properties,
          children: [],
        })),
        {
          type: 'element',
          tagName: 'img',
          properties: {
            alt,
            src: this.smallest.url,
            width: this.biggest.width.toString(),
            height: this.biggest.height.toString(),
            srcSet,
            sizes,
            ...attributes,
          },
          children: [],
        },
      ],
    }
  }
}

/**
 * A {@link Metadata} object produced from a sizes string. If the `sizes`
 * attribute is ommited from its methods, then it defaults to the original
 * sizes string.
 */
export class SizesMetadata extends Metadata {
  devices: DeviceSizes
  sizes: Sizes

  constructor(metadata: EleventyImage.Metadata, devices: DeviceSizes) {
    super(metadata)
    this.devices = devices
    this.sizes = devices.sizes
    this.needsPicture ||= !devices.sizes.isValid // also needs a picture wrapper if using media queries
  }

  /**
   * Returns responsive image markup. This is a thin wrapper around {@link
   * SizesMetadata.toSources}: it only adds a picture element with no
   * attributes.
   *
   * @param attributes - passed to the generated `<img>` element.
   * @return an HTML string
   */
  toPicture({ sizes = this.sizes.string, ...attributes }: HtmlOptions): string {
    if (this.sizes.isValid) {
      return super.toPicture({ sizes, ...attributes })
    }
    return `<picture>${this.toSources({ sizes, ...attributes })}</picture>`
  }

  /**
   * Returns responsive image markup, consisting of an `<img>` tag and any
   * number of `<source>` tags. The output must be wrapped in a `<picture>`
   * element, unless {@link needsPicture} is false.
   *
   * @param attributes - passed to the generated `<img>` element.
   * @return an HTML string
   */
  toSources({ sizes = this.sizes.string, ...attributes }: HtmlOptions): string {
    if (this.sizes.isValid) {
      return super.toSources({ sizes, ...attributes })
    }
    return hastToHtml(this.toHast({ sizes, ...attributes }))
  }

  /**
   * Returns the responsive image markup as an AST. This is useful if you want
   * to pass it to something like JSX.
   *
   * @return AST representing the responsive image markup
   * @see {@link https://github.com/syntax-tree/hast}
   */
  toHast(
    { sizes = this.sizes.string, ...attributes }: HtmlOptions,
    options: MediaQueriesOptions = {},
  ): HastOutput {
    if (this.sizes.isValid) {
      return super.toHast({ sizes, ...attributes })
    }
    // const options = {} // how to pass this in?
    const sources = this.devices.toMediaQueries(this, options).toSources()
    const { srcSet } = sources.pop() ?? {}

    return {
      type: 'root',
      children: [
        ...sources.map<HastSource>(properties => ({
          type: 'element',
          tagName: 'source',
          properties,
          children: [],
        })),
        {
          type: 'element',
          tagName: 'img',
          properties: {
            src: this.smallest.url,
            width: this.biggest.width.toString(),
            height: this.biggest.height.toString(),
            srcSet,
            ...attributes,
          },
          children: [],
        },
      ],
    }
  }

  /**
   * Returns CSS to display the image as a `background-image`. This uses a number of non-overlapping media queries and the [image-set](https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set) function, with a fallback for unsupported browsers.
   *
   * This also depends on the `resolution` media queries, which are supported in most modern browsers.
   *
   * @return a CSS string
   *
   * @see {@link https://caniuse.com/css-image-set}
   * @see {@link https://caniuse.com/css-media-resolution}
   */
  toCss(selector: string, options: MediaQueriesOptions = {}): string {
    return this.devices.toMediaQueries(this, options).toCss(selector)
  }
}

/*
 * Refactor
 *
 * Basically things should go:
 *
 * Sizes + Devices + (Image) => Widths / Queries
 * Image + Widths => Metadata
 * Metadata + Queries => CSS / Html
 *
 * Image is optional-ish for Widths / Queries. Only needed for
 * maxWidth, which is only needed in order to properly run
 * filterSizes (have to apply max first). Widths returned by
 * Sizes + Devices could be unfiltered, only filter when generating
 * image metadata... might affect queries too...? yeah queries need
 *
 * Maybe better:
 *
 * Sizes + Devices => UnfilteredWidths (representing all wanted images)
 * Image + UnfilteredWidths + ScalingFactor => Metadata
 * Sizes + Devices + Metadata => Queries => CSS / HTML (skipping query map, generate something like MediaQueries)
 *
 * The type of Html generated from Metadata depends on whether
 * the query has any height-constrained queries (not currently
 * implemented).
 *
 * Probably the move is to write a bunch of functions that consume
 * these types and produce these other types, then write classes
 * around those to get the method-chaining thing I want.
 *
 * Might end up that I need a class to consume Sizes + Devices
 * (currently QueryMap) and then handle most things with methods
 * from there. This could become unwieldy quickly though.
 *
 */
