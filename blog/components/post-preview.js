import Link from 'next/link'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'
import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from './cover-image'

export default function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
  readtime,
}) {
  const { locale } = useContext(BlogContext)
  return (
    <div>
      <div className="mb-5">
        <CoverImage title={title} slug={slug} url={coverImage.url} height={'150px'} />
      </div>
      <h3 className="text-3xl mb-3 leading-snug font-bold">
        <Link href={`/blog/posts/${locale}/${slug}`}>
          <a className="hover:underline">{title}</a>
        </Link>
      </h3>
      <div className="text-lg mb-4">
        <DateComponent dateString={date} readtime={readtime} />
      </div>
      <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
      {author && <Avatar name={author.name} picture={author.picture} />}
    </div>
  )
}
