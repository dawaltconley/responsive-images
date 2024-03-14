/**
 * All functions needed for building with sass.
 *
 * ```ts
 * import { getSassFunctions } from '@dawaltconley/responsive-images/sass'
 * ```
 *
 * @module sass
 */

import type { Value as SassValue, CustomFunction } from 'sass'
import type ResponsiveImages from '../index'
import cast from 'sass-cast'
import DeviceSizes from '../lib/device-sizes'
import { assertOrientation, assertValidImageFormat } from '../lib/common'
import { toLegacyAsyncFunctions } from './legacy'

/**
 * @returns An object that can be passed to Sass's `compileAsync` or `compileStringAsync` methods.
 * @param config
 * @see {@link https://sass-lang.com/documentation/js-api/modules#compileAsync}
 *
 * @example
 * ```ts
 * import ResponsiveImages from '@dawaltconley/responsive-images'
 * import { getSassFunctions } from '@dawaltconley/responsive-images/sass'
 * import sass from 'sass'
 *
 * const config = new ResponsiveImages()
 *
 * await sass.compileAsync('styles.scss', {
 *   functions: getSassFunctions(config),
 * })
 * ```
 *
 * @example
 * This is necessary to use the responsive-images mixins,
 * which generate CSS for responsive backgorund images.
 *
 * ```scss
 * @use './node_modules/@dawaltconley/responsive-images';
 *
 * .example {
 *   background-position: center;
 *   background-size: cover;
 *   background-repeat: no-repeat;
 *
 *   @include responsive-images.bg(
 *     $src: './assets/bg.jpg',
 *     // can be passed as the first positional argument
 *     $sizes: '(min-width: 1000px) 50vw, 100vw',
 *     // optional; defaults to 100vw
 *     $widths: 1000 800 600,
 *     // optional list of manual widths. doesn't change media queries.
 *     $formats: webp null,
 *     // optional; defaults to null (the original image format is preserved).
 *     $orientations: portrait landscape,
 *     // optionally target a single viewport orientation
 *   );
 * }
 * ```
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
          assertValidImageFormat(s.realNull && s.assertString('formats').text),
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
 * @see {@link getSassFunctions}
 */
export function getLegacySassFunctions(config: ResponsiveImages) {
  return toLegacyAsyncFunctions(getSassFunctions(config))
}
