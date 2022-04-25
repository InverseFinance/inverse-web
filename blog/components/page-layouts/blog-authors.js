import Head from 'next/head';
import { useRouter } from 'next/router';
import { BlogContext } from '../../../pages/_app';
import Categories from '../categories';
import Container from '../container';
import Intro from '../intro';
import Layout from '../layout';
import { SimpleGrid } from '@chakra-ui/react';
import Avatar from '../avatar';

export default function BlogAuthors({ authors, preview, locale, categories }) {
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