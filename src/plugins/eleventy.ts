/**
 * Plugin for use with Eleventy sites.
 *
 * ```ts
 * import plugin from '@dawaltconley/responsive-images/eleventy'
 * ```
 *
 * Or if you're using CommonJS:
 *
 * ```js
 * const { default: plugin } = require('@dawaltconley/responsive-images/eleventy')
 * ```
 *
 * @module eleventy
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TagImplOptions } from 'liquidjs/dist/template'
import type { Liquid } from 'liquidjs'

import { ResponsiveImages, ConfigOptions } from '../index'
import liquidArgs from 'liquid-args'

type AnyFunction = (...args: any[]) => any
type CallbackFunction = (error?: any, result?: any) => void

const handleKwargs =
  <F extends AnyFunction>(func: F) =>
  (...args: Parameters<F>): ReturnType<F> => {
    args.forEach(arg => {
      if (arg.__keywords === true) delete arg.__keywords
    })
    return func(...args)
  }

const filterify =
  (func: AnyFunction) =>
  async (...filterArgs: any[]) => {
    const args = [...filterArgs]
    const cb: CallbackFunction = args.pop()
    try {
      const result = await func(...args)
      cb(undefined, result)
    } catch (error) {
      cb(error)
    }
  }

const liquidKwargsTag = (cb: (...args: any[]) => string | Promise<string>) =>
  function (engine: Liquid): TagImplOptions {
    return {
      parse: function (tagToken) {
        this.args = tagToken.args
      },
      render: async function (scope) {
        const evalValue = (arg: string) => engine.evalValue(arg, scope)
        const args = await Promise.all(liquidArgs(this.args, evalValue))
        return handleKwargs(cb)(...args)
      },
    }
  }

/**
 * This plugin provides Nunjucks and Liquid filters and shortcodes for adding
 * responsive images to your Eleventy site. Pass this function as the first
 * argument to eleventyConfig.addPlugin()
 *
 * @see https://www.11ty.dev/docs/plugins/
 *
 * @example
 * ```liquid
 * <div>
 *   {% picture "assets/example.jpg",
 *     alt="A responsive picture element",
 *     sizes="(min-width: 800px) 400px, 100vw", %}
 *
 *   {% set picHtml = "assets/example.jpg" | picture({ alt: 'used as a filter', sizes: '100vw' }) #}
 *   {{ picHtml | safe }}
 *
 *   <picture class="picture-class">
 *     {% img "assets/example.jpg",
 *       alt="Use the img shortcode to include image sources without a picture element",
 *       class="passed-to-image-element",
 *       sizes="(min-width: 1000px) 50vw, 100vw" %}
 *   </picture>
 *
 *   {# The resize filter just calls EleventyImage and returns a metadata object #}
 *   {% set metadata = "assets/example.jpg" | resize({ widths: [1200, null] }) %}
 * </div>
 * ```
 */

export default function (
  eleventyConfig: any,
  options: ConfigOptions | ResponsiveImages = {}
): void {
  const configured: ResponsiveImages =
    options instanceof ResponsiveImages
      ? options
      : new ResponsiveImages(options)

  const { resize, sourceFromSizes, pictureFromSizes } = configured

  // Nunjucks
  eleventyConfig.addNunjucksAsyncFilter('resize', filterify(resize))
  eleventyConfig.addNunjucksAsyncFilter('img', filterify(sourceFromSizes))
  eleventyConfig.addNunjucksAsyncShortcode('img', handleKwargs(sourceFromSizes))
  eleventyConfig.addNunjucksAsyncFilter('picture', filterify(pictureFromSizes))
  eleventyConfig.addNunjucksAsyncShortcode(
    'picture',
    handleKwargs(pictureFromSizes)
  )

  // Liquid
  eleventyConfig.addLiquidFilter('resize', resize)
  eleventyConfig.addLiquidFilter('img', sourceFromSizes)
  eleventyConfig.addLiquidFilter('picture', pictureFromSizes)
  eleventyConfig.addLiquidTag('img', liquidKwargsTag(sourceFromSizes))
  eleventyConfig.addLiquidTag('picture', liquidKwargsTag(pictureFromSizes))
}
