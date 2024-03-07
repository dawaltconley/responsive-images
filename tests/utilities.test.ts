import type { Rect } from '../src/lib/common'
import { describe, test, expect } from 'vitest'
import { filterSizes, permute } from '../src/lib/utilities'

describe('filterSizes()', () => {
  const sampleWidths: number[] = [
    200, 250, 380, 800, 801, 1000, 1050, 1100, 1440, 1900, 2000,
  ]
  test('filters similar widths by a default scaling factor', () => {
    expect(filterSizes(sampleWidths, 0.8)).toEqual([
      2000, 1440, 1100, 801, 380, 250, 200,
    ])
  })
  test('filters more widths with a stricter scaling factor', () => {
    expect(filterSizes(sampleWidths, 0.6)).toEqual([
      2000, 1440, 1100, 801, 380, 250,
    ])
    expect(filterSizes(sampleWidths, 0.5)).toEqual([2000, 1100, 380, 250])
  })

  const sampleDevices: Rect[] = [
    { w: 200, h: 200 },
    { w: 250, h: 500 },
    { w: 380, h: 2000 },
    { w: 800, h: 450 },
    { w: 801, h: 450 },
    { w: 1000, h: 562.5 },
    { w: 1050, h: 600 },
    { w: 1100, h: 600 },
    { w: 1440, h: 810 },
    { w: 1900, h: 1600 },
    { w: 2000, h: 1125 },
  ]
  const calcDevices = ({ w, h }: Rect) => w * h
  test('filters a list of dimensions by their total area', () => {
    expect(filterSizes(sampleDevices, 0.8, calcDevices)).toEqual([
      { w: 1900, h: 1600 },
      { w: 2000, h: 1125 },
      { w: 1440, h: 810 },
      { w: 380, h: 2000 },
      { w: 1000, h: 562.5 },
      { w: 801, h: 450 },
      { w: 250, h: 500 },
      { w: 200, h: 200 },
    ])
  })
  test('filters more devices with a stricter scaling factor', () => {
    expect(filterSizes(sampleDevices, 0.7, calcDevices)).toEqual([
      { w: 1900, h: 1600 },
      { w: 1440, h: 810 },
      { w: 380, h: 2000 },
      { w: 801, h: 450 },
      { w: 250, h: 500 },
      { w: 200, h: 200 },
    ])
    expect(filterSizes(sampleDevices, 0.35, calcDevices)).toEqual([
      { w: 1900, h: 1600 },
      { w: 380, h: 2000 },
      { w: 250, h: 500 },
      { w: 200, h: 200 },
    ])
  })

  test('filters no items with a scaling factor of 1', () => {
    const sortedWidths = [...sampleWidths].sort((a, b) => b - a)
    const sortedDevices = [...sampleDevices].sort(
      (a, b) => b.w * b.h - a.w * a.h
    )
    expect(filterSizes(sampleWidths, 1)).toEqual(sortedWidths)
    expect(filterSizes(sampleDevices, 1, calcDevices)).toEqual(sortedDevices)
  })

  test('filters arrays with falsy items', () => {
    const withZero = [
      200, 250, 380, 800, 801, 0, 1000, 1050, 1100, 1440, 1900, 2000,
    ]
    expect(filterSizes(withZero, 0.8)).toEqual([
      2000, 1440, 1100, 801, 380, 250, 200, 0,
    ])
  })
})

describe('permute()', () => {
  test('permutes two arrays', () => {
    expect(permute([['a', 'b'], ['c']])).toEqual([
      ['a', 'c'],
      ['b', 'c'],
    ])
    expect(
      permute([
        ['a', 'b'],
        ['c', 'd', 'e'],
      ])
    ).toEqual([
      ['a', 'c'],
      ['a', 'd'],
      ['a', 'e'],
      ['b', 'c'],
      ['b', 'd'],
      ['b', 'e'],
    ])
  })

  test('permutes three arrays', () => {
    expect(
      permute([
        ['a', 'b', 'c'],
        ['c', 'd', 'e'],
        ['g', 'h'],
      ])
    ).toEqual([
      ['a', 'c', 'g'],
      ['a', 'c', 'h'],
      ['a', 'd', 'g'],
      ['a', 'd', 'h'],
      ['a', 'e', 'g'],
      ['a', 'e', 'h'],
      ['b', 'c', 'g'],
      ['b', 'c', 'h'],
      ['b', 'd', 'g'],
      ['b', 'd', 'h'],
      ['b', 'e', 'g'],
      ['b', 'e', 'h'],
      ['c', 'c', 'g'],
      ['c', 'c', 'h'],
      ['c', 'd', 'g'],
      ['c', 'd', 'h'],
      ['c', 'e', 'g'],
      ['c', 'e', 'h'],
    ])
  })
})
