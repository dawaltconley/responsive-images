import type { Image } from '../src/types'

import Device, { DeviceDefinition } from '../src/device'
import Sizes from '../src/sizes'
import { cloneDeep } from 'lodash'

describe('Device.getImage()', () => {
  type Test = {
    device: DeviceDefinition
    images: Image[]
  }

  const template: {
    sizes: Sizes
    pass: Test
    fail: Test
  } = {
    sizes: new Sizes('(min-width: 680px) 400px, 500px'),
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

  function run({ device, images }: Test, sizes: Sizes): void {
    expect(
      Device.fromDefinitions([device]).map(d => d.getImage(sizes))
    ).toEqual(images)
  }

  test('matches basic min-width query', () => {
    const { sizes, pass, fail } = template
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches basic min-height query', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(min-height: 680px) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches basic max-width query', () => {
    let { sizes, pass, fail } = cloneDeep(template)
    sizes = new Sizes('(max-width: 680px) 400px, 500px')
    // invert pass and fail widths for max conditions
    pass.images[0].w = 500
    fail.images[0].w = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches basic max-height query', () => {
    let { sizes, pass, fail } = cloneDeep(template)
    sizes = new Sizes('(max-height: 680px) 400px, 500px')
    // invert pass and fail widths for max conditions
    pass.images[0].w = 500
    fail.images[0].w = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('uses 100vw as default fallback value if none is provided', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes.queries.pop()
    fail.device.w = 555
    fail.images[0].w = fail.device.w
    run(pass, sizes)
    run(fail, sizes)
  })

  test('determines image width using vw and dppx', () => {
    let { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(min-width: 680px) 50vw, 75vw')
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

  test('determines image width using vh and dppx', () => {
    let { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(min-width: 680px) 50vh, 75vh')
    pass.images = [
      {
        w: 350,
        dppx: 1,
        orientation: 'landscape',
      },
    ]
    fail = {
      device: {
        ...fail.device,
        dppx: [2, 1],
      },
      images: [
        {
          w: 900,
          dppx: 2,
          orientation: 'portrait',
        },
        {
          w: 450,
          dppx: 1,
          orientation: 'portrait',
        },
      ],
    }
    run(pass, sizes)
    run(fail, sizes)
  })

  test('rounds up subpixels', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(min-width: 680px) 399.2px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('returns images using multiple conditions', () => {
    const sizes = new Sizes(
      '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw'
    )
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
    const sizes = new Sizes(
      '(max-width: 780px) and (max-height: 720px) 600px, 400px'
    )
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
        w: 772,
        h: 728,
      },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles multiple "or" media queries', () => {
    const sizes = new Sizes(
      '(min-width: 900px) or ((max-width: 780px) and (max-height: 720px)) 600px, 400px'
    )
    // pass with max width/height
    const pass1: Test = {
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
    // pass with min-width
    const pass2: Test = {
      ...pass1,
      device: {
        w: 920,
        h: 600,
      },
    }
    // fail
    const fail: Test = {
      device: {
        w: 772,
        h: 728,
      },
      images: [
        {
          w: 400,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    run(pass1, sizes)
    run(pass2, sizes)
    run(fail, sizes)
  })

  test('handles "not" media queries', () => {
    const sizes = new Sizes(
      '(not (max-width: 780px)) and (max-height: 720px) 600px, 400px'
    )
    const pass: Test = {
      device: {
        w: 800,
        h: 600,
      },
      images: [
        {
          w: 600,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    // fail with not query
    const fail1: Test = {
      device: {
        w: 600,
        h: 480,
      },
      images: [
        {
          w: 400,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    // fail with height
    const fail2: Test = {
      ...fail1,
      device: {
        w: 800,
        h: 728,
      },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles mixed and nested logic', () => {
    const sizes = new Sizes(
      'not ((min-width: 900px) or ((max-width: 780px) and (max-height: 720px))) 600px, 400px'
    )
    // inverting or test
    const pass: Test = {
      device: {
        w: 772,
        h: 728,
      },
      images: [
        {
          w: 600,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    const fail1: Test = {
      device: {
        w: 600,
        h: 480,
      },
      images: [
        {
          w: 400,
          dppx: 1,
          orientation: 'landscape',
        },
      ],
    }
    const fail2: Test = {
      ...fail1,
      device: {
        w: 920,
        h: 600,
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
