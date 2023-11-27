import type { Image } from '../src/types'
import type { SizesQuery } from '../src/sizes'

import U from '../src/unit-values'
import Device, { DeviceDefinition } from '../src/device'
import Sizes from '../src/sizes'
import { cloneDeep } from 'lodash'

type Test = {
  device: DeviceDefinition
  images: Image[]
}

const template: {
  sizes: SizesQuery[]
  pass: Test
  fail: Test
} = {
  sizes: [
    {
      conditions: [
        {
          mediaFeature: 'min-width',
          value: new U(680, 'px'),
        },
      ],
      width: new U(400, 'px'),
    },
    { conditions: [], width: new U(500, 'px') },
  ],
  pass: {
    device: {
      w: 800,
      h: 700,
    },
    images: [
      {
        w: 400,
        dppx: 1,
        orientation: 'landscape',
      },
    ],
  },
  fail: {
    device: {
      w: 500,
      h: 600,
    },
    images: [
      {
        w: 500,
        dppx: 1,
        orientation: 'portrait',
      },
    ],
  },
}

function run({ device, images }: Test, queries: Sizes | SizesQuery[]): void {
  const sizes = 'queries' in queries ? queries : ({ queries } as Sizes)
  expect(Device.fromDefinitions([device]).map(d => d.getImage(sizes))).toEqual(
    images
  )
}

describe('Device.getImage()', () => {
  test('matches basic min-width query', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes[0].conditions[0].mediaFeature = 'min-width'
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches basic min-height query', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes[0].conditions[0].mediaFeature = 'min-height'
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches basic max-width query', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes[0].conditions[0].mediaFeature = 'max-width'
    // invert pass and fail widths for max conditions
    pass.images[0].w = 500
    fail.images[0].w = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches basic max-height query', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes[0].conditions[0].mediaFeature = 'max-height'
    // invert pass and fail widths for max conditions
    pass.images[0].w = 500
    fail.images[0].w = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('uses 100vw as default fallback value if none is provided', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes.pop()
    fail.device.w = 555
    fail.images[0].w = fail.device.w
    run(pass, sizes)
    run(fail, sizes)
  })

  test('determines image width using vw and dppx', () => {
    let { pass, fail } = cloneDeep(template)
    const sizes: SizesQuery[] = [
      {
        conditions: [
          {
            mediaFeature: 'min-width',
            value: new U(680, 'px'),
          },
        ],
        width: new U(50, 'vw'),
      },
      { conditions: [], width: new U(75, 'vw') },
    ]
    // pass remains the same, 400px
    fail = {
      device: {
        ...fail.device,
        dppx: [2, 1],
      },
      images: [
        {
          w: 750,
          dppx: 2,
          orientation: 'portrait',
        },
        {
          w: 375,
          dppx: 1,
          orientation: 'portrait',
        },
      ],
    }

    run(pass, sizes)
    run(fail, sizes)
  })

  test('rounds up subpixels', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes[0].width = new U(399.2, 'px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('returns images using multiple conditions', () => {
    const sizes = {
      queries: [
        {
          conditions: [{ mediaFeature: 'min-width', value: new U(1536, 'px') }],
          width: new U(718.5, 'px'),
        },
        {
          conditions: [{ mediaFeature: 'min-width', value: new U(1280, 'px') }],
          width: new U(590, 'px'),
        },
        {
          conditions: [{ mediaFeature: 'min-width', value: new U(1024, 'px') }],
          width: new U(468, 'px'),
        },
        {
          conditions: [{ mediaFeature: 'min-width', value: new U(768, 'px') }],
          width: new U(704, 'px'),
        },
        {
          conditions: [{ mediaFeature: 'min-width', value: new U(640, 'px') }],
          width: new U(576, 'px'),
        },
        { conditions: [], width: new U(100, 'vw') },
      ],
    } as Sizes
    const device = new Device({
      w: 1000,
      h: 400,
    })
    const image: Image = {
      w: 1000,
      dppx: 1,
      orientation: 'landscape',
    }
    device.w = 1920
    expect(device.getImage(sizes)).toEqual({ ...image, w: 719 })
    device.w = 1440
    expect(device.getImage(sizes)).toEqual({ ...image, w: 590 })
    device.w = 1200
    expect(device.getImage(sizes)).toEqual({ ...image, w: 468 })
    device.w = 820
    expect(device.getImage(sizes)).toEqual({ ...image, w: 704 })
    device.w = 680
    expect(device.getImage(sizes)).toEqual({ ...image, w: 576 })
    device.w = 600
    expect(device.getImage(sizes)).toEqual({ ...image, w: 600 })
  })

  test('handles multiple "and" media queries', () => {
    const sizes: SizesQuery[] = [
      {
        conditions: [
          {
            mediaFeature: 'max-width',
            value: new U(780, 'px'),
          },
          {
            mediaFeature: 'max-height',
            value: new U(720, 'px'),
          },
        ],
        width: new U(600, 'px'),
      },
      { conditions: [], width: new U(400, 'px') },
    ]
    const pass: Test = {
      device: {
        w: 600,
        h: 480,
      },
      images: [
        {
          w: 600,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    // fail with height
    const fail1: Test = {
      device: {
        w: 800,
        h: 600,
      },
      images: [
        {
          w: 400,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    // fail with width
    const fail2: Test = {
      ...fail1,
      device: {
        ...fail1.device,
        w: 772,
        h: 728,
      },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles a device with multiple resolutions', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    pass.device.dppx = [4, 3.2, 2.0, 1.5, 1]
    pass.images = [
      {
        w: 1600,
        dppx: 4,
        orientation: 'landscape',
      },
      {
        w: 1280,
        dppx: 3.2,
        orientation: 'landscape',
      },
      {
        w: 800,
        dppx: 2,
        orientation: 'landscape',
      },
      {
        w: 600,
        dppx: 1.5,
        orientation: 'landscape',
      },
      {
        w: 400,
        dppx: 1,
        orientation: 'landscape',
      },
    ]
    fail.device.dppx = [4, 3.2, 2, 1.5, 1]
    fail.images = [
      {
        w: 2000,
        dppx: 4,
        orientation: 'portrait',
      },
      {
        w: 1600,
        dppx: 3.2,
        orientation: 'portrait',
      },
      {
        w: 1000,
        dppx: 2,
        orientation: 'portrait',
      },
      {
        w: 750,
        dppx: 1.5,
        orientation: 'portrait',
      },
      {
        w: 500,
        dppx: 1,
        orientation: 'portrait',
      },
    ]

    run(pass, sizes)
    run(fail, sizes)
  })

  test('handles a flippable device', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    pass.device.flip = true
    pass.images = [
      ...pass.images,
      {
        w: 400,
        dppx: 1,
        orientation: 'portrait',
      },
    ]
    fail.device = {
      ...fail.device,
      h: 800,
      flip: true,
    }
    fail.images = [
      ...fail.images,
      {
        w: 400,
        dppx: 1,
        orientation: 'landscape',
      },
    ]
    run(pass, sizes)
    run(fail, sizes)
  })
})
