import ContentfulImage from './contentful-image'
import Link from 'next/link'
import cn from 'classnames'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'
import { Image } from '@chakra-ui/react'

export default function CoverImage({ title, url, slug }) {
  const { locale } = useContext(BlogContext);
  const image = (
    // <ContentfulImage
    //   width={2000}
    //   height={500}
    //   alt={`Cover Image for ${title}`}
    //   className={cn('shadow-small', {
    //     'hover:shadow-medium transition-shadow duration-200': slug,
    //   })}
    //   src={url}
    // />
    <Image src={url} />
  )

  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/blog/posts/${locale}/${slug}`}>
          <a aria-label={title}>{image}</a>
        </Link>
      ) : (
        image
      )}
    </div>
  )
}
