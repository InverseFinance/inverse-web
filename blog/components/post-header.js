import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import PostTitle from '../components/post-title'
import { Stack, Box, VStack, Flex } from '@chakra-ui/react'
import TagsBar from './tags-bar'

export default function PostHeader({ title, coverImage, date, author, readtime, tagsCollection }) {
  return (
    <Box w='full'>
      <PostTitle>{title}</PostTitle>
      <Box maxW="4xl" mx="auto">
        <Stack spacing="4" direction={{ base: 'column', lg: 'row' }} w="full" justifyContent="space-between">
          {author && <Avatar picture={author.picture} name={author.name} title={author.title} />}
          <TagsBar tagsCollection={tagsCollection} />
        </Stack>
        <VStack pt="8" alignItems="flex-start" w="full" spacing="4">
          <DateComponent dateString={date} readtime={readtime} />
          <Flex w='full' justifyContent="center">
            <CoverImage title={title} url={coverImage.url} />
          </Flex>
        </VStack>
      </Box>
    </Box>
  )
}
