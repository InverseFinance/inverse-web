import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import PostTitle from '../components/post-title'
import { HStack, Stack, Box } from '@chakra-ui/react'
import TagsBar from './tags-bar'

export default function PostHeader({ title, coverImage, date, author, readtime, tagsCollection }) {
  return (
    <Box w='full'>
      <PostTitle>{title}</PostTitle>
      <div className="max-w-4xl mx-auto">
        <Stack spacing="4" direction={{ base: 'column', lg: 'row' }} w="full" justifyContent="space-between">
          <HStack>
            {author && <Avatar name={author.name} picture={author.picture} />}
            <DateComponent dateString={date} readtime={readtime} />
          </HStack>
          <TagsBar tagsCollection={tagsCollection} />
        </Stack>
        <HStack pt="8" justifyContent="center" w="full">
          <CoverImage title={title} url={coverImage.url} />
        </HStack>
      </div>
    </Box>
  )
}
