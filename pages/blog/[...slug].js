import Container from '../../blog/components/container'
import MoreStories from '../../blog/components/more-stories'
import HeroPost from '../../blog/components/hero-post'
import Intro from '../../blog/components/intro'
import Layout from '../../blog/components/layout'
import { getAllPostsForHome, getAuthors, getCategories, getTag, getTags } from '../../blog/lib/api'
import Head from 'next/head'
import Categories from '../../blog/components/categories'
import { getBlogContext } from '../../blog/lib/utils'
import React from 'react'
import { BlogContext } from '../../pages/_app';
import { BLOG_LOCALES } from '../../blog/lib/constants'
import BlogText from '../../blog/components/common/text'
import { useRouter } from 'next/router'

export default function Index({ preview, allPosts, categories, locale, category, byAuthor, tag }) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  const posts = allPosts?.filter(p => Date.parse(p.date) <= Date.now()) || [];
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
          <Categories categories={categories} isNotOnCategoryPage={!!byAuthor || !!tag} />
          {
            (!!byAuthor || !!tag) && <BlogText as="h2" fontSize="5xl" fontWeight="extrabold" mb="5">
              {byAuthor ? `Stories by ${byAuthor}` : `${tag.label} Stories`}
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
  const isPreview = preview || isPreviewUrl;
  const allPosts = await getAllPostsForHome({ isPreview, locale, category, byAuthor, byTag }) ?? []
  const categories = await getCategories(isPreview, locale) ?? []
  const tag = byTag ? await getTag(isPreview, locale, byTag) : null;
  return {
    props: { preview: isPreview, allPosts, categories, locale, category, byAuthor, tag },
  }
}

export async function getStaticPaths() {
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
