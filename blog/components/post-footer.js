import Avatar from './avatar'
import DateComponent from './date'
import CoverImage from './cover-image'
import PostTitle from './post-title'
import { Divider, HStack, Stack, Text, Flex } from '@chakra-ui/react'
import { BLOG_THEME } from '../lib/constants'
import Tag from './tag'

export default function PostFooter({ title, coverImage, date, author, readtime, tagsCollection }) {
  return (
    <div className="max-w-4xl mx-auto">
      <Divider my="5" />
      <Flex direction={{ base: 'column', sm: 'row' }} w="full" justifyContent="space-between">
        <HStack>
          {author && <Avatar name={author.name} picture={author.picture} />}
          <DateComponent dateString={date} readtime={readtime} />
        </HStack>
        <HStack>
          {tagsCollection?.items?.map(tag => <Tag {...tag} />)}
        </HStack>
      </Flex>
    </div>
  )
}
