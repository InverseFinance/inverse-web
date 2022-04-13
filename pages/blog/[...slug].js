import Container from '../../blog/components/container'
import MoreStories from '../../blog/components/more-stories'
import HeroPost from '../../blog/components/hero-post'
import Intro from '../../blog/components/intro'
import Layout from '../../blog/components/layout'
import { getAllPostsForHome, getCategories } from '../../blog/lib/api'
import Head from 'next/head'
import Categories from '../../blog/components/categories'
import { getBlogContext } from '../../blog/lib/utils'
import React from 'react'

export const BlogContext = React.createContext({ locale: 'en-US', category: 'home' });

export default function Index({ preview, allPosts, categories, locale, category }) {
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);
  const categoryObject = categories.find(c => c.name === category) || {};

  return (
    <BlogContext.Provider value={{ locale, category }}>
      <Layout preview={preview}>
        <Head>
          <title>Inverse Finance Blog</title>
          <meta name="description" content={`Inverse Finance Blog | ${categoryObject?.label}`}></meta>
          <meta name="keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto, ${categoryObject?.label}`}></meta>

          <meta name="og:description" content={`Inverse Finance Blog | ${categoryObject?.label}`}></meta>
          <meta name="og:keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto, ${categoryObject?.label}`}></meta>

          <meta name="twitter:title" content="Inverse Finance Blog" />
        </Head>
        <Container>
          <Intro />
          <Categories categories={categories} active={category} />
          {heroPost && (
            <HeroPost
              {...heroPost}
            />
          )}
          {morePosts.length > 0 && <MoreStories posts={morePosts} mt="8" />}
        </Container>
      </Layout>
    </BlogContext.Provider>
  )
}

export async function getServerSideProps({ preview = false, ...context }) {
  const { locale, category } = getBlogContext(context);
  const allPosts = await getAllPostsForHome(preview, locale, category) ?? []
  const categories = await getCategories(preview, locale) ?? []
  return {
    props: { preview, allPosts, categories, locale, category },
  }
}
