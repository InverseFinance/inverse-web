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
import BlogText from '../../blog/components/common/text'

export const BlogContext = React.createContext({ locale: 'en-US', category: 'home' });

export default function Index({ preview, allPosts, categories, locale, category, byAuthor }) {
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
          <Categories categories={categories} isByAuthor={!!byAuthor}  />
          {
            !!byAuthor && <BlogText as="h2" fontSize="5xl" fontWeight="extrabold" mb="5">
              Stories by {byAuthor}
            </BlogText>
          }
          {
            !!byAuthor && allPosts.length === 0 && <BlogText>
              No Stories published yet
            </BlogText>
          }
          {heroPost && (
            <HeroPost
              {...heroPost}
            />
          )}
          {morePosts.length > 0 && <MoreStories byAuthor={byAuthor} posts={morePosts} mt="8" />}
        </Container>
      </Layout>
    </BlogContext.Provider>
  )
}

export async function getServerSideProps({ preview = false, ...context }) {
  const { locale, category, byAuthor } = getBlogContext(context);
  const allPosts = await getAllPostsForHome(preview, locale, category, byAuthor) ?? []
  const categories = await getCategories(preview, locale) ?? []
  return {
    props: { preview, allPosts, categories, locale, category, byAuthor },
  }
}
