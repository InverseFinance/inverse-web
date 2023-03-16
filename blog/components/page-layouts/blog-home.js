import Head from 'next/head';
import { useRouter } from 'next/router';
import { BlogContext } from '../../../pages/_app';
import Categories from '../categories';
import BlogText from '../common/text';
import Container from '../container';
import HeroPost from '../hero-post';
import Intro from '../intro';
import Layout from '../layout';
import MoreStories from '../more-stories';

export default function BlogHome({ preview, pinnedPost, homePosts, categories, locale, category, byAuthor, tag, nbTotalPosts }) {
    const router = useRouter();
  
    if (router.isFallback) {
      return <div>Loading...</div>
    }
  
    const posts = homePosts?.filter(p => Date.parse(p.date) <= Date.now()) || [];
    const pinnedPostIndex = !!pinnedPost?.post?.slug ? posts.findIndex(p => p.slug === pinnedPost?.post?.slug) : 0;
    const heroPost = { ...posts[pinnedPostIndex] };
    posts.splice(pinnedPostIndex, 1);
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
            {posts.length > 0 && <MoreStories byAuthor={byAuthor} posts={posts} nbTotalPosts={nbTotalPosts} mt="8" />}
          </Container>
        </Layout>
      </BlogContext.Provider>
    )
  }
  