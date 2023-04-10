import type { TagImplOptions } from 'liquidjs/dist/src/template'
import type { Liquid } from 'liquidjs'

import { ResponsiveImages, ResponsiveImagesOptions } from './index'
import liquidArgs from 'liquid-args'

type CallbackFunction = (error?: any, result?: any) => void

const filterify =
  (func: Function) =>
  async (...filterArgs: any[]) => {
    let args = [...filterArgs]
    let cb: CallbackFunction = args.pop()
    try {
      let result = await func(...args)
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
        return cb(...args)
      },
    }
  }

export = function (
  eleventyConfig: any,
  options: ResponsiveImagesOptions | InstanceType<typeof ResponsiveImages> = {}
): void {
  let configured: InstanceType<typeof ResponsiveImages>
  if (options instanceof ResponsiveImages) configured = options
  else configured = new ResponsiveImages(options)

  const { resize, sourceFromSizes, pictureFromSizes } = configured

  // Nunjucks
  eleventyConfig.addNunjucksAsyncFilter('resize', resize)
  eleventyConfig.addNunjucksAsyncFilter('img', filterify(sourceFromSizes))
  eleventyConfig.addNunjucksAsyncShortcode('img', sourceFromSizes)
  eleventyConfig.addNunjucksAsyncFilter('picture', filterify(pictureFromSizes))
  eleventyConfig.addNunjucksAsyncShortcode('picture', pictureFromSizes)

  // Liquid
  eleventyConfig.addLiquidFilter('resize', resize)
  eleventyConfig.addLiquidFilter('img', sourceFromSizes)
  eleventyConfig.addLiquidFilter('picture', pictureFromSizes)
  eleventyConfig.addLiquidTag('img', liquidKwargsTag(sourceFromSizes))
  eleventyConfig.addLiquidTag('picture', liquidKwargsTag(pictureFromSizes))
}
