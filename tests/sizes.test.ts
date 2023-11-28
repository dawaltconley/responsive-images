import Device from '../src/device'
import defaultDevices from '../src/data/devices'
import Sizes from '../src/sizes'
import U from '../src/unit-values'
import { set, cloneDeep } from 'lodash'

const devices = Device.fromDefinitions(defaultDevices)

describe('Sizes.parse()', () => {
  test('parses media query and assigned width', () => {
    expect(Sizes.parse('(min-width: 680px) 400px')).toEqual([
      {
        conditions: {
          operator: null,
          children: [
            {
              context: 'value',
              prefix: 'min',
              feature: 'width',
              value: {
                type: '<dimension-token>',
                value: 680,
                unit: 'px',
                flag: 'number',
              },
            },
          ],
        },
        width: new U(400, 'px'),
      },
    ])
    expect(Sizes.parse('(max-width: 680px) 100vw')).toEqual([
      {
        conditions: {
          operator: null,
          children: [
            {
              context: 'value',
              prefix: 'max',
              feature: 'width',
              value: {
                type: '<dimension-token>',
                value: 680,
                unit: 'px',
                flag: 'number',
              },
            },
          ],
        },
        width: new U(100, 'vw'),
      },
    ])
  })

  test('parses media query with fallback value', () => {
    expect(Sizes.parse('(min-width: 680px) 400px, 100vw')).toEqual([
      {
        conditions: {
          operator: null,
          children: [
            {
              context: 'value',
              prefix: 'min',
              feature: 'width',
              value: {
                type: '<dimension-token>',
                value: 680,
                unit: 'px',
                flag: 'number',
              },
            },
          ],
        },
        width: new U(400, 'px'),
      },
      { conditions: null, width: new U(100, 'vw') },
    ])
  })

  test('parses multiple media queries', () => {
    const condition = {
      operator: null,
      children: [
        {
          context: 'value',
          prefix: 'min',
          feature: 'width',
          value: {
            type: '<dimension-token>',
            value: 680,
            unit: 'px',
            flag: 'number',
          },
        },
      ],
    }

    expect(
      Sizes.parse(
        '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw'
      )
    ).toEqual([
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 1536),
        width: new U(718.5, 'px'),
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 1280),
        width: new U(590, 'px'),
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 1024),
        width: new U(468, 'px'),
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 768),
        width: new U(704, 'px'),
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 640),
        width: new U(576, 'px'),
      },
      { conditions: null, width: new U(100, 'vw') },
    ])
  })

  test('parses combined media queries with the "and" keyword', () => {
    expect(
      Sizes.parse('(max-width: 780px) and (max-height: 720px) 60vh, 400px')
    ).toEqual([
      {
        conditions: {
          operator: 'and',
          children: [
            {
              context: 'value',
              prefix: 'max',
              feature: 'width',
              value: {
                type: '<dimension-token>',
                value: 780,
                unit: 'px',
                flag: 'number',
              },
            },
            {
              context: 'value',
              prefix: 'max',
              feature: 'height',
              value: {
                type: '<dimension-token>',
                value: 720,
                unit: 'px',
                flag: 'number',
              },
            },
          ],
        },
        width: new U(60, 'vh'),
      },
      { conditions: null, width: new U(400, 'px') },
    ])
  })

  test('ignores excess parentheses', () => {
    expect(Sizes.parse('((((min-width: 680px)))) 400px')).toEqual([
      {
        conditions: {
          operator: null,
          children: [
            {
              context: 'value',
              prefix: 'min',
              feature: 'width',
              value: {
                type: '<dimension-token>',
                value: 680,
                unit: 'px',
                flag: 'number',
              },
            },
          ],
        },
        width: new U(400, 'px'),
      },
    ])
  })
})

describe('Sizes.toWidths()', () => {
  describe('calculates image widths using the default devices', () => {
    test('using media query and assigned width', () => {
      expect(new Sizes('100vw').toWidths(devices)).toEqual([
        3072, 2732, 2415, 2048, 1800, 1600, 1380, 1200, 1024, 824, 720, 640,
        540, 480, 412, 360, 320,
      ])
      expect(new Sizes('400px').toWidths(devices)).toEqual([
        1600, 1400, 1200, 1000, 800, 600, 400,
      ])
      expect(
        new Sizes('(min-width: 680px) 400px, 50vw').toWidths(devices)
      ).toEqual([
        1600, 1400, 1200, 1000, 864, 721, 640, 540, 480, 412, 360, 320, 270,
        240, 206, 180, 160,
      ])
    })

    test('using multiple media queries', () => {
      expect(
        new Sizes(
          '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw'
        ).toWidths(devices)
      ).toEqual([
        2816, 2304, 2016, 1800, 1442, 1280, 1080, 960, 824, 720, 640, 540, 480,
        412, 360, 320,
      ])
    })

    test('using combined media queries with the "and" keyword', () => {
      expect(
        new Sizes(
          '(max-width: 780px) and (max-height: 720px) 600px, 400px'
        ).toWidths(devices)
      ).toEqual([2400, 2100, 1800, 1600, 1200, 1000, 800, 600, 400])
    })
  })

  test('calculates image widths using custom, unsorted devices', () => {
    const devices = Device.fromDefinitions([
      {
        w: 800,
        h: 600,
        dppx: [1, 2],
        flip: true,
      },
    ])

    expect(new Sizes('100vw').toWidths(devices)).toEqual([1600, 1200, 800, 600])
    expect(new Sizes('400px').toWidths(devices)).toEqual([800, 400])

    devices.push(
      ...Device.fromDefinitions([
        {
          w: 1400,
          h: 1400,
          dppx: [1.5],
          flip: true,
        },
      ])
    )

    expect(new Sizes('100vw').toWidths(devices)).toEqual([
      2100, 1600, 1400, 1200, 800, 600,
    ])
    expect(new Sizes('400px').toWidths(devices)).toEqual([800, 600, 400])
  })

  test('calculates image widths using custom scaling factor', () => {
    expect(new Sizes('100vw').toWidths(devices, { minScale: 0.5 })).toEqual([
      3072, 2048, 1442, 960, 640, 432,
    ])
    expect(new Sizes('400px').toWidths(devices, { minScale: 0.6 })).toEqual([
      1600, 1200, 800, 600, 400,
    ])
    expect(
      new Sizes(
        '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw'
      ).toWidths(devices, { minScale: 0.4 })
    ).toEqual([2816, 1760, 1080, 640, 360])
    expect(
      new Sizes(
        '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw'
      ).toWidths(devices, { minScale: 0.3 })
    ).toEqual([2816, 1442, 720, 360])
  })
})

describe('Sizes.toQueries()', () => {
  test('calculates queries using the default devices', () => {
    expect(new Sizes('400px').toQueries(devices)).toEqual({
      landscape: [
        {
          w: 2560,
          h: 1600,
          images: [{ w: 400, dppx: 1, orientation: 'landscape' }],
        },
        {
          w: 1920,
          h: 1200,
          images: [{ w: 400, dppx: 1, orientation: 'landscape' }],
        },
        {
          w: 1680,
          h: 1050,
          images: [{ w: 400, dppx: 1, orientation: 'landscape' }],
        },
        {
          w: 1440,
          h: 900,
          images: [
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 1366,
          h: 1024,
          images: [
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 1280,
          h: 800,
          images: [
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 600, dppx: 1.5, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 1024,
          h: 768,
          images: [
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 960,
          h: 600,
          images: [
            { w: 1200, dppx: 3, orientation: 'landscape' },
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 768,
          h: 432,
          images: [
            { w: 1600, dppx: 4, orientation: 'landscape' },
            { w: 1200, dppx: 3, orientation: 'landscape' },
            { w: 1000, dppx: 2.5, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 690,
          h: 412,
          images: [
            { w: 1400, dppx: 3.5, orientation: 'landscape' },
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 640,
          h: 360,
          images: [
            { w: 1600, dppx: 4, orientation: 'landscape' },
            { w: 1200, dppx: 3, orientation: 'landscape' },
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 600, dppx: 1.5, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 480,
          h: 320,
          images: [
            { w: 1600, dppx: 4, orientation: 'landscape' },
            { w: 1200, dppx: 3, orientation: 'landscape' },
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 600, dppx: 1.5, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
      ],
      portrait: [
        {
          w: 1024,
          h: 1366,
          images: [
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 800,
          h: 1280,
          images: [
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 600, dppx: 1.5, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 768,
          h: 1024,
          images: [
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 600,
          h: 960,
          images: [
            { w: 1200, dppx: 3, orientation: 'portrait' },
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 432,
          h: 768,
          images: [
            { w: 1600, dppx: 4, orientation: 'portrait' },
            { w: 1200, dppx: 3, orientation: 'portrait' },
            { w: 1000, dppx: 2.5, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 412,
          h: 690,
          images: [
            { w: 1400, dppx: 3.5, orientation: 'portrait' },
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 360,
          h: 640,
          images: [
            { w: 1600, dppx: 4, orientation: 'portrait' },
            { w: 1200, dppx: 3, orientation: 'portrait' },
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 600, dppx: 1.5, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 320,
          h: 480,
          images: [
            { w: 1600, dppx: 4, orientation: 'portrait' },
            { w: 1200, dppx: 3, orientation: 'portrait' },
            { w: 800, dppx: 2, orientation: 'portrait' },
            { w: 600, dppx: 1.5, orientation: 'portrait' },
            { w: 400, dppx: 1, orientation: 'portrait' },
          ],
        },
      ],
    })
    expect(new Sizes('80vw').toQueries(devices)).toEqual({
      landscape: [
        {
          w: 2560,
          h: 1600,
          images: [{ w: 2048, dppx: 1, orientation: 'landscape' }],
        },
        {
          w: 1920,
          h: 1200,
          images: [{ w: 1536, dppx: 1, orientation: 'landscape' }],
        },
        {
          w: 1680,
          h: 1050,
          images: [{ w: 1344, dppx: 1, orientation: 'landscape' }],
        },
        {
          w: 1440,
          h: 900,
          images: [
            { w: 2304, dppx: 2, orientation: 'landscape' },
            { w: 1152, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 1366,
          h: 1024,
          images: [
            { w: 2186, dppx: 2, orientation: 'landscape' },
            { w: 1093, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 1280,
          h: 800,
          images: [
            { w: 2048, dppx: 2, orientation: 'landscape' },
            { w: 1536, dppx: 1.5, orientation: 'landscape' },
            { w: 1024, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 1024,
          h: 768,
          images: [
            { w: 1639, dppx: 2, orientation: 'landscape' },
            { w: 820, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 960,
          h: 600,
          images: [
            { w: 2304, dppx: 3, orientation: 'landscape' },
            { w: 1536, dppx: 2, orientation: 'landscape' },
            { w: 768, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 768,
          h: 432,
          images: [
            { w: 2458, dppx: 4, orientation: 'landscape' },
            { w: 1844, dppx: 3, orientation: 'landscape' },
            { w: 1536, dppx: 2.5, orientation: 'landscape' },
            { w: 615, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 690,
          h: 412,
          images: [
            { w: 1932, dppx: 3.5, orientation: 'landscape' },
            { w: 1104, dppx: 2, orientation: 'landscape' },
            { w: 552, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 640,
          h: 360,
          images: [
            { w: 2048, dppx: 4, orientation: 'landscape' },
            { w: 1536, dppx: 3, orientation: 'landscape' },
            { w: 1024, dppx: 2, orientation: 'landscape' },
            { w: 768, dppx: 1.5, orientation: 'landscape' },
            { w: 512, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 480,
          h: 320,
          images: [
            { w: 1536, dppx: 4, orientation: 'landscape' },
            { w: 1152, dppx: 3, orientation: 'landscape' },
            { w: 768, dppx: 2, orientation: 'landscape' },
            { w: 576, dppx: 1.5, orientation: 'landscape' },
            { w: 384, dppx: 1, orientation: 'landscape' },
          ],
        },
      ],
      portrait: [
        {
          w: 1024,
          h: 1366,
          images: [
            { w: 1639, dppx: 2, orientation: 'portrait' },
            { w: 820, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 800,
          h: 1280,
          images: [
            { w: 1280, dppx: 2, orientation: 'portrait' },
            { w: 960, dppx: 1.5, orientation: 'portrait' },
            { w: 640, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 768,
          h: 1024,
          images: [
            { w: 1229, dppx: 2, orientation: 'portrait' },
            { w: 615, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 600,
          h: 960,
          images: [
            { w: 1440, dppx: 3, orientation: 'portrait' },
            { w: 960, dppx: 2, orientation: 'portrait' },
            { w: 480, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 432,
          h: 768,
          images: [
            { w: 1383, dppx: 4, orientation: 'portrait' },
            { w: 1037, dppx: 3, orientation: 'portrait' },
            { w: 864, dppx: 2.5, orientation: 'portrait' },
            { w: 346, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 412,
          h: 690,
          images: [
            { w: 1154, dppx: 3.5, orientation: 'portrait' },
            { w: 660, dppx: 2, orientation: 'portrait' },
            { w: 330, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 360,
          h: 640,
          images: [
            { w: 1152, dppx: 4, orientation: 'portrait' },
            { w: 864, dppx: 3, orientation: 'portrait' },
            { w: 576, dppx: 2, orientation: 'portrait' },
            { w: 432, dppx: 1.5, orientation: 'portrait' },
            { w: 288, dppx: 1, orientation: 'portrait' },
          ],
        },
        {
          w: 320,
          h: 480,
          images: [
            { w: 1024, dppx: 4, orientation: 'portrait' },
            { w: 768, dppx: 3, orientation: 'portrait' },
            { w: 512, dppx: 2, orientation: 'portrait' },
            { w: 384, dppx: 1.5, orientation: 'portrait' },
            { w: 256, dppx: 1, orientation: 'portrait' },
          ],
        },
      ],
    })
  })

  const customDevices = Device.fromDefinitions([
    {
      w: 800,
      h: 600,
      dppx: [1, 2],
      flip: true,
    },
  ])

  test('calculate queries using custom devices', () => {
    const devices = [...customDevices]

    expect(
      new Sizes('(min-width: 680px) 400px, 100vw').toQueries(devices)
    ).toEqual({
      landscape: [
        {
          w: 800,
          h: 600,
          images: [
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
      ],
      portrait: [
        {
          w: 600,
          h: 800,
          images: [
            { w: 1200, dppx: 2, orientation: 'portrait' },
            { w: 600, dppx: 1, orientation: 'portrait' },
          ],
        },
      ],
    })

    devices.push(
      ...Device.fromDefinitions([
        {
          w: 1400,
          h: 1400,
          dppx: [1.5],
        },
      ])
    )

    expect(
      new Sizes('(min-width: 680px) 400px, 100vw').toQueries(devices)
    ).toEqual({
      landscape: [
        {
          w: 1400,
          h: 1400,
          images: [
            { w: 600, dppx: 1.5, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
        {
          w: 800,
          h: 600,
          images: [
            { w: 800, dppx: 2, orientation: 'landscape' },
            { w: 400, dppx: 1, orientation: 'landscape' },
          ],
        },
      ],
      portrait: [
        {
          w: 600,
          h: 800,
          images: [
            { w: 1200, dppx: 2, orientation: 'portrait' },
            { w: 600, dppx: 1, orientation: 'portrait' },
          ],
        },
      ],
    })
  })
})
