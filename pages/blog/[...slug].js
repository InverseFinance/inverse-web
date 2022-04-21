import Container from '../../blog/components/container'
import MoreStories from '../../blog/components/more-stories'
import HeroPost from '../../blog/components/hero-post'
import Intro from '../../blog/components/intro'
import Layout from '../../blog/components/layout'
import { getAllPostsForHome, getCategories, getTag } from '../../blog/lib/api'
import Head from 'next/head'
import Categories from '../../blog/components/categories'
import { getBlogContext } from '../../blog/lib/utils'
import React from 'react'
import BlogText from '../../blog/components/common/text'
import { BLOG_LOCALES } from '../../blog/lib/constants'

export const BlogContext = React.createContext({ locale: 'en-US', category: 'home' });

export default function Index({ preview, allPosts, categories, locale, category, byAuthor, tag }) {
  const posts = allPosts.filter(p => Date.parse(p.date) <= Date.now());
  const heroPost = posts[0];
  const morePosts = posts.slice(1);
  const categoryObject = categories.find(c => c.name === category) || {};

  return (
    <BlogContext.Provider value={{ locale, category }}>
      <Layout preview={preview}>
        <Head>
          <title>Inverse Finance Blog</title>
          <meta name="description" content={`Inverse Finance Blog | ${categoryObject?.label}`}></meta>
          <meta name="keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto, ${categoryObject?.label}`}></meta>
          {
            !!heroPost?.coverImage?.url && <meta name="og:image" content={`${heroPost?.coverImage?.url}`} />
          }
          <meta name="og:title" content={`Inverse Finance Blog`}></meta>
          <meta name="og:description" content={`Latest news from Inverse Finance`}></meta>
          <meta name="og:keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto, ${categoryObject?.label}`}></meta>
        </Head>
        <Container>
          <Intro />
          <Categories categories={categories} isNotOnCategoryPage={!!byAuthor || !!tag}  />
          {
            (!!byAuthor || !!tag) && <BlogText as="h2" fontSize="5xl" fontWeight="extrabold" mb="5">
              { byAuthor ? `Stories by ${byAuthor}` : `${tag.label} Stories` }
            </BlogText>
          }
          {
            (!!byAuthor || !!tag) && posts.length === 0 && <BlogText>
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

// revalidation via webhook
export async function getStaticProps({ preview = false, ...context }) {
  const { locale, category, byAuthor, byTag, isPreviewUrl } = getBlogContext(context);
  const isPreview = preview||isPreviewUrl;
  const allPosts = await getAllPostsForHome(isPreview, locale, category, byAuthor) ?? []
  const categories = await getCategories(isPreview, locale) ?? []
  const tag = byTag ? await getTag(isPreview, locale, byTag) : null;
  return {
    props: { preview: isPreview, allPosts, categories, locale, category, byAuthor, tag },
  }
}

export async function getStaticPaths() {
  return {
    paths: BLOG_LOCALES.map(l => `/blog/${l}`),
    fallback: false,
  }
}
