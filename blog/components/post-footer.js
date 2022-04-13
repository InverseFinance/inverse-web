import Avatar from './avatar'
import DateComponent from './date'
import { Divider, HStack, Flex } from '@chakra-ui/react'
import TagsBar from './tags-bar'

export default function PostFooter({ date, author, readtime, tagsCollection }) {
  return (
    <div className="max-w-4xl mx-auto">
      <Divider my="5" />
      <Flex direction={{ base: 'column', sm: 'row' }} w="full" justifyContent="space-between">
        <HStack>
          {author && <Avatar name={author.name} picture={author.picture} title={author.title} />}
        </HStack>
        <TagsBar tagsCollection={tagsCollection} />
      </Flex>
    </div>
  )
}
