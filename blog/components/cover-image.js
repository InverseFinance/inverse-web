import ContentfulImage from './contentful-image'
import Link from 'next/link'
import cn from 'classnames'
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';

// standard image size for posts are 1200x630
export default function CoverImage({
  title,
  url,
  slug,
  width = 1200,
  height = 630,
}) {
  const { locale } = useContext(BlogContext);
  const image = (
    <ContentfulImage
      width={width}
      height={height}
      alt={`Cover Image for ${title}`}
      className={cn('shadow-small', {
        'hover:shadow-medium transition-shadow duration-200': slug,
      })}
      src={url}
    />
  )

  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/blog/posts/${locale}/${slug}`} legacyBehavior>
          <a aria-label={title}>{image}</a>
        </Link>
      ) : (
        image
      )}
    </div>
  )
}
