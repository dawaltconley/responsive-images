# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run tests only
npx vitest run

# Run tests in watch mode
npx vitest

# Run a single test file
npx vitest run tests/sizes.test.ts

# Lint (ESLint + Stylelint + Prettier)
npm run lint

# Run tests + lint (full CI check)
npm test

# Compile TypeScript to dist/
npx tsc

# Full build (compile + copy Sass mixins to dist/sass/)
npm run build

# Generate TypeDoc documentation
npm run document
```

## Architecture Overview

This is a TypeScript npm library (`@dawaltconley/responsive-images`) that wraps `@11ty/eleventy-img` to auto-calculate responsive image widths from a CSS `sizes` query string and a device list.

### Core data flow

1. **`ConfigOptions` → `Config`** (`src/lib/config.ts`): Holds global settings — `devices`, `scalingFactor`, `defaults` (passed to EleventyImage), `sassPrefix`, `disable`.

2. **`ResponsiveImages extends Config`** (`src/index.ts`): The public entrypoint. `responsive(src)` returns a `ConfiguredImage`.

3. **`ConfiguredImage extends Image`** (`src/lib/image.ts`): Wraps an image source. Key method: `fromSizes(sizesQueryString)` — parses the sizes string, maps it across all configured devices to determine required widths, and calls EleventyImage to generate them.

4. **`ChainedPromise<T>`** (`src/lib/chained-promise.ts`): A Proxy-based pattern that lets you call methods on an unresolved Promise's result without awaiting first. `fromSizes()` and `resize()` return this type, enabling the method-chaining API.

5. **`Metadata` / `SizesMetadata`** (`src/lib/metadata.ts`): Wraps EleventyImage's metadata object and provides output methods: `toPicture()`, `toSources()`, `toHast()`, and `toCss()`.

6. **`DeviceSizes`** (`src/lib/device-sizes.ts`): Combines a parsed `Sizes` query with a list of `Device` objects to compute which image widths are needed. Also produces `MediaQueries` for CSS background-image use.

### Package exports

| Export path | Entry point | Purpose |
|---|---|---|
| `.` (default) | `dist/index.js` | Main JS API |
| `./eleventy` | `dist/plugins/eleventy.js` | Eleventy shortcodes/filters for Nunjucks & Liquid |
| `./sass` | `dist/sass/index.js` | `getSassFunctions()` for Sass custom functions |
| `./devices` | `dist/data/devices.js` | Default device list |

The Sass `_mixins.scss` file is compiled separately — `build.sh` copies it from `src/sass/_mixins.scss` to `dist/sass/` after `tsc` runs.

### Build output

TypeScript compiles to `dist/`. The `dist/` directory is what gets published to npm (along with `_index.scss`). Never edit files in `dist/` directly.
