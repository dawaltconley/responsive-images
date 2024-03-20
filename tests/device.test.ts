import { describe, test, expect } from 'vitest'
import defaultDevices from '../src/data/devices'
import Device, { DeviceDefinition } from '../src/lib/device'
import Sizes from '../src/lib/sizes'
import { cloneDeep } from 'lodash'

const devices = Device.fromDefinitions(defaultDevices)

describe('Device.fromDefinitions()', () => {
  test('creates devices from default definitions', () => {
    expect(devices).toEqual([
      new Device({ w: 2560, h: 1600, dppx: 1 }),
      new Device({ w: 1920, h: 1200, dppx: 1 }),
      new Device({ w: 1680, h: 1050, dppx: 1 }),
      new Device({ w: 1440, h: 900, dppx: 2 }),
      new Device({ w: 1440, h: 900, dppx: 1 }),
      new Device({ w: 1366, h: 1024, dppx: 2 }),
      new Device({ w: 1366, h: 1024, dppx: 1 }),
      new Device({ w: 1024, h: 1366, dppx: 2 }),
      new Device({ w: 1024, h: 1366, dppx: 1 }),
      new Device({ w: 1280, h: 800, dppx: 2 }),
      new Device({ w: 1280, h: 800, dppx: 1.5 }),
      new Device({ w: 1280, h: 800, dppx: 1 }),
      new Device({ w: 800, h: 1280, dppx: 2 }),
      new Device({ w: 800, h: 1280, dppx: 1.5 }),
      new Device({ w: 800, h: 1280, dppx: 1 }),
      new Device({ w: 1024, h: 768, dppx: 2 }),
      new Device({ w: 1024, h: 768, dppx: 1 }),
      new Device({ w: 768, h: 1024, dppx: 2 }),
      new Device({ w: 768, h: 1024, dppx: 1 }),
      new Device({ w: 960, h: 600, dppx: 3 }),
      new Device({ w: 960, h: 600, dppx: 2 }),
      new Device({ w: 960, h: 600, dppx: 1 }),
      new Device({ w: 600, h: 960, dppx: 3 }),
      new Device({ w: 600, h: 960, dppx: 2 }),
      new Device({ w: 600, h: 960, dppx: 1 }),
      new Device({ w: 768, h: 432, dppx: 4 }),
      new Device({ w: 768, h: 432, dppx: 3 }),
      new Device({ w: 768, h: 432, dppx: 2.5 }),
      new Device({ w: 768, h: 432, dppx: 1 }),
      new Device({ w: 432, h: 768, dppx: 4 }),
      new Device({ w: 432, h: 768, dppx: 3 }),
      new Device({ w: 432, h: 768, dppx: 2.5 }),
      new Device({ w: 432, h: 768, dppx: 1 }),
      new Device({ w: 690, h: 412, dppx: 3.5 }),
      new Device({ w: 690, h: 412, dppx: 2 }),
      new Device({ w: 690, h: 412, dppx: 1 }),
      new Device({ w: 412, h: 690, dppx: 3.5 }),
      new Device({ w: 412, h: 690, dppx: 2 }),
      new Device({ w: 412, h: 690, dppx: 1 }),
      new Device({ w: 640, h: 360, dppx: 4 }),
      new Device({ w: 640, h: 360, dppx: 3 }),
      new Device({ w: 640, h: 360, dppx: 2 }),
      new Device({ w: 640, h: 360, dppx: 1.5 }),
      new Device({ w: 640, h: 360, dppx: 1 }),
      new Device({ w: 360, h: 640, dppx: 4 }),
      new Device({ w: 360, h: 640, dppx: 3 }),
      new Device({ w: 360, h: 640, dppx: 2 }),
      new Device({ w: 360, h: 640, dppx: 1.5 }),
      new Device({ w: 360, h: 640, dppx: 1 }),
      new Device({ w: 480, h: 320, dppx: 4 }),
      new Device({ w: 480, h: 320, dppx: 3 }),
      new Device({ w: 480, h: 320, dppx: 2 }),
      new Device({ w: 480, h: 320, dppx: 1.5 }),
      new Device({ w: 480, h: 320, dppx: 1 }),
      new Device({ w: 320, h: 480, dppx: 4 }),
      new Device({ w: 320, h: 480, dppx: 3 }),
      new Device({ w: 320, h: 480, dppx: 2 }),
      new Device({ w: 320, h: 480, dppx: 1.5 }),
      new Device({ w: 320, h: 480, dppx: 1 }),
    ])
  })

  test('creates devices from custome definitions', () => {
    const devices = Device.fromDefinitions([
      {
        w: 800,
        h: 600,
        dppx: [1, 2],
        flip: true,
      },
    ])

    expect(devices).toEqual([
      new Device({ w: 800, h: 600, dppx: 1 }),
      new Device({ w: 800, h: 600, dppx: 2 }),
      new Device({ w: 600, h: 800, dppx: 1 }),
      new Device({ w: 600, h: 800, dppx: 2 }),
    ])

    devices.push(
      ...Device.fromDefinitions([
        {
          w: 1400,
          h: 1400,
          dppx: [1.5],
        },
      ]),
    )

    expect(devices).toEqual([
      new Device({ w: 800, h: 600, dppx: 1 }),
      new Device({ w: 800, h: 600, dppx: 2 }),
      new Device({ w: 600, h: 800, dppx: 1 }),
      new Device({ w: 600, h: 800, dppx: 2 }),
      new Device({ w: 1400, h: 1400, dppx: 1.5 }),
      new Device({ w: 1400, h: 1400, dppx: 1 }),
    ])
  })

  test('passes through device objects', () => {
    expect(Device.fromDefinitions(devices)).toEqual(devices)

    expect(
      Device.fromDefinitions([
        { w: 800, h: 600, dppx: [1, 2], flip: true },
        new Device({ w: 1400, h: 1400, dppx: 1.5 }),
      ]),
    ).toEqual([
      new Device({ w: 800, h: 600, dppx: 1 }),
      new Device({ w: 800, h: 600, dppx: 2 }),
      new Device({ w: 600, h: 800, dppx: 1 }),
      new Device({ w: 600, h: 800, dppx: 2 }),
      new Device({ w: 1400, h: 1400, dppx: 1.5 }),
    ])
  })
})

describe('Device.sort()', () => {
  test('correctly sorts devices', () => {
    let sorted = [...devices].sort(Device.sort)

    expect(sorted).toEqual([
      new Device({ w: 2560, h: 1600, dppx: 1 }),
      new Device({ w: 1920, h: 1200, dppx: 1 }),
      new Device({ w: 1680, h: 1050, dppx: 1 }),
      new Device({ w: 1440, h: 900, dppx: 2 }),
      new Device({ w: 1440, h: 900, dppx: 1 }),
      new Device({ w: 1366, h: 1024, dppx: 2 }),
      new Device({ w: 1366, h: 1024, dppx: 1 }),
      new Device({ w: 1280, h: 800, dppx: 2 }),
      new Device({ w: 1280, h: 800, dppx: 1.5 }),
      new Device({ w: 1280, h: 800, dppx: 1 }),
      new Device({ w: 1024, h: 1366, dppx: 2 }),
      new Device({ w: 1024, h: 1366, dppx: 1 }),
      new Device({ w: 1024, h: 768, dppx: 2 }),
      new Device({ w: 1024, h: 768, dppx: 1 }),
      new Device({ w: 960, h: 600, dppx: 3 }),
      new Device({ w: 960, h: 600, dppx: 2 }),
      new Device({ w: 960, h: 600, dppx: 1 }),
      new Device({ w: 800, h: 1280, dppx: 2 }),
      new Device({ w: 800, h: 1280, dppx: 1.5 }),
      new Device({ w: 800, h: 1280, dppx: 1 }),
      new Device({ w: 768, h: 1024, dppx: 2 }),
      new Device({ w: 768, h: 1024, dppx: 1 }),
      new Device({ w: 768, h: 432, dppx: 4 }),
      new Device({ w: 768, h: 432, dppx: 3 }),
      new Device({ w: 768, h: 432, dppx: 2.5 }),
      new Device({ w: 768, h: 432, dppx: 1 }),
      new Device({ w: 690, h: 412, dppx: 3.5 }),
      new Device({ w: 690, h: 412, dppx: 2 }),
      new Device({ w: 690, h: 412, dppx: 1 }),
      new Device({ w: 640, h: 360, dppx: 4 }),
      new Device({ w: 640, h: 360, dppx: 3 }),
      new Device({ w: 640, h: 360, dppx: 2 }),
      new Device({ w: 640, h: 360, dppx: 1.5 }),
      new Device({ w: 640, h: 360, dppx: 1 }),
      new Device({ w: 600, h: 960, dppx: 3 }),
      new Device({ w: 600, h: 960, dppx: 2 }),
      new Device({ w: 600, h: 960, dppx: 1 }),
      new Device({ w: 480, h: 320, dppx: 4 }),
      new Device({ w: 480, h: 320, dppx: 3 }),
      new Device({ w: 480, h: 320, dppx: 2 }),
      new Device({ w: 480, h: 320, dppx: 1.5 }),
      new Device({ w: 480, h: 320, dppx: 1 }),
      new Device({ w: 432, h: 768, dppx: 4 }),
      new Device({ w: 432, h: 768, dppx: 3 }),
      new Device({ w: 432, h: 768, dppx: 2.5 }),
      new Device({ w: 432, h: 768, dppx: 1 }),
      new Device({ w: 412, h: 690, dppx: 3.5 }),
      new Device({ w: 412, h: 690, dppx: 2 }),
      new Device({ w: 412, h: 690, dppx: 1 }),
      new Device({ w: 360, h: 640, dppx: 4 }),
      new Device({ w: 360, h: 640, dppx: 3 }),
      new Device({ w: 360, h: 640, dppx: 2 }),
      new Device({ w: 360, h: 640, dppx: 1.5 }),
      new Device({ w: 360, h: 640, dppx: 1 }),
      new Device({ w: 320, h: 480, dppx: 4 }),
      new Device({ w: 320, h: 480, dppx: 3 }),
      new Device({ w: 320, h: 480, dppx: 2 }),
      new Device({ w: 320, h: 480, dppx: 1.5 }),
      new Device({ w: 320, h: 480, dppx: 1 }),
    ])

    sorted = Device.fromDefinitions([
      {
        w: 800,
        h: 600,
        dppx: [1, 2],
        flip: true,
      },
      {
        w: 1400,
        h: 1400,
        dppx: [1.5],
      },
    ]).sort(Device.sort)

    expect(sorted).toEqual([
      new Device({ w: 1400, h: 1400, dppx: 1.5 }),
      new Device({ w: 1400, h: 1400, dppx: 1 }),
      new Device({ w: 800, h: 600, dppx: 2 }),
      new Device({ w: 800, h: 600, dppx: 1 }),
      new Device({ w: 600, h: 800, dppx: 2 }),
      new Device({ w: 600, h: 800, dppx: 1 }),
    ])
  })
})

type Test = {
  device: DeviceDefinition
  images: { width: number }[]
}

describe('Device.getImage()', () => {
  const template: {
    sizes: Sizes
    pass: Test
    fail: Test
  } = {
    sizes: new Sizes('(min-width: 680px) 400px, 500px'),
    pass: {
      device: { w: 800, h: 700 },
      images: [{ width: 400 }],
    },
    fail: {
      device: { w: 500, h: 600 },
      images: [{ width: 500 }],
    },
  }

  function run({ device, images }: Test, sizes: Sizes): void {
    expect(
      Device.fromDefinitions([device]).map(d => d.getImage(sizes)),
    ).toEqual(images)
  }

  test('matches min-width query', () => {
    const { sizes, pass, fail } = template
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches max-width query', () => {
    const { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(max-width: 680px) 400px, 500px')
    // invert pass and fail widths for max conditions
    pass.images[0].width = 500
    fail.images[0].width = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches exact width query', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(width: 800px) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches min-height query', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(min-height: 680px) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches max-height query', () => {
    let { sizes, pass, fail } = cloneDeep(template)
    sizes = new Sizes('(max-height: 680px) 400px, 500px')
    // invert pass and fail widths for max conditions
    pass.images[0].width = 500
    fail.images[0].width = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches exact height query', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(height: 700px) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches orientation query', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(orientation: landscape) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches min-aspect-ratio query using ratio', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(min-aspect-ratio: 6/7) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches min-aspect-ratio query using number', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(min-aspect-ratio: 0.92) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches max-aspect-ratio query using ratio', () => {
    const { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(max-aspect-ratio: 9/8) 400px, 500px')
    // invert pass and fail widths for max conditions
    pass.images[0].width = 500
    fail.images[0].width = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches max-aspect-ratio query using number', () => {
    const { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(max-aspect-ratio: 1.1) 400px, 500px')
    // invert pass and fail widths for max conditions
    pass.images[0].width = 500
    fail.images[0].width = 400
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches exact aspect-ratio query using ratio', () => {
    const { pass, fail } = template
    const sizes = new Sizes('(aspect-ratio: 8/7) 400px, 500px')
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches exact aspect-ratio query using number', () => {
    const { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(aspect-ratio: 1.6) 400px, 500px')
    pass.device.h = 500
    run(pass, sizes)
    run(fail, sizes)
  })

  test('matches min-resolution query', () => {
    const { fail } = cloneDeep(template)
    const sizes = new Sizes('(min-resolution: 100dpi) 400px, 500px')
    // pass
    expect(new Device({ w: 100, h: 100, dppx: 1.5 }).getImage(sizes)).toEqual({
      width: 600,
    })
    run(fail, sizes)
  })

  test('matches max-resolution query', () => {
    const { pass } = cloneDeep(template)
    const sizes = new Sizes('(max-resolution: 2dppx) 400px, 500px')
    run(pass, sizes)
    // fail
    expect(new Device({ w: 100, h: 100, dppx: 3 }).getImage(sizes)).toEqual({
      width: 1500,
    })
  })

  test('matches exact resolution query', () => {
    const { fail } = cloneDeep(template)
    const sizes = new Sizes('(resolution: 96dpcm) 400px, 500px')
    // pass
    expect(new Device({ w: 100, h: 100, dppx: 2.54 }).getImage(sizes)).toEqual({
      width: 1016,
    })
    run(fail, sizes)
  })

  test('uses 100vw as default fallback value if none is provided', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    sizes.queries.pop()
    fail.device.w = 555
    fail.images[0].width = fail.device.w
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
      images: [{ width: 750 }, { width: 375 }],
    }
    run(pass, sizes)
    run(fail, sizes)
  })

  test('determines image width using vh and dppx', () => {
    let { pass, fail } = cloneDeep(template)
    const sizes = new Sizes('(min-width: 680px) 50vh, 75vh')
    pass.images = [{ width: 350 }]
    fail = {
      device: {
        ...fail.device,
        dppx: [2, 1],
      },
      images: [{ width: 900 }, { width: 450 }],
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
      '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw',
    )
    let device = new Device({ w: 1920, h: 400 })
    expect(device.getImage(sizes)).toEqual({ width: 719 })
    device = new Device({ ...device, w: 1440 })
    expect(device.getImage(sizes)).toEqual({ width: 590 })
    device = new Device({ ...device, w: 1200 })
    expect(device.getImage(sizes)).toEqual({ width: 468 })
    device = new Device({ ...device, w: 820 })
    expect(device.getImage(sizes)).toEqual({ width: 704 })
    device = new Device({ ...device, w: 680 })
    expect(device.getImage(sizes)).toEqual({ width: 576 })
    device = new Device({ ...device, w: 600 })
    expect(device.getImage(sizes)).toEqual({ width: 600 })
  })

  test('handles multiple "and" media queries', () => {
    const sizes = new Sizes(
      '(max-width: 780px) and (max-height: 720px) 600px, 400px',
    )
    const pass: Test = {
      device: { w: 600, h: 480 },
      images: [{ width: 600 }],
    }
    // fail with height
    const fail1: Test = {
      device: { w: 800, h: 600 },
      images: [{ width: 400 }],
    }
    // fail with width
    const fail2: Test = {
      ...fail1,
      device: { w: 772, h: 728 },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles multiple "or" media queries', () => {
    const sizes = new Sizes(
      '(min-width: 900px) or ((max-width: 780px) and (max-height: 720px)) 600px, 400px',
    )
    // pass with max width/height
    const pass1: Test = {
      device: { w: 600, h: 480 },
      images: [{ width: 600 }],
    }
    // pass with min-width
    const pass2: Test = {
      ...pass1,
      device: { w: 920, h: 600 },
    }
    // fail
    const fail: Test = {
      device: { w: 772, h: 728 },
      images: [{ width: 400 }],
    }
    run(pass1, sizes)
    run(pass2, sizes)
    run(fail, sizes)
  })

  test('handles "not" media queries', () => {
    const sizes = new Sizes(
      '(not (max-width: 780px)) and (max-height: 720px) 600px, 400px',
    )
    const pass: Test = {
      device: { w: 800, h: 600 },
      images: [{ width: 600 }],
    }
    // fail with not query
    const fail1: Test = {
      device: { w: 600, h: 480 },
      images: [{ width: 400 }],
    }
    // fail with height
    const fail2: Test = {
      ...fail1,
      device: { w: 800, h: 728 },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles mixed and nested logic', () => {
    const sizes = new Sizes(
      'not ((min-width: 900px) or ((max-width: 780px) and (max-height: 720px))) 600px, 400px',
    )
    // inverting or test
    const pass: Test = {
      device: { w: 772, h: 728 },
      images: [{ width: 600 }],
    }
    const fail1: Test = {
      device: { w: 600, h: 480 },
      images: [{ width: 400 }],
    }
    const fail2: Test = {
      ...fail1,
      device: { w: 920, h: 600 },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles excessive parentheses', () => {
    const sizes = new Sizes(
      'not ((((min-width: 900px)) or (((((max-width: 780px))) and (max-height: 720px))))) 600px, 400px',
    )
    // inverting or test
    const pass: Test = {
      device: { w: 772, h: 728 },
      images: [{ width: 600 }],
    }
    const fail1: Test = {
      device: { w: 600, h: 480 },
      images: [{ width: 400 }],
    }
    const fail2: Test = {
      ...fail1,
      device: { w: 920, h: 600 },
    }
    run(pass, sizes)
    run(fail1, sizes)
    run(fail2, sizes)
  })

  test('handles "all"', () => {
    const sizes = new Sizes('all 420px')
    Device.fromDefinitions(defaultDevices).forEach(device => {
      const width = 420 * device.dppx
      expect(device.getImage(sizes)).toEqual({ width })
    })
  })

  test('handles "not all"', () => {
    const sizes = new Sizes('not all 50px, 50vw')
    Device.fromDefinitions(defaultDevices).forEach(device => {
      const width = Math.ceil(device.w * 0.5 * device.dppx)
      expect(device.getImage(sizes)).toEqual({ width })
    })
  })

  test('handles a device with multiple resolutions', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    pass.device.dppx = [4, 3.2, 2.0, 1.5, 1]
    pass.images = [
      { width: 1600 },
      { width: 1280 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
    ]
    fail.device.dppx = [4, 3.2, 2, 1.5, 1]
    fail.images = [
      { width: 2000 },
      { width: 1600 },
      { width: 1000 },
      { width: 750 },
      { width: 500 },
    ]

    run(pass, sizes)
    run(fail, sizes)
  })

  test('handles a flippable device', () => {
    const { sizes, pass, fail } = cloneDeep(template)
    pass.device.flip = true
    pass.images = [...pass.images, { width: 400 }]
    fail.device = {
      ...fail.device,
      h: 800,
      flip: true,
    }
    fail.images = [...fail.images, { width: 400 }]
    run(pass, sizes)
    run(fail, sizes)
  })
})
