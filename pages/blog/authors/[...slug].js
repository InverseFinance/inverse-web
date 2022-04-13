import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../../blog/components/container'
import Layout from '../../../blog/components/layout'
import { getAuthors, getCategories } from '../../../blog/lib/api'
import { getBlogContext } from '../../../blog/lib/utils'
import { BlogContext } from '../[...slug]'
import Avatar from '../../../blog/components/avatar'
import { SimpleGrid } from '@chakra-ui/react'
import Intro from '../../../blog/components/intro'
import Categories from '../../../blog/components/categories'

export default function Post({ authors, preview, locale, categories }) {
  const router = useRouter()

  if (!router.isFallback && !authors) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <BlogContext.Provider value={{ locale }}>
      <Layout preview={preview}>
        <Container>
          <Intro />
          <Categories categories={categories} isAuthorsPage={true} customPage={'authors'} />
          <SimpleGrid columns={{ base: '1', md: '2', lg: '3' }} autoColumns gap="8" mt="5">
            {authors.sort((a, b) => a.name < b.name ? -1 : 1).map(author => {
              return <Avatar size={'100px'} {...author} />
            })}
          </SimpleGrid>
        </Container>
      </Layout>
    </BlogContext.Provider>
  )
}

export async function getServerSideProps(context) {
  const { preview = false } = context;
  const { locale } = getBlogContext(context);
  const authors = await getAuthors(preview, locale)
  const categories = await getCategories(preview, locale) ?? []

  return {
    props: {
      preview,
      authors: authors ?? null,
      categories,
      locale,
    },
  }
}
