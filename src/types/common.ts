const validOrientations = ['landscape', 'portrait'] as const
type Orientation = (typeof validOrientations)[number]

const isOrientation = (test: any): test is Orientation =>
  validOrientations.includes(test)

const queryOrder = ['min', 'max'] as const
type Order = (typeof queryOrder)[number]

const isOrder = (test: any): test is Order => queryOrder.includes(test)

interface Dimension {
  /** width */
  w: number

  /** height */
  h: number
}

/** represents a supported device */
interface Device extends Dimension {
  /** possible dppx for devices with these dimensions */
  dppx: number[]

  /** whether the device can be rotated and the dimensions flipped */
  flip: boolean
}

export { validOrientations, queryOrder, isOrientation, isOrder }
export type { Orientation, Order, Dimension, Device }
