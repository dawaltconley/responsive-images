import type { Device as DeviceInterface, Orientation, Image } from './types'
import type { MediaCondition } from './sizes'
import type Sizes from './sizes'
import { deviceImages } from './utilities'

export default class Device implements DeviceInterface {
  w: number
  h: number
  dppx: number[]
  flip: boolean

  constructor({ w, h, dppx, flip }: DeviceInterface) {
    this.w = w
    this.h = h
    this.dppx = dppx
    this.flip = w !== h && flip
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

  static fromDefinitions(definitions: DeviceInterface[]): Device[] {
    return definitions.map(d => new Device(d))
  }
}
