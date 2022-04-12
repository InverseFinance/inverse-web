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
                    {post.title} | Inverse Finance Blog
                  </title>
                  <meta property="og:image" content={post.coverImage.url} />
                </Head>
                <PostHeader
                  title={post.title}
                  coverImage={post.coverImage}
                  date={post.date}
                  author={post.author}
                />
                <PostBody content={post.content} />
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
