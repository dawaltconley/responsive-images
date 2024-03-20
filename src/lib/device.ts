import type { Rect, Orientation, ResizeInstructions } from './common'
import type { QueryNode, ConditionNode, FeatureNode } from 'media-query-parser'
import { stringify } from 'media-query-parser'
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

/** @internal */
export default class Device implements Rect {
  readonly w: number
  readonly h: number
  readonly dppx: number

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
  matches(node: QueryNode | ConditionNode | FeatureNode): boolean {
    if (node._t === 'feature') {
      return this.#matchesFeature(node)
    } else if (node._t === 'condition') {
      return this.#matchesCondition(node)
    } else if (node.type === 'all') {
      return node.prefix !== 'not'
    }
    throw new Error(`Unhandled media condition: ${stringify(node)}`)
  }

  #matchesFeature(mediaFeature: FeatureNode): boolean {
    if (mediaFeature.context === 'value') {
      const { value } = mediaFeature // prefix no longer exists, feature is 'max-width' or 'min-width'. annoying!
      const { feature, prefix } = parseFeature(mediaFeature.feature)
      if (value._t === 'dimension' && value.unit === 'px') {
        return (
          (feature === 'width' && compare(this.w, value.value, prefix)) ||
          (feature === 'height' && compare(this.h, value.value, prefix))
        )
      }
      if (feature === 'resolution') {
        if (value._t === 'dimension' && isUnit(value.unit)) {
          const res = new UnitValue(value.value, value.unit)
          return (
            res.uses('dpi', 'dpcm', 'dppx', 'x') &&
            compare(this.dppx, toDppx(res).value, prefix)
          )
        }
      }
      if (feature === 'aspect-ratio') {
        if (value._t === 'ratio' || value._t === 'number') {
          const ratio =
            value._t === 'ratio' ? value.left / value.right : value.value
          return compare(this.aspectRatio, ratio, prefix)
        }
      }
      if (feature === 'orientation' && value._t === 'ident') {
        return this.orientation === value.value
      }
    }
    throw new Error(`Unhandled media feature: ${mediaFeature.feature}`)
  }

  #matchesCondition({ op: operator, nodes }: ConditionNode): boolean {
    if (operator === 'or') {
      return nodes.some(({ node }) =>
        node._t === 'general-enclosed' ? false : this.matches(node),
      )
    }
    // if not "or", treat as "and." should not matter for "not" and null
    const and = nodes.every(({ node }) =>
      node._t === 'general-enclosed' ? true : this.matches(node),
    )
    return operator === 'not' ? !and : and
  }

  /**
   * @returns the {@link ResizeInstructions} needed to support a {@link Sizes} query on this device
   */
  getImage(sizes: Sizes): ResizeInstructions<number> {
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
  resolve(initial: ResizeInstructions<ImageSize>): ResizeInstructions<number> {
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
              }),
          ),
        )
      }
    })
    return devices
  }

  /** can be passed directly to the `sort` Array method */
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
  prefix: 'max' | 'min' | null = null,
): boolean {
  return (
    (prefix === 'min' && device >= feature) ||
    (prefix === 'max' && device <= feature) ||
    device === feature
  )
}

type MediaPrefix = 'max' | 'min'

const isPrefix = (str: string): str is MediaPrefix =>
  str === 'max' || str === 'min'

interface MediaFeature {
  feature: string
  prefix: MediaPrefix | null
}

/** parses a feature like `min-width` into its base feature name (`width`) and prefix (`min`) */
function parseFeature(featureString: string): MediaFeature {
  const parsed = featureString.match(/^((?<prefix>min|max)-)?(?<feature>.*)/)
  const { feature = featureString, prefix } = parsed?.groups || {}
  return { feature, prefix: isPrefix(prefix) ? prefix : null }
}
