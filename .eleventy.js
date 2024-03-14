/* eslint-disable @typescript-eslint/no-var-requires */

const {
  default: responsiveImagesPlugin,
} = require('./dist/plugins/eleventy.js')

const devices = [
  {
    w: 1920,
    h: 1200,
    dppx: [1],
    flip: false,
  },
  {
    w: 1024,
    h: 768,
    dppx: [2, 1],
    flip: true,
  },
  {
    w: 768,
    h: 432,
    dppx: [4, 2.5],
    flip: true,
  },
]

module.exports = eleventyConfig => {
  eleventyConfig.addPlugin(responsiveImagesPlugin, {
    devices,
    scalingFactor: 1, // match each device exactly; easier testing
    defaults: {
      formats: ['webp', null],
      outputDir: './eleventy/_site/assets/',
      urlPath: '/assets/',
    },
  })

  return {
    dir: {
      input: './eleventy',
      output: './eleventy/_site',
    },
    htmlTemplateEngine: 'njk',
  }
}
