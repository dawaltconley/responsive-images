import type { Value as SassValue, CustomFunction } from 'sass/types'
import type ResponsiveImages from '../index'
import cast from 'sass-cast'
import DeviceSizes from '../lib/device-sizes'
import { assertOrientation, assertValidImageFormat } from '../lib/common'
import { toLegacyAsyncFunctions } from './legacy'

/**
 * @returns An object that can be passed to Sass's `compileAsync` or `compileStringAsync` methods.
 * @see {@link https://sass-lang.com/documentation/js-api/modules#compileAsync}
 */
export function getSassFunctions({
  responsive,
  devices,
  sassPrefix,
}: ResponsiveImages): Record<string, CustomFunction<'async'>> {
  const resizeFunction = `${sassPrefix}-resize($src, $widths: null, $formats: null)`
  const queriesFunction = `${sassPrefix}-queries($src, $widths: null, $formats: null, $orientation: landscape portrait, $sizes: '100vw')`
  return {
    [resizeFunction]: async (args: SassValue[]): Promise<SassValue> => {
      const src: string = args[0].assertString('src').text
      const widths = args[1].asList
        .toArray()
        .map(n => n.realNull && n.assertNumber('widths').value)
      const formats = args[2].asList
        .toArray()
        .map(s =>
          assertValidImageFormat(s.realNull && s.assertString('formats').text)
        )

      const { metadata } = await responsive(src).resize({
        widths,
        formats,
      })
      return cast.toSass(metadata)
    },
    [queriesFunction]: async (args: SassValue[]): Promise<SassValue> => {
      const src = args[0].assertString('src').text
      const widths = args[1].realNull
        ? args[1].asList
            .toArray()
            .map(n => n.realNull && n.assertNumber().value)
        : undefined
      const formats = args[2].asList
        .toArray()
        .map(s => assertValidImageFormat(s.realNull && s.assertString().text))
      const orientations = args[3].asList
        .toArray()
        .map(s => assertOrientation(s.assertString().text))
      const sizes = args[4].assertString('sizes').text

      const image = responsive(src)
      const deviceImages = new DeviceSizes(sizes, devices)
      const metadata = widths
        ? await image.resize({ widths, formats })
        : await deviceImages.resize(image, {
            formats,
          })
      const mediaQueries = deviceImages.toMediaQueries(metadata, {
        orientations,
      })

      return cast.toSass(mediaQueries.imageSet)
    },
  }
}

/**
 * @returns Sass functions, wrapped to support Sass's legacy `render` method.
 * @see {@link https://sass-lang.com/documentation/js-api/functions/render/}
 */
export function getLegacySassFunctions(config: ResponsiveImages) {
  return toLegacyAsyncFunctions(getSassFunctions(config))
}
