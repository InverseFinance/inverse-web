import { getPinnedPost, getAllPostsForHome, getAuthors, getCategories, getPostAndMorePosts, getTag, getLandingPosts } from './api';
import { BLOG_PAGINATION_SIZE } from './constants';
import { isInvalidGenericParam } from '@app/util/redis';
import { SERVER_BASE_URL } from '@app/config/constants';

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
    const posts = await getLandingPosts({ isPreview }) ?? [];
    const [
        currentCirculatingSupply,
        dbrData,
        dolaPriceData,
        firmTvlData,
        dolaMarketData,
        marketsData,
        dolaStakingData,
    ] = await Promise.all([
        fetch(`${SERVER_BASE_URL}/api/dola/circulating-supply?cacheFirst=true`).then(res => res.text()),
        fetch(`${SERVER_BASE_URL}/api/dbr?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola-price?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/f2/tvl?cacheFirst=true`).then(res => res.json()),
        fetch(`https://pro-api.coingecko.com/api/v3/coins/dola-usd?x_cg_pro_api_key=${process.env.CG_PRO}&localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/f2/fixed-markets?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola-staking?cacheFirst=true`).then(res => res.json()),
    ]);
    const dolaVolume = dolaMarketData.market_data.total_volume.usd;
    const invFirmPrice = marketsData.markets.find(m => m.isInv)?.price || 0;
    const { apy, projectedApy } = dolaStakingData;
    const dbrPriceUsd = dbrData.priceUsd;
    const dolaPrice = dolaPriceData['dola-usd'] || 1;
    const firmTotalTvl = firmTvlData.firmTotalTvl;
    return {
        props: { preview: isPreview, posts, currentCirculatingSupply: parseFloat(currentCirculatingSupply), apy, projectedApy, dolaPrice, dbrPriceUsd, firmTotalTvl, invPrice: invFirmPrice, dolaVolume },
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
