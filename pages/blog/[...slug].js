import { getAuthors, getCategories, getTags } from '../../blog/lib/api'
import { getBlogHomeProps } from '../../blog/lib/utils'
import { BLOG_LOCALES } from '../../blog/lib/constants'
import BlogHome from '../../blog/components/page-layouts/blog-home'

export default function BlogHomeSSG(props) {
  return BlogHome(props)
}

// revalidation via webhook
export async function getStaticProps(context) {
  return { ...await getBlogHomeProps(context), revalidate: 1500 }
}

export async function getStaticPaths() {
  if(!process.env.CONTENTFUL_SPACE_ID) {
    return { paths: [], fallback: true }
  }
  const [categories, authors, tags] = await Promise.all([
    getCategories(true, 'en-US'),
    getAuthors(true, 'en-US'),
    getTags(true, 'en-US'),
  ])
  const paths = BLOG_LOCALES.map(l => {
    return `/blog/${l}`
  });
  BLOG_LOCALES.forEach(l => {
    categories?.forEach(({ name }) => paths.push(`/blog/${l}/${name}`))
    authors?.forEach(({ name }) => paths.push(`/blog/${l}/author/${name}`))
    tags?.forEach(({ name }) => paths.push(`/blog/${l}/tag/${name}`))
  });
  // console.log('main paths', paths);
  return {
    paths: paths,
    fallback: true,
  }
}
