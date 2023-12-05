import type { Rect, Orientation, ResizeInstructions } from './types'
import type { MediaCondition, MediaFeature } from 'media-query-parser'
import type Sizes from './sizes'
import UnitValue, {
  ImageSize,
  toDevicePixels,
  toDppx,
  isUnit,
} from './unit-values'

/** represents a supported device */
export interface DeviceDefinition extends Rect {
  /** possible dppx for devices with these dimensions */
  dppx?: number[]

  /** whether the device can be rotated and the dimensions flipped */
  flip?: boolean
}

export interface DeviceOptions extends Rect {
  dppx?: number
}

export type ResolvedImage = ResizeInstructions<number>

export default class Device implements Rect {
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
   * @returns true if a single media condition applies to this device
   */
  matches(condition: MediaCondition | MediaFeature): boolean {
    if ('feature' in condition) {
      return this.#matchesFeature(condition)
    } else {
      return this.#matchesCondition(condition)
    }
  }

  #matchesFeature(mediaFeature: MediaFeature): boolean {
    if (mediaFeature.context === 'value') {
      const { prefix, feature, value } = mediaFeature
      if (value.type === '<dimension-token>' && value.unit === 'px') {
        return (
          (feature === 'width' && compare(this.w, value.value, prefix)) ||
          (feature === 'height' && compare(this.h, value.value, prefix))
        )
      }
      if (feature === 'resolution') {
        if (value.type === '<dimension-token>' && isUnit(value.unit)) {
          const res = new UnitValue(value.value, value.unit)
          return (
            res.uses('dpi', 'dpcm', 'dppx', 'x') &&
            compare(this.dppx, toDppx(res).value, prefix)
          )
        }
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

  #matchesCondition({ operator, children }: MediaCondition): boolean {
    if (operator === 'or') {
      return children.some(child => this.matches(child))
    }
    // if not "or", treat as "and." should not matter for "not" and null
    const and = children.every(child => this.matches(child))
    return operator === 'not' ? !and : and
  }

  /**
   * @returns the {@link ResolvedImage}s needed to support a {@link Sizes} query on this device
   */
  getImage(sizes: Sizes): ResolvedImage {
    for (const { conditions, size } of sizes.queries) {
      if (!conditions || this.matches(conditions)) {
        return this.resolve(size)
      }
    }
    return { width: this.w } // fallback to 100vw if no queries apply; this is the browser default
  }

  /**
   * @returns the resize instructions for a given image with all units resolved to device pixels
   */
  resolve(initial: ResizeInstructions<ImageSize>): ResolvedImage {
    if ('fit' in initial) {
      return {
        width: toDevicePixels(initial.width, this),
        height: toDevicePixels(initial.height, this),
        fit: initial.fit,
      }
    } else if ('width' in initial) {
      return { width: toDevicePixels(initial.width, this) }
    } else {
      return { width: toDevicePixels(initial.height, this) }
    }
  }

  static fromDefinitions(definitions: (Device | DeviceDefinition)[]): Device[] {
    const devices: Device[] = []
    definitions.forEach(def => {
      if (def instanceof Device) return devices.push(def)
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

  static sort(a: Device, b: Device): number {
    return b.w - a.w || b.h - a.h || b.dppx - a.dppx
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
