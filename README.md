# Responsive Images

Functions for statically generating
[responsive image](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
markup. These currently exist as a convenience wrapper around the
[Eleventy Image plugin](https://www.11ty.dev/docs/plugins/image/), though it can
be used with any site that has a static build step in its markup generation.

It determines which image sizes you need to generate by parsing a
[sizes query string](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes)
and comparing it with a range of target devices. This means that, as long as you
write a good sizes query, you don't need to specify the widths for each image
you want to generate.

For all methods and options please refer to the
[full documentation](https://dawaltconley.github.io/responsive-images/).

## Basic Usage

```
npm install @dawaltconley/responsive-images
```

The basic API is flexible, but designed around the idea of chaining methods,
which generate the necessary images and return appropriate markup.

```js
import ResponsiveImages from '@dawaltconley/responsive-images'

// set global config options
const { responsive } = new ResponsiveImages({ scalingFactor: 0.5 })

// resize an image based on a sizes query string
// this generates the required images and returns an object representing them
const metadata = await responsive('./path/to/image.png').fromSizes(
  '(max-width: 1280px) 800px, 100vw',
)

// call one of the available methods to get the required markup
const html = `<picture>${metadata.toSources({
  class: 'responsive-image',
  alt: 'image properties go here',
})}</picture>`
```

This library uses a proxied `Promise` object, so you can continue to chain
through the asynchronous methods without awaiting each one.

```js
const hast = await responsive('./path/to/image.png')
  .fromSizes('(max-width: 1280px) 800px, 100vw')
  .toHast({ alt: 'image properties go here' })
```

If you want to generate the images and markup separately, you can use the
`getWidthsFromSizes` function instead.

## Configure

Most configuration is handled globally in the default class constructor. This
can be exported as a singleton for use in multiple files.

```js
import ResponsiveImages from '@dawaltconley/responsive-images'

const config = new ResponsiveImages({
  scalingFactor: 0.6,
  disable: false,
  defaults: {
    formats: ['webp', null],
    urlPath: '/assets/generated/',
    outputDir: './dist/assets/generated/',
  },
})

export default config
export const { responsive } = config
```

## Configuration Options

All config options are optional.

### `defaults<ImageOptions> = {}`

A set of options that gets passed to Eleventy Image whenever it is called. You
probably want to specify at least a `urlPath` and `outputDir` for the generated
images. See [the Eleventy Image docs](https://www.11ty.dev/docs/plugins/image/)
for all available options.

### `scalingFactor<number> = 0.8`

The maximum difference in size between any two images created when downsizing.
This uses pixels to approximate a file size. At a scaling factor of `0.5`, for
example, each image created will have no more than half the total pixels of the
previous image.

The number should be a proportional float between 0 and 1. A higher scaling
factor creates more images with smaller gaps in their sizes. A lower scaling
factor creates fewer images with larger gaps in their sizes. At very low scaling
factors, some devices may need to load larger images than necessary. Meanwhile,
at a scaling factor of `1`, a new image will be created and optimized for each
device supported, no matter how close it is to other images.

### `devices`

A set of devices to support when calculating image sizes from a sizes query
string. Defaults to an internal device list that can be imported from
`@dawaltconley/responsive-images/devices`.

```js
const ipadsOnly = new ResponsiveImages({
  devices: [
    {
      w: 1366,
      h: 1024,
      dppx: [2, 1],
      flip: true,
    },
    {
      w: 1024,
      h: 768,
      dppx: [2, 1],
      flip: true,
    },
  ],
})
```

### `sassPrefix<string> = 'image'`

A string used to prefix the Sass `background-image` functions, which can be
edited to avoid global namespace collisions. Defaults to `image`, which creates
functions named `image-resize` and `image-queries`.

```js
import ResponsiveImages from '@dawaltconley/responsive-images'
import { getSassFunctions } from '@dawaltconley/responsive-images/sass'
import sass from 'sass'

const config = new ResponsiveImages({
  sassPrefix: 'custom-prefix',
})

sass.compileAsync('./styles/images.scss', {
  functions: getSassFunctions(config),
})
```

If changed, you must also pass this prefix when importing the mixins.

```scss
@use '@dawaltconley/responsive-images' with (
  $prefix: 'custom-prefix'
);

.example {
  @include responsive-images.bg('./assets/some-background.png');
}
```

### `disable<boolean> = false`

If true, disables new image generation so that all methods output image elements
at their original size. Useful for avoiding repeated rebuilds on development
environments.

## Plugins

This package includes a few plugins for compatible static site generators.

### Eleventy

The [Eleventy](https://www.11ty.dev/docs/) plugin provides shortcodes for the
Nunjucks and Liquid templating languages. It relies on their async methods to
generate new images together with the responsive image markup.

```js
// .eleventy.js
const responsiveImagesPlugin = require('@dawaltconley/responsive-images/eleventy')

module.exports = eleventyConfig => {
  eleventyConfig.addPlugin(responsiveImagesPlugin, {
    scalingFactor: 0.5,
    defaults: {
      urlPath: '/assets/generated/',
      outputDir: './_site/assets/generated/',
    },
  })
}
```

You can also pass a configured `ResponsiveImages` class instance to the plugin,
if you are using its methods elsewhere.

Then, call the functions within your templates:

```njk
<div>
  {% picture "assets/example.jpg",
    alt="A responsive picture element",
    sizes="(min-width: 800px) 400px, 100vw", %}

  {% set picHtml = "assets/example.jpg" | picture({ alt: 'used as a filter', sizes: '100vw' }) #}
  {{ picHtml | safe }}

  <picture class="picture-class">
    {% img "assets/example.jpg",
      alt="Use the img shortcode to include image sources without a picture element",
      class="passed-to-image-element",
      sizes="(min-width: 1000px) 50vw, 100vw" %}
  </picture>

  {# The resize filter just calls EleventyImage and returns a metadata object #}
  {% set metadata = "assets/example.jpg" | resize({ widths: [1200, null] }) %}
</div>
```

### Astro

There is not currently a plugin for Astro projects, but integration is fairly
straightforward. Refer to
[this guide](https://github.com/dawaltconley/responsive-images/blob/main/solutions/astro.md)
for more information.

### Sass

This package includes Sass mixins and custom functions for generating responsive
images using media queries and the CSS `background-image` property.

```scss
@use './node_modules/@dawaltconley/responsive-images';

.example {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;

  @include responsive-images.bg(
    $src: './assets/bg.jpg',
    // can be passed as the first positional argument
    $sizes: '(min-width: 1000px) 50vw, 100vw',
    // optional; defaults to 100vw
    $widths: 1000 800 600,
    // optional list of manual widths. doesn't change media queries.
    $formats: webp null,
    // optional; defaults to null (the original image format is preserved).
    $orientations: portrait landscape,
    // optionally target a single viewport orientation
  );
}
```

These mixins rely on custom functions, which can be imported from
`@dawaltconley/responsive-images/sass` and passed to Sass's `compileAsync`
method.

In addition to the above keyword arguments, you can pass additional
`background-image` backgrounds (such as linear-gradient functions) using the
`$prepend-backgrounds` and `$append-backgrounds` arguments.

This currently generates a fair amount of media queries. If you are creating
lots of responsive background images, you may want to use a post-processor like
[postcss-sort-media-queries](https://www.npmjs.com/package/postcss-sort-media-queries).

This mixin makes use of the `image-set` function to serve multiple image
formats. Formats will be used (as available) in the order provided: the last
format in the list will be used as a fallback for browsers that don't support
`image-set`.
