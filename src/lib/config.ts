import defaultDevices from '../data/devices'
import Device, { type DeviceDefinition } from './device'
import type { ImageOptions } from '@11ty/eleventy-img'

export interface ConfigOptions {
  /**
   * Default options passed to EleventyImage whenever it is called.
   * @see {@link https://www.11ty.dev/docs/plugins/image/} for available options
   */
  defaults?: Partial<ImageOptions>

  /**
   * Devices to support when calculating image sizes. Defaults to an
   * internal device list that can be imported from `@dawaltconley/responsive-images/devices`
   */
  devices?: Device[] | DeviceDefinition[]

  /**
   * The maximum difference in size between any two images created when downsizing.
   * A higher scaling factor creates more images with smaller gaps in their sizes.
   * A lower scaling factor creates fewer images with larger gaps in their sizes. Some devices may need to load larger images than necessary.
   * @defaultValue `0.8`
   */
  scalingFactor?: number

  /**
   * Prefix for the generated Sass functions.
   * @defaultValue `'image'`
   */
  sassPrefix?: string

  /**
   * If true, disables new image generation so that all methods output image elements at their original size.
   * Useful for avoiding repeated rebuilds on development environments.
   * @defaultValue `false`
   */
  disable?: boolean
}

/** Controls how {@link ConfigOptions} are processed. */
export default class Config implements Required<ConfigOptions> {
  /** @see ConfigOptions {@link ConfigOptions.defaults} */
  defaults: Partial<ImageOptions>
  /** @see ConfigOptions {@link ConfigOptions.sassPrefix} */
  sassPrefix: string
  /** @see ConfigOptions {@link ConfigOptions.scalingFactor} */
  scalingFactor: number
  /** @see ConfigOptions {@link ConfigOptions.disable} */
  disable: boolean
  /** @see ConfigOptions {@link ConfigOptions.devices} */
  devices: Device[] = []

  constructor(options?: ConfigOptions) {
    const {
      defaults = {},
      devices = defaultDevices,
      sassPrefix = 'image',
      scalingFactor = 0.8,
      disable = false,
    } = options || {}

    this.defaults = defaults
    this.devices = Device.fromDefinitions(devices).sort(Device.sort)
    this.sassPrefix = sassPrefix
    this.scalingFactor = scalingFactor
    this.disable = disable
  }
}
