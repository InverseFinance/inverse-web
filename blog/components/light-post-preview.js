import Link from 'next/link'
import DateComponent from '../components/date'
import BlogText from './common/text'
import CoverImage from './cover-image'
import { SimpleCard } from '@app/components/common/Cards/Simple'
import { useRouter } from 'next/router'

export default function LightPostPreview({
  title,
  coverImage,
  date,
  slug,
  readtime,
  ...props
}) {
  const url = `/blog/posts/en-US/${slug}`;
  const router = useRouter();

  return (
    <SimpleCard
      cursor="pointer"
      _hover={{ transform: 'scale(1.05)' }}
      transition="transform ease-in-out 200ms"
      spacing="4"
      alignItems="flex-start"
      justifyContent="space-between"
      onClick={() => router.push(url)}
      {...props}
      >
      {
        !!coverImage?.url && <CoverImage title={title} slug={slug} url={coverImage.url} />
      }
      <BlogText as="h3" fontWeight="bold" fontSize={{ base: 'lg', sm: 'xl' }}>
        <Link href={url} legacyBehavior>
          <a>{title}</a>
        </Link>
      </BlogText>
      <DateComponent dateString={date} readtime={readtime} />
    </SimpleCard>
  )
}
