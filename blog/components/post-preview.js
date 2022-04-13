import { VStack } from '@chakra-ui/react'
import Link from 'next/link'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'
import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from './cover-image'
import Excerpt from './excerpt'

export default function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
  readtime,
  content,
}) {
  const { locale } = useContext(BlogContext)
  const url = `/blog/posts/${locale}/${slug}`;
  return (
    <VStack spacing="4" alignItems="flex-start">
      <CoverImage title={title} slug={slug} url={coverImage.url} height={'150px'} />
      <h3 className="text-3xl leading-snug font-bold">
        <Link href={url}>
          <a className="hover:underline">{title}</a>
        </Link>
      </h3>
      <div className="text-lg">
        <DateComponent dateString={date} readtime={readtime} />
      </div>
      <Excerpt excerpt={excerpt} content={content} url={url} />
      {author && <Avatar name={author.name} picture={author.picture} title={author.title} />}
    </VStack>
  )
}
