import { useRouter } from 'next/router'
import Head from 'next/head'
import ErrorPage from 'next/error'
import Container from '../../../blog/components/container'
import PostBody from '../../../blog/components/post-body'
import MoreStories from '../../../blog/components/more-stories'
import Header from '../../../blog/components/header'
import PostHeader from '../../../blog/components/post-header'
import SectionSeparator from '../../../blog/components/section-separator'
import Layout from '../../../blog/components/layout'
import { getAllPostsWithSlug, getPostAndMorePosts } from '../../../blog/lib/api'
import PostTitle from '../../../blog/components/post-title'
import { getBlogContext } from '../../../blog/lib/utils'
import { BlogContext } from '../[...slug]'
import PostFooter from '../../../blog/components/post-footer'

export default function Post({ post, morePosts, preview, locale }) {
  const router = useRouter()

  if (!router.isFallback && !post) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <BlogContext.Provider value={{ locale }}>
      <Layout preview={preview}>
        <Container>
          <Header />
          {router.isFallback ? (
            <PostTitle>Loading…</PostTitle>
          ) : (
            <>
              <article>
                <Head>
                  <title>
                    {post.pageTitle || post.title}
                  </title>
                  {
                    !!post.coverImage?.url && <meta property="og:image" content={post.coverImage?.url} />
                  }
                  <meta name="description" content={`${post.metaDescription || post.excerpt}`}></meta>
                  <meta name="keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto`}></meta>

                  <meta name="og:description" content={`${post.opengraphDescription || post.metaDescription || post.excerpt}`}></meta>
                  <meta name="og:keywords" content={`Inverse Finance, blog, DeFi, inv, dola, web3, lending, crypto`}></meta>

                  <meta name="twitter:title" content={`${post.title}`} />
                  <meta name="twitter:description" content={`${post.excerpt}`} />
                </Head>
                <PostHeader
                  {...post}
                />
                <PostBody title={post.title} coverImage={post.coverImage} content={post.content} />
                <PostFooter
                  {...post}
                />
              </article>
              <SectionSeparator />
              {morePosts && morePosts.length > 0 && (
                <MoreStories posts={morePosts} />
              )}
            </>
          )}
        </Container>
      </Layout>
    </BlogContext.Provider>
  )
}

export async function getServerSideProps(context) {
  const { params, preview = false } = context;
  const { locale } = getBlogContext(context);
  const data = await getPostAndMorePosts(params.slug, preview, locale)

  return {
    props: {
      preview,
      post: data?.post ?? null,
      morePosts: data?.morePosts ?? null,
      locale,
    },
  }
}

// export async function getStaticPaths() {
//   const allPosts = await getAllPostsWithSlug()
//   return {
//     paths: allPosts?.map(({ slug }) => `/blog/posts/${slug}`) ?? [],
//     fallback: true,
//   }
// }
