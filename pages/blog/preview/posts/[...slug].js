import BlogPost from '../../../../blog/components/page-layouts/blog-post'
import { getBlogPostProps } from '../../../../blog/lib/utils'

export default function BlogPostSSR(props) {
  return BlogPost(props)
}

export async function getServerSideProps(context) {
  return getBlogPostProps(context)
}