import Head from 'next/head';
import { useRouter } from 'next/router';
import { BlogContext } from '../../../pages/_app';
import Categories from '../categories';
import BlogText from '../common/text';
import Container from '../container';
import Intro from '../intro';
import Layout from '../layout';

export default function Blog404({ preview, locale, categories }) {
    const router = useRouter()
  
    if (router.isFallback) {
      return <div>Loading...</div>
    }
  
    return (
      <BlogContext.Provider value={{ locale }}>
        <Layout preview={preview}>
          <Head>
            <title>Inverse Finance Blog</title>
            <meta name="description" content={`Inverse Finance Blog, get the latest news about Inverse Finance`}></meta>
            <meta name="keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto`}></meta>
            <meta name="og:description" content={`Inverse Finance Blog`}></meta>
            <meta name="og:keywords" content={`Inverse Finance, blog`}></meta>
          </Head>
          <Container>
            <Intro />
            {
              !!categories && <Categories categories={categories} customPage={'authors'} />
            }
            <BlogText>Page Not Found</BlogText>
          </Container>
        </Layout>
      </BlogContext.Provider>
    )
  }