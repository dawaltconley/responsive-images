import defaultDevices from '../src/data/devices'
import Device from '../src/device'
import Sizes from '../src/sizes'
import DeviceSizes from '../src/device-sizes'
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

describe('new DeviceSizes()', () => {
  test('calculates queries using the default devices', () => {
    let sizes = new DeviceSizes(new Sizes('400px'), devices)

    expect(sizes.targets).toEqual([
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 600, dppx: 1.5, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 1200, dppx: 3, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 600, dppx: 1.5, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 1600, dppx: 4, orientation: 'landscape' },
      { w: 1200, dppx: 3, orientation: 'landscape' },
      { w: 1000, dppx: 2.5, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 1400, dppx: 3.5, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 1600, dppx: 4, orientation: 'landscape' },
      { w: 1200, dppx: 3, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 600, dppx: 1.5, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 1200, dppx: 3, orientation: 'portrait' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 1600, dppx: 4, orientation: 'landscape' },
      { w: 1200, dppx: 3, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 600, dppx: 1.5, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 1600, dppx: 4, orientation: 'portrait' },
      { w: 1200, dppx: 3, orientation: 'portrait' },
      { w: 1000, dppx: 2.5, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 1400, dppx: 3.5, orientation: 'portrait' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 1600, dppx: 4, orientation: 'portrait' },
      { w: 1200, dppx: 3, orientation: 'portrait' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 600, dppx: 1.5, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
      { w: 1600, dppx: 4, orientation: 'portrait' },
      { w: 1200, dppx: 3, orientation: 'portrait' },
      { w: 800, dppx: 2, orientation: 'portrait' },
      { w: 600, dppx: 1.5, orientation: 'portrait' },
      { w: 400, dppx: 1, orientation: 'portrait' },
    ])

    sizes.landscape.forEach(n => {
      expect(sizes.devices[n].orientation).toEqual('landscape')
      expect(sizes.targets[n].orientation).toEqual('landscape')
    })
    sizes.portrait.forEach(n => {
      expect(sizes.devices[n].orientation).toEqual('portrait')
      expect(sizes.targets[n].orientation).toEqual('portrait')
    })

    expect(sizes.groupBySize(sizes.devices.map((_d, i) => i))).toEqual([
      [0],
      [1],
      [2],
      [3, 4],
      [5, 6],
      [7, 8, 9],
      [10, 11],
      [12, 13],
      [14, 15, 16],
      [17, 18, 19],
      [20, 21],
      [22, 23, 24, 25],
      [26, 27, 28],
      [29, 30, 31, 32, 33],
      [34, 35, 36],
      [37, 38, 39, 40, 41],
      [42, 43, 44, 45],
      [46, 47, 48],
      [49, 50, 51, 52, 53],
      [54, 55, 56, 57, 58],
    ])

    sizes = new DeviceSizes(new Sizes('80vw'), devices)
    expect(sizes.targets).toEqual([
      { w: 2048, dppx: 1, orientation: 'landscape' },
      { w: 1536, dppx: 1, orientation: 'landscape' },
      { w: 1344, dppx: 1, orientation: 'landscape' },
      { w: 2304, dppx: 2, orientation: 'landscape' },
      { w: 1152, dppx: 1, orientation: 'landscape' },
      { w: 2186, dppx: 2, orientation: 'landscape' },
      { w: 1093, dppx: 1, orientation: 'landscape' },
      { w: 2048, dppx: 2, orientation: 'landscape' },
      { w: 1536, dppx: 1.5, orientation: 'landscape' },
      { w: 1024, dppx: 1, orientation: 'landscape' },
      { w: 1639, dppx: 2, orientation: 'portrait' },
      { w: 820, dppx: 1, orientation: 'portrait' },
      { w: 1639, dppx: 2, orientation: 'landscape' },
      { w: 820, dppx: 1, orientation: 'landscape' },
      { w: 2304, dppx: 3, orientation: 'landscape' },
      { w: 1536, dppx: 2, orientation: 'landscape' },
      { w: 768, dppx: 1, orientation: 'landscape' },
      { w: 1280, dppx: 2, orientation: 'portrait' },
      { w: 960, dppx: 1.5, orientation: 'portrait' },
      { w: 640, dppx: 1, orientation: 'portrait' },
      { w: 1229, dppx: 2, orientation: 'portrait' },
      { w: 615, dppx: 1, orientation: 'portrait' },
      { w: 2458, dppx: 4, orientation: 'landscape' },
      { w: 1844, dppx: 3, orientation: 'landscape' },
      { w: 1536, dppx: 2.5, orientation: 'landscape' },
      { w: 615, dppx: 1, orientation: 'landscape' },
      { w: 1932, dppx: 3.5, orientation: 'landscape' },
      { w: 1104, dppx: 2, orientation: 'landscape' },
      { w: 552, dppx: 1, orientation: 'landscape' },
      { w: 2048, dppx: 4, orientation: 'landscape' },
      { w: 1536, dppx: 3, orientation: 'landscape' },
      { w: 1024, dppx: 2, orientation: 'landscape' },
      { w: 768, dppx: 1.5, orientation: 'landscape' },
      { w: 512, dppx: 1, orientation: 'landscape' },
      { w: 1440, dppx: 3, orientation: 'portrait' },
      { w: 960, dppx: 2, orientation: 'portrait' },
      { w: 480, dppx: 1, orientation: 'portrait' },
      { w: 1536, dppx: 4, orientation: 'landscape' },
      { w: 1152, dppx: 3, orientation: 'landscape' },
      { w: 768, dppx: 2, orientation: 'landscape' },
      { w: 576, dppx: 1.5, orientation: 'landscape' },
      { w: 384, dppx: 1, orientation: 'landscape' },
      { w: 1383, dppx: 4, orientation: 'portrait' },
      { w: 1037, dppx: 3, orientation: 'portrait' },
      { w: 864, dppx: 2.5, orientation: 'portrait' },
      { w: 346, dppx: 1, orientation: 'portrait' },
      { w: 1154, dppx: 3.5, orientation: 'portrait' },
      { w: 660, dppx: 2, orientation: 'portrait' },
      { w: 330, dppx: 1, orientation: 'portrait' },
      { w: 1152, dppx: 4, orientation: 'portrait' },
      { w: 864, dppx: 3, orientation: 'portrait' },
      { w: 576, dppx: 2, orientation: 'portrait' },
      { w: 432, dppx: 1.5, orientation: 'portrait' },
      { w: 288, dppx: 1, orientation: 'portrait' },
      { w: 1024, dppx: 4, orientation: 'portrait' },
      { w: 768, dppx: 3, orientation: 'portrait' },
      { w: 512, dppx: 2, orientation: 'portrait' },
      { w: 384, dppx: 1.5, orientation: 'portrait' },
      { w: 256, dppx: 1, orientation: 'portrait' },
    ])
  })

  test('calculate queries using custom devices', () => {
    const devices = Device.fromDefinitions([
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
    ])

    const sizes = new DeviceSizes(
      new Sizes('(min-width: 680px) 400px, 100vw'),
      devices
    )

    expect(sizes.targets).toEqual([
      { w: 600, dppx: 1.5, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 800, dppx: 2, orientation: 'landscape' },
      { w: 400, dppx: 1, orientation: 'landscape' },
      { w: 1200, dppx: 2, orientation: 'portrait' },
      { w: 600, dppx: 1, orientation: 'portrait' },
    ])

    expect(sizes.landscape).toEqual([0, 1, 2, 3])
    expect(sizes.portrait).toEqual([4, 5])
    expect(sizes.groupBySize(sizes.devices.map((_d, i) => i))).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ])
  })
})
