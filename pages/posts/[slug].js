import { useRouter } from 'next/router'
import Head from 'next/head'
import ErrorPage from 'next/error'
import Container from '../../blog/components/container'
import PostBody from '../../blog/components/post-body'
import MoreStories from '../../blog/components/more-stories'
import Header from '../../blog/components/header'
import PostHeader from '../../blog/components/post-header'
import SectionSeparator from '../../blog/components/section-separator'
import Layout from '../../blog/components/layout'
import { getAllPostsWithSlug, getPostAndMorePosts } from '../../blog/lib/api'
import PostTitle from '../../blog/components/post-title'
import { CMS_NAME } from '../../blog/lib/constants'

export default function Post({ post, morePosts, preview }) {
  const router = useRouter()

  if (!router.isFallback && !post) {
    return <ErrorPage statusCode={404} />
  }

  return (
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
                  {post.title} | Next.js Blog Example with {CMS_NAME}
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
  )
}

export async function getStaticProps({ params, preview = false }) {
  const data = await getPostAndMorePosts(params.slug, preview)

  return {
    props: {
      preview,
      post: data?.post ?? null,
      morePosts: data?.morePosts ?? null,
    },
  }
}

export async function getStaticPaths() {
  const allPosts = await getAllPostsWithSlug()
  return {
    paths: allPosts?.map(({ slug }) => `/posts/${slug}`) ?? [],
    fallback: true,
  }
}
