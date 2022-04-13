import Link from 'next/link'
import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'
import TagsBar from './tags-bar'
import { HStack, Stack, VStack, Text, SimpleGrid } from '@chakra-ui/react'
import { BLOG_THEME } from '../lib/constants'
import Excerpt from './excerpt'

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
    <Stack as="section" direction={{ base: 'column', lg: 'column' }} w='full' maxWidth="900px" spacing="6">
      <VStack justifyContent="space-between" alignItems="flex-start">
        <Text w='full' as="h3" color={BLOG_THEME.colors.activeTextColor} fontSize="4xl" fontWeight="extrabold">
          <Link href={url}>
            <a className="hover:underline">{title}</a>
          </Link>
        </Text>
        {author && <Avatar name={author.name} picture={author.picture} title={author.title} />}
        <Stack w='full' direction={{ base: 'column', lg: 'row' }} justifyContent="space-between">
          <DateComponent dateString={date} readtime={readtime} />
          <TagsBar tagsCollection={tagsCollection} />
        </Stack>
      </VStack>
      <VStack alignItems="flex-start" spacing="5">
        {
          !!coverImage?.url &&
          <CoverImage title={title} slug={slug} url={coverImage.url} maxHeight={'300px'} />
        }
        <Excerpt excerpt={excerpt} content={content} url={url} />
      </VStack>
    </Stack>
  )
}
