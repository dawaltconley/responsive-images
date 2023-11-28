import type { Dimension, Orientation, Image } from './types'
import type { MediaCondition, MediaFeature } from 'media-query-parser'
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

  get aspectRatio(): number {
    return this.w / this.h
  }

  /**
   * @returns whether a {@link MediaFeature} applies to this device
   */
  matchesFeature(mediaFeature: MediaFeature): boolean {
    if (mediaFeature.context === 'value') {
      const { prefix, feature, value } = mediaFeature
      if (value.type === '<dimension-token>' && value.unit === 'px') {
        return (
          (feature === 'width' && compare(this.w, value.value, prefix)) ||
          (feature === 'height' && compare(this.h, value.value, prefix))
        )
      }
      if (feature === 'aspect-ratio') {
        if (value.type === '<ratio-token>' || value.type === '<number-token>') {
          const ratio =
            value.type === '<ratio-token>'
              ? value.numerator / value.denominator
              : value.value
          return compare(this.aspectRatio, ratio, prefix)
        }
      }
      if (feature === 'orientation' && value.type === '<ident-token>') {
        return this.orientation === value.value
      }
    }
    throw new Error(`Unhandled media feature: ${mediaFeature.feature}`)
  }

  matchesCondition({ operator, children }: MediaCondition): boolean {
    if (operator === 'or') {
      return children.some(child => this.matches(child))
    }
    // if not "or", treat as "and." should not matter for "not" and null
    const and = children.every(child => this.matches(child))
    return operator === 'not' ? !and : and
  }

  matches(condition: MediaCondition | MediaFeature): boolean {
    if ('feature' in condition) {
      return this.matchesFeature(condition)
    } else {
      return this.matchesCondition(condition)
    }
  }

  /**
   * @returns the image size recommended for this device by a sizes string
   */
  resolve(sizes: Sizes): UnitValue {
    let imgWidth: UnitValue = new UnitValue(100, 'vw') // fallback to 100vw if no queries apply; this is the browser default

    whichSize: for (const { conditions, width } of sizes.queries) {
      if (conditions && !this.matches(conditions)) continue
      imgWidth = width
      break whichSize // break loop when device matches all conditions
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

/**
 * Compares a device value with a feature value based on a feature prefix
 * @param device - a device value
 * @param feature - a feature value
 * @param prefix - a feature prefix
 */

function compare(
  device: number,
  feature: number,
  prefix: 'max' | 'min' | null = null
): boolean {
  return (
    (prefix === 'min' && device >= feature) ||
    (prefix === 'max' && device <= feature) ||
    device === feature
  )
}
