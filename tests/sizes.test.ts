import Sizes from '../src/sizes'
import U from '../src/unit-values'

describe('Sizes.parse()', () => {
  test('parses media query and assigned width', () => {
    expect(Sizes.parse('(min-width: 680px) 400px')).toEqual([
      {
        conditions: [
          {
            mediaFeature: 'min-width',
            value: new U(680, 'px'),
          },
        ],
        width: new U(400, 'px'),
      },
    ])
    expect(Sizes.parse('(max-width: 680px) 100vw')).toEqual([
      {
        conditions: [
          {
            mediaFeature: 'max-width',
            value: new U(680, 'px'),
          },
        ],
        width: new U(100, 'vw'),
      },
    ])
  })

  test('parses media query with fallback value', () => {
    expect(Sizes.parse('(min-width: 680px) 400px, 100vw')).toEqual([
      {
        conditions: [
          {
            mediaFeature: 'min-width',
            value: new U(680, 'px'),
          },
        ],
        width: new U(400, 'px'),
      },
      { conditions: [], width: new U(100, 'vw') },
    ])
  })

  test('parses multiple media queries', () => {
    expect(
      Sizes.parse(
        '(min-width: 1536px) 718.5px, (min-width: 1280px) 590px, (min-width: 1024px) 468px, (min-width: 768px) 704px, (min-width: 640px) 576px, 100vw'
      )
    ).toEqual([
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
    ])
  })

  test('parses combined media queries with the "and" keyword', () => {
    expect(
      Sizes.parse('(max-width: 780px) and (max-height: 720px) 600px, 400px')
    ).toEqual([
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
    ])
  })
})
