import { getDefaultProps } from '../../../blog/lib/utils'
import { BLOG_LOCALES } from '../../../blog/lib/constants'
import BlogMerch from '../../../blog/components/page-layouts/blog-merch'

export default function BlogMerchSSR(props) {
  return BlogMerch(props)
}

// revalidation vya webhook
export async function getServerSideProps(context) {
  return getDefaultProps(context)
}