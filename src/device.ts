import type { Dimension, Orientation, Image } from './types'
import type { MediaCondition } from './sizes'
import type Sizes from './sizes'
import UnitValue from './unit-values'

/** represents a supported device */
export interface DeviceDefinition extends Dimension {
  /** possible dppx for devices with these dimensions */
  dppx?: number[]

  /** whether the device can be rotated and the dimensions flipped */
  flip?: boolean
}

export interface DeviceOptions extends Dimension {
  dppx?: number
}

export default class Device implements Dimension {
  w: number
  h: number
  dppx: number

  constructor({ w, h, dppx = 1 }: DeviceOptions) {
    this.w = w
    this.h = h
    this.dppx = dppx
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
   * @returns the image size recommended for this device by a sizes string
   */
  resolve(sizes: Sizes): UnitValue {
    let imgWidth: UnitValue = new UnitValue(100, 'vw') // fallback to 100vw if no queries apply; this is the browser default

    whichSize: for (const { conditions, width } of sizes.queries) {
      for (const condition of conditions) {
        const match = this.matches(condition)
        if (!match) continue whichSize
      }
      imgWidth = width
      break whichSize // break loop when device matches all conditions
    }

    if (imgWidth.unit === 'vh') {
      throw new Error(
        `Invalid unit in sizes query: ${imgWidth}\nOnly vw and px are supported.`
      )
    }

    return imgWidth
  }

  /**
   * @returns the {@link Image}s needed to support a {@link Sizes} query on this device
   */
  getImage(sizes: Sizes): Image {
    return {
      w: this.resolve(sizes).toPixels(this),
      dppx: this.dppx,
      orientation: this.orientation,
    }
  }

  static fromDefinitions(definitions: DeviceDefinition[]): Device[] {
    const devices: Device[] = []
    definitions.forEach(def => {
      const dppx = def.dppx ? [...def.dppx] : [1]
      if (dppx.indexOf(1) < 0) dppx.push(1) // always include a dppx value of one for queries, to avoid upscaling when screen resizes on larger 1dppx displays.
      devices.push(...dppx.map(dppx => new Device({ ...def, dppx })))
      if (def.flip && def.w !== def.h) {
        devices.push(
          ...dppx.map(
            dppx =>
              new Device({
                w: def.h,
                h: def.w,
                dppx,
              })
          )
        )
      }
    })
    return devices
  }
}
