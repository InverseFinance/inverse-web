import { getBlogAuthorsProps } from '../../../blog/lib/utils'
import { BLOG_LOCALES } from '../../../blog/lib/constants'
import BlogAuthors from '../../../blog/components/page-layouts/blog-authors'

export default function BlogAuthorsSSG(props) {
  return BlogAuthors(props)
}

// revalidation vya webhook
export async function getStaticProps(context) {
  return { ... await getBlogAuthorsProps(context), revalidate: 60 }
}

export async function getStaticPaths() {
  return {
    paths: BLOG_LOCALES.map(l => `/blog/authors/${l}`),
    fallback: true,
  }
}

