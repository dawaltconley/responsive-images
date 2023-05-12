import sass from 'sass'
import ResponsiveImages from '../src/index'

const raw = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw({ raw: strings }, ...values)
const css = raw,
  scss = raw

const { sassFunctions } = new ResponsiveImages({
  scalingFactor: 0.5,
  defaults: {
    dryRun: true,
    filenameFormat: (_id, _src, width, format) => `output-${width}.${format}`,
  },
})

const compile = (sassString: string): Promise<string> =>
  sass
    .compileStringAsync(
      scss`
        @use '../src/sass/_mixins.scss' as responsive;
        ${sassString}`,
      {
        loadPaths: ['node_modules'],
        functions: sassFunctions,
      }
    )
    .then(result => result.css)

describe('bg mixin', () => {
  test('generates responsive background images from default values', async () => {
    const [output, expected] = await Promise.all([
      compile(scss`
        .bg-image {
          @include responsive.bg('./tests/assets/xlg.jpg');
        }
      `),
      compile(css`
        @media (orientation: landscape) and (min-width: 1921px) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1920px) and (min-width: 1681px) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1680px) and (min-width: 1441px) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1440px) and (min-width: 1367px) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 1440px) and (min-width: 1367px) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1440px) and (min-width: 1367px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 1440px) and (min-width: 1367px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1366px) and (min-width: 1281px) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 1366px) and (min-width: 1281px) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1366px) and (min-width: 1281px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 1366px) and (min-width: 1281px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1280px) and (min-width: 1025px) and (-webkit-min-device-pixel-ratio: 1.51),
          (orientation: landscape) and (max-width: 1280px) and (min-width: 1025px) and (min-resolution: 145dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1280px) and (min-width: 1025px) and (-webkit-max-device-pixel-ratio: 1.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 1280px) and (min-width: 1025px) and (max-resolution: 144dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1280px) and (min-width: 1025px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 1280px) and (min-width: 1025px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1024px) and (min-width: 961px) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 1024px) and (min-width: 961px) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 1024px) and (min-width: 961px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 1024px) and (min-width: 961px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 960px) and (min-width: 769px) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: landscape) and (max-width: 960px) and (min-width: 769px) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 960px) and (min-width: 769px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 960px) and (min-width: 769px) and (max-resolution: 192dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 960px) and (min-width: 769px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 960px) and (min-width: 769px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (-webkit-min-device-pixel-ratio: 3.01),
          (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (min-resolution: 289dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (-webkit-max-device-pixel-ratio: 3) and (-webkit-min-device-pixel-ratio: 2.51),
          (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (max-resolution: 288dpi) and (min-resolution: 241dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (-webkit-max-device-pixel-ratio: 2.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (max-resolution: 240dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 768px) and (min-width: 691px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 690px) and (min-width: 641px) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: landscape) and (max-width: 690px) and (min-width: 641px) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 690px) and (min-width: 641px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 690px) and (min-width: 641px) and (max-resolution: 192dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 690px) and (min-width: 641px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 690px) and (min-width: 641px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (-webkit-min-device-pixel-ratio: 3.01),
          (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (min-resolution: 289dpi) {
          .bg-image {
            background-image: url('/img/output-3072.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (-webkit-max-device-pixel-ratio: 3) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (max-resolution: 288dpi) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.51),
          (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (max-resolution: 192dpi) and (min-resolution: 145dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (-webkit-max-device-pixel-ratio: 1.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (max-resolution: 144dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 640px) and (min-width: 481px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-640.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 480px) and (-webkit-min-device-pixel-ratio: 3.01),
          (orientation: landscape) and (max-width: 480px) and (min-resolution: 289dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 480px) and (-webkit-max-device-pixel-ratio: 3) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: landscape) and (max-width: 480px) and (max-resolution: 288dpi) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 480px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.51),
          (orientation: landscape) and (max-width: 480px) and (max-resolution: 192dpi) and (min-resolution: 145dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 480px) and (-webkit-max-device-pixel-ratio: 1.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: landscape) and (max-width: 480px) and (max-resolution: 144dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: landscape) and (max-width: 480px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: landscape) and (max-width: 480px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-640.jpeg');
          }
        }
        @media (orientation: portrait) and (min-width: 801px) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (min-width: 801px) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: portrait) and (min-width: 801px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (min-width: 801px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 800px) and (min-width: 769px) and (-webkit-min-device-pixel-ratio: 1.51),
          (orientation: portrait) and (max-width: 800px) and (min-width: 769px) and (min-resolution: 145dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 800px) and (min-width: 769px) and (-webkit-max-device-pixel-ratio: 1.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 800px) and (min-width: 769px) and (max-resolution: 144dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 800px) and (min-width: 769px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 800px) and (min-width: 769px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 768px) and (min-width: 601px) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 768px) and (min-width: 601px) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 768px) and (min-width: 601px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 768px) and (min-width: 601px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 600px) and (min-width: 433px) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: portrait) and (max-width: 600px) and (min-width: 433px) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 600px) and (min-width: 433px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 600px) and (min-width: 433px) and (max-resolution: 192dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 600px) and (min-width: 433px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 600px) and (min-width: 433px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-640.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (-webkit-min-device-pixel-ratio: 3.01),
          (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (min-resolution: 289dpi) {
          .bg-image {
            background-image: url('/img/output-2048.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (-webkit-max-device-pixel-ratio: 3) and (-webkit-min-device-pixel-ratio: 2.51),
          (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (max-resolution: 288dpi) and (min-resolution: 241dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (-webkit-max-device-pixel-ratio: 2.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (max-resolution: 240dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 432px) and (min-width: 413px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-432.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 412px) and (min-width: 361px) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: portrait) and (max-width: 412px) and (min-width: 361px) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 412px) and (min-width: 361px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 412px) and (min-width: 361px) and (max-resolution: 192dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 412px) and (min-width: 361px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 412px) and (min-width: 361px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-432.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (-webkit-min-device-pixel-ratio: 3.01),
          (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (min-resolution: 289dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (-webkit-max-device-pixel-ratio: 3) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (max-resolution: 288dpi) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.51),
          (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (max-resolution: 192dpi) and (min-resolution: 145dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (-webkit-max-device-pixel-ratio: 1.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (max-resolution: 144dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-640.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 360px) and (min-width: 321px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-432.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 320px) and (-webkit-min-device-pixel-ratio: 3.01),
          (orientation: portrait) and (max-width: 320px) and (min-resolution: 289dpi) {
          .bg-image {
            background-image: url('/img/output-1442.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 320px) and (-webkit-max-device-pixel-ratio: 3) and (-webkit-min-device-pixel-ratio: 2.01),
          (orientation: portrait) and (max-width: 320px) and (max-resolution: 288dpi) and (min-resolution: 193dpi) {
          .bg-image {
            background-image: url('/img/output-960.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 320px) and (-webkit-max-device-pixel-ratio: 2) and (-webkit-min-device-pixel-ratio: 1.51),
          (orientation: portrait) and (max-width: 320px) and (max-resolution: 192dpi) and (min-resolution: 145dpi) {
          .bg-image {
            background-image: url('/img/output-640.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 320px) and (-webkit-max-device-pixel-ratio: 1.5) and (-webkit-min-device-pixel-ratio: 1.01),
          (orientation: portrait) and (max-width: 320px) and (max-resolution: 144dpi) and (min-resolution: 97dpi) {
          .bg-image {
            background-image: url('/img/output-640.jpeg');
          }
        }
        @media (orientation: portrait) and (max-width: 320px) and (-webkit-max-device-pixel-ratio: 1),
          (orientation: portrait) and (max-width: 320px) and (max-resolution: 96dpi) {
          .bg-image {
            background-image: url('/img/output-432.jpeg');
          }
        }
      `),
    ])
    expect(output).toEqual(expected)
  })
})
