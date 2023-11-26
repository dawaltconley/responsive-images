import type { Dimension, Orientation, Image } from './types'
import type { MediaCondition } from './sizes'
import type Sizes from './sizes'
import { deviceImages } from './utilities'

/** represents a supported device */
export interface DeviceDefinition extends Dimension {
  /** possible dppx for devices with these dimensions */
  dppx?: number[]

  /** whether the device can be rotated and the dimensions flipped */
  flip?: boolean
}

export default class Device implements DeviceDefinition {
  w: number
  h: number
  dppx: number[]
  flip: boolean

  constructor({ w, h, dppx = [1], flip = false }: DeviceDefinition) {
    this.w = w
    this.h = h
    this.dppx = dppx
    this.flip = w !== h && flip

    // always include a dppx value of one for queries, to avoid upscaling when screen resizes on larger 1dppx displays.
    if (this.dppx.indexOf(1) < 0) this.dppx.push(1)
  }

  get orientation(): Orientation {
    return this.w >= this.h ? 'landscape' : 'portrait'
  }

  /**
   * @returns whether a {@link MediaCondition} applies to this device
   */
  matches({ mediaFeature, value: unitValue }: MediaCondition): boolean {
    const { value } = unitValue
    return (
      (mediaFeature === 'min-width' && this.w >= value) ||
      (mediaFeature === 'max-width' && this.w <= value) ||
      (mediaFeature === 'min-height' && this.h >= value) ||
      (mediaFeature === 'max-height' && this.h <= value)
    )
  }

  /**
   * @returns the {@link Image}s needed to support a {@link Sizes} query on this device
   */
  getImages(sizes: Sizes): Image[] {
    return deviceImages(sizes.queries, this)
  }

  static fromDefinitions(definitions: DeviceDefinition[]): Device[] {
    return definitions.map(d => new Device(d))
  }
}
