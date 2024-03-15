import {
  forwardRef,
  cloneElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
} from 'react'
import type {
  HastOutput,
  HastImage,
  HastSource,
} from '@dawaltconley/responsive-images'

export type ResponsiveImageData = Record<string, HastOutput>

export interface ImageProps extends ComponentPropsWithoutRef<'img'> {
  src: string
  alt: string
  images?: ResponsiveImageData
  __isInPicture?: true
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, images, __isInPicture, ...props }, ref) => {
    const hast = images ? images[src] : null
    if (!hast) {
      return (
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )
    }

    const sources = hast.children.filter(
      (e): e is HastSource => e.tagName === 'source',
    )
    const img = hast.children.find((e): e is HastImage => e.tagName === 'img')

    if (!img) {
      throw new Error(`Responsive image metadata missing img element: ${src}`)
    }
    if (sources.length > 0 && !__isInPicture) {
      throw new Error(
        `Responsive image element must be wrapped in a picture element: ${src}`,
      )
    }

    return (
      <>
        {sources.map(({ properties }) => (
          <source key={properties.type?.toString()} {...properties} />
        ))}
        <img
          ref={ref}
          loading="lazy"
          decoding="async"
          {...img.properties}
          {...props}
        />
      </>
    )
  },
)

export interface PictureProps extends ComponentPropsWithoutRef<'picture'> {
  children: ReactElement<ImageProps, typeof Image>
}

export const Picture = forwardRef<HTMLPictureElement, PictureProps>(
  ({ children, ...props }, ref) => (
    <picture ref={ref} {...props}>
      {cloneElement(children, { __isInPicture: true })}
    </picture>
  ),
)

// export function Foo() {
//   return (
//     <div className="foo">
//       <Picture className="picture-class">
//         <Image src="foo.png" alt="foo" className="bar" images={{}} />
//       </Picture>
//     </div>
//   )
// }
