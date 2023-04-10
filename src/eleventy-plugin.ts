import { ResponsiveImages, ResponsiveImagesOptions } from './index'

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
}
