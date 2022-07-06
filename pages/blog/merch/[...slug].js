import { getDefaultProps } from '../../../blog/lib/utils'
import { BLOG_LOCALES } from '../../../blog/lib/constants'
import BlogMerch from '../../../blog/components/page-layouts/blog-merch'

export default function BlogMerchSSG(props) {
  return BlogMerch(props)
}

// revalidation vya webhook
export async function getStaticProps(context) {
  return { ... await getDefaultProps(context), revalidate: 60 }
}

export async function getStaticPaths() {
  return {
    paths: BLOG_LOCALES.map(l => `/blog/merch/${l}`),
    fallback: true,
  }
}

