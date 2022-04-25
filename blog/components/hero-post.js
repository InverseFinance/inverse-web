import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';
import TagsBar from './tags-bar'
import { Stack, VStack } from '@chakra-ui/react'
import Excerpt from './excerpt'
import BlogLink from './common/blog-link'

export default function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
  readtime,
  tagsCollection,
  content,
}) {
  const { locale } = useContext(BlogContext)
  const url = `/blog/posts/${locale}/${slug}`;
  return (
    <VStack alignItems="flex-start" as="section" w='full' maxWidth="900px" spacing="4">

      <BlogLink _hover={{}} href={url} w='full' as="h3" fontSize="4xl" fontWeight="extrabold">
        {title}
      </BlogLink>

      <VStack alignItems="flex-start" spacing="5">
        {
          !!coverImage?.url &&
          <CoverImage title={title} slug={slug} url={coverImage.url} />
        }
        <Excerpt excerpt={excerpt} content={content} url={url} />
        <Stack w='full' direction={{ base: 'column', lg: 'row' }} justifyContent="space-between">
          <DateComponent dateString={date} readtime={readtime} />
          <TagsBar tagsCollection={tagsCollection} />
        </Stack>
        {author && <Avatar name={author.name} picture={author.picture} title={author.title} />}
      </VStack>
    </VStack>
  )
}
