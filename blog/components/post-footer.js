import Avatar from './avatar'
import { Divider, HStack, Stack } from '@chakra-ui/react'
import TagsBar from './tags-bar'

export default function PostFooter({ author, tagsCollection }) {
  return (
    <div className="max-w-4xl mx-auto">
      <Divider my="5" />
      <Stack spacing="4" direction={{ base: 'column', sm: 'row' }} w="full" justifyContent="space-between">
        <HStack>
          {author && <Avatar name={author.name} picture={author.picture} title={author.title} />}
        </HStack>
        <TagsBar tagsCollection={tagsCollection} />
      </Stack>
    </div>
  )
}
