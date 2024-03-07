import type { MediaQueriesOptions } from './media-queries'
import type DeviceSizes from './device-sizes'
import type { Element, Root as Hast } from 'hast'
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

export default class Metadata {
  metadata: EleventyImage.Metadata

  constructor(metadata: EleventyImage.Metadata) {
    this.metadata = metadata
  }

  toPicture(attributes: Required<HtmlOptions>): string {
    return EleventyImage.generateHTML(this.metadata, attributes)
  }

  toSources(attributes: Required<HtmlOptions>): string {
    return this.toPicture(attributes).replace(/(^<picture>|<\/picture>$)/g, '')
  }

  toHast({ sizes, alt, ...attributes }: HtmlOptions): Hast {
    const metaValues = Object.values(this.metadata)
    const smallest = metaValues[metaValues.length - 1][0]
    const biggest = metaValues[metaValues.length - 1][metaValues[0].length - 1]

    const sources = metaValues.map(v => ({
      type: v[0].sourceType,
      srcSet: v.map(img => img.srcset).join(', '),
      sizes,
    }))
    const { type, ...imgSources } = sources.pop() ?? {}

    return {
      type: 'root',
      children: [
        ...sources.map<Element>(properties => ({
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
            src: smallest.url,
            width: biggest.width,
            height: biggest.height,
            ...imgSources,
            ...attributes,
          },
          children: [],
        },
      ],
    }
  }
}

export class SizesMetadata extends Metadata {
  devices: DeviceSizes

  constructor(metadata: EleventyImage.Metadata, devices: DeviceSizes) {
    super(metadata)
    this.devices = devices
  }

  toPicture(attributes: HtmlOptions): string {
    return super.toPicture({ sizes: this.devices.sizes.string, ...attributes })
  }

  toSources(attributes: HtmlOptions): string {
    return super.toSources({ sizes: this.devices.sizes.string, ...attributes })
  }

  toHast(attributes: HtmlOptions): Hast {
    return super.toHast({ sizes: this.devices.sizes.string, ...attributes })
  }

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
