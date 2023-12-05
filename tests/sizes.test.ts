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
        size: { width: new U(400, 'px') },
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
        size: { width: new U(100, 'vw') },
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
        size: { width: new U(400, 'px') },
      },
      { conditions: null, size: { width: new U(100, 'vw') } },
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
        size: { width: new U(718.5, 'px') },
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 1280),
        size: { width: new U(590, 'px') },
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 1024),
        size: { width: new U(468, 'px') },
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 768),
        size: { width: new U(704, 'px') },
      },
      {
        conditions: set(cloneDeep(condition), 'children[0].value.value', 640),
        size: { width: new U(576, 'px') },
      },
      { conditions: null, size: { width: new U(100, 'vw') } },
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
        size: { width: new U(60, 'vh') },
      },
      { conditions: null, size: { width: new U(400, 'px') } },
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
        size: { width: new U(400, 'px') },
      },
    ])
  })
})

describe('new DeviceSizes()', () => {
  test('calculates queries using the default devices', () => {
    let sizes = new DeviceSizes(new Sizes('400px'), devices)

    expect(sizes.targets).toEqual([
      { width: 400 },
      { width: 400 },
      { width: 400 },
      { width: 800 },
      { width: 400 },
      { width: 800 },
      { width: 400 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
      { width: 800 },
      { width: 400 },
      { width: 800 },
      { width: 400 },
      { width: 1200 },
      { width: 800 },
      { width: 400 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
      { width: 800 },
      { width: 400 },
      { width: 1600 },
      { width: 1200 },
      { width: 1000 },
      { width: 400 },
      { width: 1400 },
      { width: 800 },
      { width: 400 },
      { width: 1600 },
      { width: 1200 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
      { width: 1200 },
      { width: 800 },
      { width: 400 },
      { width: 1600 },
      { width: 1200 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
      { width: 1600 },
      { width: 1200 },
      { width: 1000 },
      { width: 400 },
      { width: 1400 },
      { width: 800 },
      { width: 400 },
      { width: 1600 },
      { width: 1200 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
      { width: 1600 },
      { width: 1200 },
      { width: 800 },
      { width: 600 },
      { width: 400 },
    ])

    sizes.landscape.forEach(n => {
      expect(sizes.devices[n].orientation).toEqual('landscape')
    })
    sizes.portrait.forEach(n => {
      expect(sizes.devices[n].orientation).toEqual('portrait')
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
      { width: 2048 },
      { width: 1536 },
      { width: 1344 },
      { width: 2304 },
      { width: 1152 },
      { width: 2186 },
      { width: 1093 },
      { width: 2048 },
      { width: 1536 },
      { width: 1024 },
      { width: 1639 },
      { width: 820 },
      { width: 1639 },
      { width: 820 },
      { width: 2304 },
      { width: 1536 },
      { width: 768 },
      { width: 1280 },
      { width: 960 },
      { width: 640 },
      { width: 1229 },
      { width: 615 },
      { width: 2458 },
      { width: 1844 },
      { width: 1536 },
      { width: 615 },
      { width: 1932 },
      { width: 1104 },
      { width: 552 },
      { width: 2048 },
      { width: 1536 },
      { width: 1024 },
      { width: 768 },
      { width: 512 },
      { width: 1440 },
      { width: 960 },
      { width: 480 },
      { width: 1536 },
      { width: 1152 },
      { width: 768 },
      { width: 576 },
      { width: 384 },
      { width: 1383 },
      { width: 1037 },
      { width: 864 },
      { width: 346 },
      { width: 1154 },
      { width: 660 },
      { width: 330 },
      { width: 1152 },
      { width: 864 },
      { width: 576 },
      { width: 432 },
      { width: 288 },
      { width: 1024 },
      { width: 768 },
      { width: 512 },
      { width: 384 },
      { width: 256 },
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
      { width: 600 },
      { width: 400 },
      { width: 800 },
      { width: 400 },
      { width: 1200 },
      { width: 600 },
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
