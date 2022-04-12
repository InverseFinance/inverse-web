import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import PostTitle from '../components/post-title'
import { Divider, HStack, Stack, Text, Flex } from '@chakra-ui/react'
import { BLOG_THEME } from '../lib/constants'
import Tag from './tag'

export default function PostHeader({ title, coverImage, date, author, readtime, tagsCollection }) {
  return (
    <div className="max-w-6xl mx-auto">
      <PostTitle>{title}</PostTitle>
      <div className="max-w-4xl mx-auto">
        <Flex direction={{ base: 'column', sm: 'row' }} w="full" justifyContent="space-between">
          <HStack>
            {author && <Avatar name={author.name} picture={author.picture} />}
            <DateComponent dateString={date} readtime={readtime} />
          </HStack>
          <HStack>
            {tagsCollection?.items?.map(tag => <Tag {...tag} />)}
          </HStack>
        </Flex>
        <HStack pt="8" justifyContent="center" w="full">
          <CoverImage title={title} url={coverImage.url} />
        </HStack>
      </div>
    </div>
  )
}
