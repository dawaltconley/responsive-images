/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TagImplOptions } from 'liquidjs/dist/src/template'
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

export = function (
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
