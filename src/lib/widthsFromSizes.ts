import Device from './device'
import Config, { type ConfigOptions } from './config'
import Sizes from './sizes'
import { getWidthsFromInstructions } from './utilities'

const defaults = new Config()

/**
 * width and height are mandatory if parsing a non-standard sizes query string
 */
export interface WidthsFromSizesOptions
  extends Pick<ConfigOptions, 'devices' | 'scalingFactor'> {
  /** providing the source width is useful to ensure that no images larger than the source image are created */
  width?: number

  /** providing the source height together with the width allows you to use non-standard sizes query strings */
  height?: number
}

/**
 * This function returns the image widths needed to meet the requirements of a sizes string, given common device assumptions.
 * Useful if you want to integrate the sizes parser with another image transformation and markup generation pipeline.
 * @param sizes - a sizes query string
 * @returns an array of widths for images needed to match this sizes string
 * @group public
 */
export function getWidthsFromSizes(
  sizes: string,
  {
    scalingFactor = defaults.scalingFactor,
    devices = defaults.devices,
    width,
    height,
  }: WidthsFromSizesOptions = {}
): number[] {
  const parsedSizes = new Sizes(sizes)
  const targets = Device.fromDefinitions(devices)
    .sort(Device.sort)
    .map(d => d.getImage(parsedSizes))
  return getWidthsFromInstructions(targets, scalingFactor, width, height)
}
