import { getAllPostsForHome, getAuthors, getCategories, getPostAndMorePosts, getTag } from './api';
import { BLOG_PAGINATION_SIZE } from './constants';

export const getBlogContext = (context) => {
    const { slug } = context.params || { slug: ['en-US'] };
    const { previewKey } = context.query || {};

    return {
        locale: (slug[0] || 'en-US').replace('undefined', 'en-US'),
        category: slug[1] && !['posts', 'author', 'tag'].includes(slug[1]) ? slug[1] : 'home',
        byAuthor: slug[1] === 'author' ? slug[2] : '',
        byTag: slug[1] === 'tag' ? slug[2] : '',
        isPreviewUrl: previewKey === process.env.CONTENTFUL_PREVIEW_SECRET,
    }
}

export const getBlogHomeProps = async ({ preview = false, ...context }) => {
    const { locale, category, byAuthor, byTag, isPreviewUrl } = getBlogContext(context);
    const isPreview = preview || isPreviewUrl;
    const homePosts = await getAllPostsForHome({ isPreview, locale, category, byAuthor, byTag, limit: BLOG_PAGINATION_SIZE }) ?? []
    const totalPostsToCount = (await getAllPostsForHome({ isPreview, locale, category, byAuthor, byTag, limit: 999, fieldsGraph: 'slug' }) ?? [])
    const categories = await getCategories(isPreview, locale) ?? []
    const tag = byTag ? await getTag(isPreview, locale, byTag) || null : null;
    const nbTotalPosts = totalPostsToCount.length;

    return {
        props: { preview: isPreview, homePosts, categories, locale, category, byAuthor, tag, nbTotalPosts },
    }
}

export const getBlogPostProps = async (context) => {
    const { params, preview = false } = context;
    const { locale, isPreviewUrl } = getBlogContext(context);
    const isPreview = preview || isPreviewUrl;
    const data = await getPostAndMorePosts(params.slug, isPreview, locale)

    return {
        props: {
            preview: isPreview,
            post: data?.post ?? null,
            morePosts: data?.morePosts ?? null,
            locale,
        },
    }
}

export const getBlogAuthorsProps = async (context) => {
    const { preview = false } = context;
    const { locale, isPreviewUrl } = getBlogContext(context);
    const isPreview = preview || isPreviewUrl;
    const authors = await getAuthors(preview, locale)
    const categories = await getCategories(preview, locale) ?? []

    return {
        props: {
            preview: isPreview,
            authors: authors ?? [],
            categories,
            locale,
        },
    }
}
