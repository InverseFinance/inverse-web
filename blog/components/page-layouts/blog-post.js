import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BlogContext } from '../../../pages/_app';
import Container from '../container';
import Layout from '../layout';
import MoreStories from '../more-stories';
import PostBody from '../post-body';
import PostFooter from '../post-footer';
import PostHeader from '../post-header';
import PostTitle from '../post-title';
import SectionSeparator from '../section-separator';
import Blog404 from './blog-404';

export default function BlogPost({ post, morePosts, preview, locale }) {
    const router = useRouter()
  
    if (router.isFallback) {
      return <div>Loading...</div>
    } else if (!router.isFallback && !post) {
      return <Blog404 locale={locale} />
    }
  
    return (
      <BlogContext.Provider value={{ locale }}>
        <Layout preview={preview}>
          <Container>
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
                      !!post.coverImage?.url && <meta name="og:image" content={post.coverImage?.url} />
                    }
                    <meta name="description" content={`${post.metaDescription || post.excerpt || (documentToPlainTextString(post.content).substring(0, 100) + '...')}`}></meta>
                    <meta name="keywords" content={`Inverse Finance, blog, ${post.tagsCollection?.items.map(item => item.label)}`}></meta>
                    <meta name="og:title" content={`${post.pageTitle || post.title}`} />
                    <meta name="og:type" content="article" />
                    <meta name="og:description" content={`${post.opengraphDescription || post.metaDescription || post.excerpt || (documentToPlainTextString(post.content).substring(0, 100) + '...')}`}></meta>
                  </Head>
                  <PostHeader
                    {...post}
                  />
                  <PostBody title={post.title} content={post.content} />
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