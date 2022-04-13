import { Box, Text } from '@chakra-ui/react'
import PostPreview from '../components/post-preview'
import { BLOG_THEME } from '../lib/constants'

export default function MoreStories({ posts, ...props }) {
  return (
    <Box as="section" {...props}>
      <Text as="h2" mb="8" fontSize="6xl" color={BLOG_THEME.colors.activeTextColor} fontWeight="extrabold">
        More Stories
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
        {posts.map((post) => (
          <PostPreview
            key={post.slug}
            {...post}
          />
        ))}
      </div>
    </Box>
  )
}
