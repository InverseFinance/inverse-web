import { VStack } from '@chakra-ui/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BlogContext } from '../../../pages/_app';
import { BLOG_THEME } from '../../lib/constants';
import Categories from '../categories';
import BlogText from '../common/text';
import Container from '../container';
import Intro from '../intro';
import Layout from '../layout';

export default function BlogMerch({ preview, locale, categories }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <BlogContext.Provider value={{ locale }}>
      <Layout preview={preview}>
        <Head>
          <title>Inverse Finance Merch</title>
          <meta name="description" content={`Inverse Finance merchandise`}></meta>
          <meta name="keywords" content={`Inverse Finance, blog, merchandise, inv, dola, web3, lending, crypto`}></meta>
          <meta name="og:description" content={`Inverse Finance Blog - Merch`}></meta>
          <meta name="og:keywords" content={`Inverse Finance, blog, Merch`}></meta>
        </Head>
        <Container>
          <Intro />
          <Categories categories={categories} customPage={'merch'} />
          <VStack spacing="4" pt="4" as="a" href="https://degen.supply/pages/inversefinance" target="_blank" cursor="pointer">
            <BlogText as="h2" fontSize="24px" fontWeight="extrabold">
              Check out the swag!! Get your Inverse Finance merch right now!
            </BlogText>

            <BlogText color={BLOG_THEME.colors.secondaryTextColor} fontSize="18px">
              The shop over at
              degensupply
              is open for business and prices are great. Limited initial run of 50 pieces so grab yours today!
            </BlogText>
          </VStack>

          <VStack pt="8" w='full' alignItems="center">
            <video width="500px" autoPlay controls muted loop>
              <source src="/assets/inv-merch.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </VStack>

        </Container>
      </Layout>
    </BlogContext.Provider>
  )
}