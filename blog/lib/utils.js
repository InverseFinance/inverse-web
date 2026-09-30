import { getPinnedPost, getAllPostsForHome, getAuthors, getCategories, getPostAndMorePosts, getTag, getLandingPosts } from './api';
import { BLOG_PAGINATION_SIZE } from './constants';
import { isInvalidGenericParam } from '@app/util/redis';
import { getSsrDbr, getSsrDolaStaking, getSsrFirmMarkets, getSsrFirmTvl } from '@app/util/ssr';

export const getBlogContext = (context) => {
    const { slug } = context.params || { slug: ['en-US'] };
    const { previewKey } = context.query || {};

    if (slug.some(p => isInvalidGenericParam(p))) {
        return {
            locale: 'en-US',
            category: 'home',
            byAuthor: '',
            byTag: '',
            isPreviewUrl: false,
        }
    }

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
    const pinnedPost = await getPinnedPost({ isPreview });
    const homePosts = await getAllPostsForHome({ isPreview, locale, category, byAuthor, byTag, limit: BLOG_PAGINATION_SIZE }) ?? []
    const totalPostsToCount = (await getAllPostsForHome({ isPreview, locale, category, byAuthor, byTag, limit: 100, isCount: true }) ?? [])
    const categories = await getCategories(isPreview, locale) ?? []
    const tag = byTag ? await getTag(isPreview, locale, byTag) || null : null;
    const nbTotalPosts = totalPostsToCount.length;

    return {
        props: { preview: isPreview, pinnedPost, homePosts, categories, locale, category, byAuthor, tag, nbTotalPosts },
    }
}

export const getLandingProps = async ({ preview = false, ...context }) => {
    const { isPreviewUrl } = getBlogContext(context);
    const isPreview = preview || isPreviewUrl;
    const posts = []//await getLandingPosts({ isPreview }) ?? [];
    // an api failure falls back to cached data (flagged by isFallback) instead of failing the page
    const results = await Promise.all([
        getSsrDbr(),
        getSsrFirmTvl(),
        getSsrFirmMarkets(),
        getSsrDolaStaking(),
    ]);
    const [
        dbrData,
        firmTvlData,
        marketsData,
        dolaStakingData,
    ] = results.map(r => r.data);
    const markets = marketsData?.markets;
    return {
        props: {
            preview: isPreview, posts,
            totalDebt: markets ? markets.reduce((prev, curr) => prev + (curr.totalDebt || 0), 0) : null,
            invPrice: markets?.find(m => m.isInv)?.price || 0,
            firmTotalTvl: firmTvlData?.firmTotalTvl ?? null,
            sDolaTvl: dolaStakingData?.tvlUsd ?? null,
            apy: dolaStakingData?.apy ?? null,
            projectedApy: dolaStakingData?.projectedApy ?? null,
            dolaPrice: dolaStakingData?.dolaPriceUsd ?? null,
            dbrPriceUsd: dbrData?.priceUsd ?? null,
            hasOutdatedData: results.some(r => r.isFallback),
        },
    }
}

export const getBlogPostProps = async (context) => {
    const { params, preview = false } = context;
    const { locale, isPreviewUrl } = getBlogContext(context);
    const isPreview = preview || isPreviewUrl;
    const data = await getPostAndMorePosts(params.slug, isPreview, locale);

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

export const getDefaultProps = async (context) => {
    const { preview = false } = context;
    const { locale, isPreviewUrl } = getBlogContext(context);
    const isPreview = preview || isPreviewUrl;
    const categories = await getCategories(preview, locale) ?? []

    return {
        props: {
            preview: isPreview,
            categories,
            locale,
        },
    }
}
