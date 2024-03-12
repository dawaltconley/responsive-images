/**
 * The device definitions used by default.
 *
 * ```
 * import devices from '@dawaltconley/responsive-images/devices'
 * ```
 *
 * @see {@link https://github.com/dawaltconley/responsive-images/blob/main/src/data/devices.ts}
 *
 * @module devices
 */

import type { DeviceDefinition } from '../lib/device'

const devices: DeviceDefinition[] = [
  {
    w: 2560,
    h: 1600,
    dppx: [1],
    flip: false,
  },
  {
    w: 1920,
    h: 1200,
    dppx: [1],
    flip: false,
  },
  {
    w: 1680,
    h: 1050,
    dppx: [1],
    flip: false,
  },
  {
    w: 1440,
    h: 900,
    dppx: [2, 1],
    flip: false,
  },
  {
    w: 1366,
    h: 1024,
    dppx: [2, 1],
    flip: true,
  },
  {
    w: 1280,
    h: 800,
    dppx: [2, 1.5, 1],
    flip: true,
  },
  {
    w: 1024,
    h: 768,
    dppx: [2, 1],
    flip: true,
  },
  {
    w: 960,
    h: 600,
    dppx: [3, 2, 1],
    flip: true,
  },
  {
    w: 768,
    h: 432,
    dppx: [4, 3, 2.5],
    flip: true,
  },
  {
    w: 690,
    h: 412,
    dppx: [3.5, 2],
    flip: true,
  },
  {
    w: 640,
    h: 360,
    dppx: [4, 3, 2, 1.5],
    flip: true,
  },
  {
    w: 480,
    h: 320,
    dppx: [4, 3, 2, 1.5, 1],
    flip: true,
  },
]

export default devices
export type { DeviceDefinition as Device }
