import type { MediaQueriesOptions } from './media-queries'
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

type Source = {
  type: string
  srcSet: string
  sizes: string
}

type Img = {
  alt: string
  src: string
  width: string
  height: string
  sizes: string
  srcSet?: string
}

export interface HastSource extends Element {
  tagName: 'source'
  properties: Source
  children: []
}

export interface HastImage extends Element {
  tagName: 'img'
  properties: Img & Element['properties']
  children: []
}

export interface HastOutput extends Root {
  children: [...HastSource[], HastImage]
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

  toHast({ sizes, alt, ...attributes }: Required<HtmlOptions>): HastOutput {
    const metaValues = Object.values(this.metadata)
    const smallest = metaValues[metaValues.length - 1][0]
    const biggest = metaValues[metaValues.length - 1][metaValues[0].length - 1]

    const sources = metaValues.map<Source>(v => ({
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
            src: smallest.url,
            width: biggest.width.toString(),
            height: biggest.height.toString(),
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

  toHast(attributes: HtmlOptions): HastOutput {
    return super.toHast({ sizes: this.devices.sizes.string, ...attributes })
  }

  toCss(selector: string, options: MediaQueriesOptions = {}): string {
    return this.devices.toMediaQueries(this, options).toCss(selector)
  }
}
