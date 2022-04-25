import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../../blog/components/container'
import Layout from '../../../blog/components/layout'
import { getAuthors, getCategories } from '../../../blog/lib/api'
import { getBlogContext } from '../../../blog/lib/utils'
import { BlogContext } from '../../../pages/_app';
import Avatar from '../../../blog/components/avatar'
import { SimpleGrid } from '@chakra-ui/react'
import Intro from '../../../blog/components/intro'
import Categories from '../../../blog/components/categories'
import Head from 'next/head'
import { BLOG_LOCALES } from '../../../blog/lib/constants'

export default function Authors({ authors, preview, locale, categories }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Loading...</div>
  } else if (!router.isFallback && !authors) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <BlogContext.Provider value={{ locale }}>
      <Layout preview={preview}>
        <Head>
          <title>Inverse Finance Blog</title>
          <meta name="description" content={`Inverse Finance Blog, get the latest news about Inverse Finance`}></meta>
          <meta name="keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto`}></meta>
          <meta name="og:description" content={`Inverse Finance Blog - Authors`}></meta>
          <meta name="og:keywords" content={`Inverse Finance, blog, authors`}></meta>
        </Head>
        <Container>
          <Intro />
          <Categories categories={categories} customPage={'authors'} />
          <SimpleGrid columns={{ base: '1', md: '2', lg: '3' }} autoColumns gap="8" mt="5">
            {authors?.sort((a, b) => a.name < b.name ? -1 : 1).map(author => {
              return <Avatar key={author.name} size={'100px'} {...author} />
            })}
          </SimpleGrid>
        </Container>
      </Layout>
    </BlogContext.Provider>
  )
}

// revalidation vya webhook
export async function getStaticProps(context) {
  const { preview = false } = context;
  const { locale, isPreviewUrl } = getBlogContext(context);
  const isPreview = preview || isPreviewUrl;
  const authors = await getAuthors(preview, locale)
  const categories = await getCategories(preview, locale) ?? []

  return {
    props: {
      preview: isPreview,
      authors: authors ?? [],
      categories,
      locale,
    },
  }
}

export async function getStaticPaths() {
  return {
    paths: BLOG_LOCALES.map(l => `/blog/authors/${l}`),
    fallback: true,
  }
}

