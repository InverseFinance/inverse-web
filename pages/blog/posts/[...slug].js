import { getAllPostsWithSlug } from '../../../blog/lib/api'
import { getBlogPostProps } from '../../../blog/lib/utils'
import { BLOG_LOCALES } from '../../../blog/lib/constants'
import BlogPost from '../../../blog/components/page-layouts/blog-post'

export default function BlogPostSSG(props) {
  return BlogPost(props)
}

export async function getStaticProps(context) {
  return { ...(await getBlogPostProps(context)), revalidate: false };
}

export async function getStaticPaths() {
  if(!process.env.CONTENTFUL_SPACE_ID) {
    return { paths: [], fallback: true }
  }
  const allPosts = await getAllPostsWithSlug();
  const paths = [];
  BLOG_LOCALES.forEach(l => {
    allPosts?.forEach(({ slug }) => paths.push(`/blog/posts/${l}/${slug}`))
  });

  return {
    paths,
    fallback: true,
  }
}
