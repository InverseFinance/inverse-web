import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import PostTitle from '../components/post-title'
import { HStack, Stack, Box, VStack, Text } from '@chakra-ui/react'
import TagsBar from './tags-bar'
import { BLOG_THEME } from '../lib/constants'

export default function PostHeader({ title, coverImage, date, author, readtime, tagsCollection }) {
  return (
    <Box w='full'>
      <PostTitle>{title}</PostTitle>
      <div className="max-w-4xl mx-auto">
        <Stack spacing="4" direction={{ base: 'column', lg: 'row' }} w="full" justifyContent="space-between">
          <HStack spacing="4">
            {author && <Avatar picture={author.picture} name={author.name} title={author.title} />}
          </HStack>
          <TagsBar tagsCollection={tagsCollection} />
        </Stack>
        <VStack pt="8" alignItems="flex-start" w="full" spacing="4">
          <DateComponent dateString={date} readtime={readtime} />
          <CoverImage title={title} url={coverImage.url} />
        </VStack>
      </div>
    </Box>
  )
}
