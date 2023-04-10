# Responsive Images

Functions for statically generating [responsive 
image](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
markup. These currently exist as a convenience wrapper around the 
[Eleventy Image plugin](https://www.11ty.dev/docs/plugins/image/), 
though it can be used with any site that has a static build step in its 
markup generation.

It determines which image sizes you need to generate by parsing a [sizes
query
string](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes)
and comparing it with a range of target devices. This means that, as
long as you write a good sizes query, you don't need to specify the
widths for each image you want to generate.

## Install

```
npm install @dawaltconley/responsive-images
```

## Configure

Most configuration is handled globally in the default class constructor.
This can be exported as a singleton for use in multiple files.

```js
import ResponsiveImages from '@dawaltconley/responsive-images'
 
export default new ResponsiveImages({ 
  scalingFactor: 0.6,
  disable: false,
  defaults: { 
    formats: ['webp', null], 
    urlPath: '/assets/generated/', 
    outputDir: './dist/assets/generated/', 
  }, 
}) 
```

## Options

All config options are optional.

### `defaults<ImageOptions> = {}`

A set of options that gets passed to Eleventy Image whenever it is
called. You probably want to specify at least a `urlPath` and 
`outputDir` for the generated images. See [the Eleventy Image 
docs](https://www.11ty.dev/docs/plugins/image/) for all available 
options.

### `scalingFactor<number> = 0.8`

The maximum difference in size between any two images created when
downsizing. This uses pixels to approximate a file size. At a scaling
factor of `0.5`, for example, each image created will have no more than
half the total pixels of the previous image.

The number should be a proportional float between 0 and 1. A higher
scaling factor creates more images with smaller gaps in their sizes. A
lower scaling factor creates fewer images with larger gaps in their
sizes. At very low scaling factors, some devices may need to load larger
images than necessary.

### `devices`

A set of devices to support when calculating image sizes from a sizes
query string. Defaults to an internal device list that can be imported
from `@dawaltconley/responsive-images/devices`.

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
  ]
}) 
```

### `sassPrefix<string> = 'image'`

A string used to prefix the Sass `background-image` functions, which can
be edited to avoid global namespace collisions. Defaults to `image`,
which creates functions named `image-resize` and `image-queries`.

```js
import ResponsiveImages from '@dawaltconley/responsive-images';
import sass from 'sass';

const { sassFunctions } = new ResponsiveImages({
  sassPrefix: 'custom-prefix',
});

// only the compileAsync and compileStringAsync methods are supported
sass.compileAsync('./styles/images.scss', {
  loadPaths: ['./node_modules'],
  functions: sassFunctions,
});
```

If changed, the same prefix should be passed to the mixins when
importing.

```scss
@use '@dawaltconley/responsive-images' with ($prefix: 'custom-prefix');

.example {
  @include responsive-images.bg('./assets/some-background.png');
}
```

### `disable<boolean> = false`

If true, disables new image generation so that all methods output image 
elements at their original size. Useful for avoiding repeated rebuilds 
on development environments.

## Plugins

This package includes a few plugins for compatible static site 
generators.

### Eleventy

The [Eleventy](https://www.11ty.dev/docs/) plugin provides shortcodes
for the Nunjucks and Liquid templating languages. It relies on their
async methods to generate new images together with the responsive image
markup.

```js
// .eleventy.js
const responsiveImagesPlugin = require('@dawaltconley/responsive-images/eleventy');

module.exports = eleventyConfig => {
  eleventyConfig.addPlugin(responsiveImagesPlugin, {
    scalingFactor: 0.5,
    defaults: {
      urlPath: '/assets/generated/',
      outputDir: './_site/assets/generated/',
    },
  });
};
```

You can also pass a configured `ResponsiveImages` class instance to the
plugin, if you are using its methods elsewhere.

Then, call the functions within your templates:

```njk
<div>
  {% picture "assets/example.jpg"
    alt="A responsive picture element"
    sizes="(min-width: 800px) 400px, 100vw" %}

  <picture class="picture-class">
    {% img "assets/example.jpg"
      alt="Use the img shortcode to include image sources without a picture element"
      class="passed-to-image-element"
      sizes="(min-width: 1000px) 50vw, 100vw" %}
  </picture>

  {% set metadata = "assets/example.jpg" | resize({ alt: 'Passed directly to EleventyImage', widths=[null] }) %}
</div>
```

### Sass

This package includes Sass mixins and custom functions for generating
responsive images using media queries and the CSS `background-image`
property.

```scss
@use './node_modules/@dawaltconley/responsive-images';

.example {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;

  @include responsive-images.bg(
    $src: './assets/bg.jpg', // can be passed as the first positional argument
    $sizes: '(min-width: 1000px) 50vw, 100vw', // optional; defaults to 100vw
    $widths: 1000 800 600, // optional list of manual widths. doesn't change media queries.
    $formats: webp, // optional; defaults to null (the original image format is preserved).
    $orientations: portrait landscape, // optionally target a single viewport orientation
  );
}
```

These mixins rely on custom functions, which should be passed to Sass
via the `ResponsiveImages.sassFunctions` property.

In addition to the above keyword arguments, you can pass additional
`background-image` backgrounds (such as linear-gradient functions) using
the `$prepend-backgrounds` and `$append-backgrounds` arguments.

This currently generates a fair amount of media queries. If you are
creating lots of responsive background images, you may want to use a
post-processor like
[postcss-sort-media-queries](https://www.npmjs.com/package/postcss-sort-media-queries).

Multiple image formats are not currently supported; only the first
format passed to the mixin will be used.
