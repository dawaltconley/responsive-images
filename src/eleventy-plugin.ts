import ResponsiveImages, { ResponsiveImagesOptions } from './index'

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

module.exports = function (
  eleventyConfig: any,
  options: ResponsiveImagesOptions | InstanceType<typeof ResponsiveImages> = {}
): void {
  let configured: InstanceType<typeof ResponsiveImages>
  if (options instanceof ResponsiveImages) configured = options
  else configured = new ResponsiveImages(options)

  const { resize, generateSources, generatePicture } = configured

  // Nunjucks
  eleventyConfig.addNunjucksAsyncFilter('resize', resize)
  eleventyConfig.addNunjucksAsyncFilter('img', filterify(generateSources))
  eleventyConfig.addNunjucksAsyncShortcode('img', generateSources)
  eleventyConfig.addNunjucksAsyncFilter('picture', filterify(generatePicture))
  eleventyConfig.addNunjucksAsyncShortcode('picture', generatePicture)
}
