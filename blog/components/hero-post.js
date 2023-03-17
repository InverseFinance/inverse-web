import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';
import TagsBar from './tags-bar'
import { Stack, VStack, Image } from '@chakra-ui/react'
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
  isPinned = false
}) {
  const { locale } = useContext(BlogContext)
  const url = `/blog/posts/${locale}/${slug}`;
  return (
    <VStack alignItems="flex-start" as="section" w='full' maxWidth="900px" spacing="4">

      <h3>
        <BlogLink _hover={{}} href={url} w='full' fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" display="inline-flex" alignItems="center">
          {isPinned && <Image title="Pinned Post" src="/assets/pin.png?1" w="20px" h="20px" mr="1" />}{title}
        </BlogLink>
      </h3>

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
