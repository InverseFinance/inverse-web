import BlogAuthors from '../../../../blog/components/page-layouts/blog-authors'
import { getBlogAuthorsProps } from '../../../../blog/lib/utils'

export default function BlogAuthorsSSR(props) {
  return BlogAuthors(props)
}

// revalidation vya webhook
export async function getServerSideProps(context) {
  return getBlogAuthorsProps(context)
}

