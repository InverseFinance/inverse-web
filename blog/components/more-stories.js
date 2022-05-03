import { Box } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import PostPreview from '../components/post-preview'
import { BLOG_PAGINATION_SIZE } from '../lib/constants';
import BlogText from './common/text'
import { useOnScreen } from '@app/hooks/misc';

export default function MoreStories({ posts, byAuthor, nbTotalPosts, ...props }) {
  const [morePosts, setMorePosts] = useState(posts);

  const ref = useRef();
  const isMountedRef = useRef(true);
  const onScreen = useOnScreen(ref, "1800px");

  const hasMore = !nbTotalPosts ? false : (morePosts.length + 1) < nbTotalPosts;

  const fetchData = async () => {
    return fetch(`/api/blog/posts?skip=${morePosts.length + 1}&limit=${BLOG_PAGINATION_SIZE}`)
  }

  useEffect(() => {
    isMountedRef.current = true
    const getMore = async () => {
      if(onScreen && hasMore) {
        const res = await fetchData().catch(() => []);
        const results = await res.json();
        const total = morePosts.concat(results);
        if(!isMountedRef.current) { return }
        setMorePosts(total);
      }
    }
    getMore();
    return () => {
      return isMountedRef.current = false;
    }
  }, [onScreen, hasMore])

  return (
    <Box id="morePostsBox" as="section" {...props}>
      <BlogText as="h2" mb="8" fontSize={{ base: '3xl', sm: '6xl' }} fontWeight="extrabold">
        More Stories{byAuthor ? ` by ${byAuthor}` : ''}
      </BlogText>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
        {morePosts.map((post) => (
          <PostPreview
            key={post.slug}
            {...post}
          />
        ))}
      </div>
      <Box ref={ref}></Box>
    </Box>
  )
}
