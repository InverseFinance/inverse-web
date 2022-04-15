import Avatar from '../components/avatar'
import DateComponent from '../components/date'
import CoverImage from '../components/cover-image'
import PostTitle from '../components/post-title'
import { Stack, Box, VStack, Flex } from '@chakra-ui/react'
import TagsBar from './tags-bar'
import { ChevronLeftIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/router'
import { BLOG_THEME } from '../lib/constants'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'

export default function PostHeader({ title, coverImage, date, author, readtime, tagsCollection }) {
  const router = useRouter();
  const { locale } = useContext(BlogContext);
  return (
    <Box w='full' mx="auto" position="relative">
      <ChevronLeftIcon
        display={{ base: 'none', sm: 'block' }}
        onClick={() => router.push(`/blog/${locale}`)}
        cursor="pointer"
        position="absolute"
        fontSize={"48px"}
        left="2%"
        top={{ base: '0', lg: '22px' }}
        color={BLOG_THEME.colors.passiveTextColor}
        _hover={{ color: BLOG_THEME.colors.activeTextColor }}
        transitionProperty="color, font-size"
        transitionDuration="500ms"
      />
      <PostTitle maxW="4xl">
        {title}
      </PostTitle>
      <Box maxW="4xl" mx="auto">
        <Stack spacing="4" direction={{ base: 'column', lg: 'row' }} w="full" justifyContent="space-between">
          {author && <Avatar picture={author.picture} name={author.name} title={author.title} />}
          <TagsBar tagsCollection={tagsCollection} />
        </Stack>
        <VStack pt="8" alignItems="flex-start" w="full" spacing="4">
          <DateComponent dateString={date} readtime={readtime} />
          <Flex w='full' justifyContent="center">
            {
              !!coverImage?.url && <CoverImage title={title} url={coverImage.url} />
            }
          </Flex>
        </VStack>
      </Box>
    </Box>
  )
}
