import { Box } from '@chakra-ui/react'
import PostPreview from '../components/post-preview'
import BlogText from './common/text'

export default function MoreStories({ posts, byAuthor, ...props }) {
  return (
    <Box as="section" {...props}>
      <BlogText as="h2" mb="8" fontSize="6xl" fontWeight="extrabold">
        More Stories{byAuthor ? ` by ${byAuthor}` : ''}
      </BlogText>
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
