# Astro

`@dawaltconley/responsive-images` can be easily added to an Astro project using
a `.astro` component or one of their supported frameworks. This solution is
provided for projects using Astro version 2 in Node.js environments.

## Using Astro's built-in asset handling

If you just want to automatically generate image widths from a sizes string, you
can wrap Astro's built-in `<Picture />` component like so:

```astro
---
import type { ImageMetadata } from 'astro'
import { Picture } from 'astro:assets'
import { getWidthsFromSizes } from '@dawaltconley/responsive-images'

export type Props = Omit<
  Parameters<typeof Picture>[0],
  'densities' | 'srcset' | 'widths'
> & {
  // seems that src can't be a string
  src: ImageMetadata | Promise<{ default: ImageMetadata }>
}

const props = Astro.props
const widths = getWidthsFromSizes(props.sizes, { scalingFactor: 0.5 })
---

<Picture widths={widths} {...props} />
```

This is the simplest approach.

## Using EleventyImage

You can also use this package for asset generation, with a bit more
configuration.

### Config

Import and configure the package somewhere in your project:

```javascript
// src/lib/responsive-images.mjs
import { ResponsiveImages } from '@dawaltconley/responsive-images'

export default new ResponsiveImages({
  defaults: {
    outputDir: 'dist/responsive-images/',
    urlPath: import.meta.env.PROD
      ? '/responsive-images/'
      : '/dist/responsive-images/',
  },
  disable: !import.meta.env.PROD,
})
```

This setup generates images directly into your `dist` folder during build. The
`disable` flag is recommended to prevent multiple images from being copied over
while running the dev server. You will also need to include the `dist` folder in
the `urlPath` while running the dev server. Paths are relative to the directory
that `astro dev` and `astro build` are run from.

### Component

Here is an example component file that configures ResponsiveImages and calls its
`toSources` method. You may want to import a configured instance into the
component instead, especially if you plan to use other methods in other build
contexts, like the sass mixins.

```astro
---
// src/components/Image.astro
import type { HTMLAttributes } from 'astro/types';
import ResponsiveImages, { type ImageOptions } from '@dawaltconley/responsive-images';

export interface Props extends HTMLAttributes<'picture'>, ImageOptions {
  src: string;
  alt: string;
  sizes: string
  imgProps?: Omit<HTMLAttributes<'img'>, 'sizes' | 'class:list'>
}

const { src, alt, sizes, widths, formats, imgProps, ...pictureProps } =
  Astro.props;

// consider importing from a config file
const images = new ResponsiveImages({
  defaults: {
    outputDir: './dist/_responsive-images/',
    urlPath: import.meta.env.PROD
      ? '/_responsive-images/'
      : '/dist/_responsive-images/',
  },
  disable: !import.meta.env.PROD,
});

const imgOptions: ImageOptions = {}
if (widths) imgOptions.widths = widths
if (formats) imgOptions.formats = formats

const sources = await images
  .responsive(src)
  .fromSizes(sizes, imgOptions)
  .toSources({ ...imgProps, alt })
---

<picture {...pictureProps}>
  <Fragment set:html={sources} />
</picture>
```

You can then include the component in your pages like so. The images will be
generated according to the `sizes` attribute.

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Base.astro'
import Image from '../components/Image.astro';
---

<Layout>
  <h1>A home page with a responsive image</h1>
  <Image
    src="src/assets/example.png"
    alt="Alt text is required!"
    sizes="(min-width: 1024px) 50vw, 100vw"
  />
</Layout>
```

You should _not_ `import` the image you want to use, since this will give you
the image's url path, not the local path to the image file. The string you pass
to `src` should be a relative path from the directory that Astro is being run
from.

## Sass

In order to use responsive background-images, configure the legacy sass
functions and pass them to Vite in your Astro config file. (At the time of
writing,
[Vite only supports the legacy sass API.](https://github.com/vitejs/vite/pull/7170))

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import config from 'src/lib/responsive-images.mjs'
import { getLegacySassFunctions } from '@dawaltconley/responsive-images/sass'

export default defineConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          functions: getLegacySassFunctions(config),
        },
      },
    },
  },
})
```
