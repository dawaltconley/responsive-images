import type { MediaQueriesOptions } from './media-queries'
import type DeviceSizes from './device-sizes'
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

  toPicture(attributes: HtmlOptions): string {
    return EleventyImage.generateHTML(this.metadata, attributes)
  }

  toSources(attributes: HtmlOptions): string {
    return this.toPicture(attributes).replace(/(^<picture>|<\/picture>$)/g, '')
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

  toCss(selector: string, options: MediaQueriesOptions = {}): string {
    return this.devices.toMediaQueries(this, options).toCss(selector)
  }
}
