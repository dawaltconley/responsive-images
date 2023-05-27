# Astro.js

`@dawaltconley/responsive-images` can be easily added to an Astro.js project
using a `.astro` component or one of their supported frameworks. This solution
is provided for projects using Astro version 2 in Node.js environments.

## Config

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

## Component

Here is an example component file that configures ResponsiveImages and calls its
`sourceFromSizes` method. You may want to import a configured instance into the
component instead, especially if you plan to use other methods in other build
contexts, like the sass mixins.

```astro
---
// src/components/Image.astro
import type { HTMLAttributes } from 'astro/types';
import ResponsiveImages, { FromSizesOptions } from '@dawaltconley/responsive-images';

export interface Props extends HTMLAttributes<'picture'>, FromSizesOptions {
  src: string;
  alt: string;
  imgProps?: HTMLAttributes<'img'>;
}

const { src, alt, sizes, widths, formats, imgProps, ...pictureProps } =
  Astro.props;

// consider importing from a config file
const { sourceFromSizes } = new ResponsiveImages({
  defaults: {
    outputDir: './dist/_responsive-images/',
    urlPath: import.meta.env.PROD
      ? '/_responsive-images/'
      : '/dist/_responsive-images/',
  },
  disable: !import.meta.env.PROD,
});

const sources = await sourceFromSizes(src, {
  ...imgProps,
  alt,
  sizes,
  widths,
  formats,
});
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

You should _not_ import the image you want to use, since this will give you the
image's url path, not the local path to the image file. The string you pass to
`src` should be a relative path from the directory that Astro is being run from.

## Sass

In order to use responsive background-images, pass the `sassFunctions` to Vite
in your Astro config file.

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import images from 'src/lib/responsive-images.mjs'

export default defineConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          functions: images.sassFunctions,
        },
      },
    },
  },
})
```
