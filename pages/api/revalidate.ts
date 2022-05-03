import { getAllPostsForHome, getAllPostsWithSlug, getAuthorById, getAuthors, getCategories, getCategoryById, getTags } from '@app/blog/lib/api';
import { throttledPromises } from '@app/util/misc';
import { BLOG_LOCALES } from 'blog/lib/constants'

export default async function handler(req, res) {
    // Check for secret to confirm this is a valid request

    if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

    const { type } = req.query;
    const { body } = req;
    let results = [];
    let paths: string[];

    try {

        if (type === 'blog') {
            // post creation/update/delete
            if (body?.sys?.contentType?.sys?.id === 'post') {
                const authorId = body?.fields?.author['en-US']?.sys?.id;
                const categoryId = body?.fields?.category['en-US']?.sys?.id;
                const tagIds = body?.fields?.tags['en-US']?.map(t => t?.sys?.id);

                const [author, tags, category] = await Promise.all([
                    getAuthorById(true, 'en-US', authorId),
                    getTags(true, 'en-US', tagIds),
                    getCategoryById(categoryId, 'en-US'),
                ])

                paths = ['/blog'];

                BLOG_LOCALES
                    .forEach(l => tags.forEach(t => paths.push(`/blog/${l}/tag/${t.name}`)))

                if (categoryId && !category?.isCustomPage) {
                    BLOG_LOCALES.forEach(l => paths.push(`/blog/${l}/${category.name}`))
                }

                BLOG_LOCALES.forEach(l => paths.push(`/blog/${l}`))
                BLOG_LOCALES.forEach(l => paths.push(`/blog/${l}/author/${author.name}`))
                BLOG_LOCALES.forEach(l => paths.push(`/blog/posts/${l}/${body?.fields?.slug['en-US']}`))
            } else if (body?.sys?.contentType?.sys?.id === 'author') {
                paths = BLOG_LOCALES.map(l => {
                    return `/blog/${l}`
                }).concat(['/blog']);

                BLOG_LOCALES.forEach(l => {
                    paths.push(`/blog/authors/${l}`)
                });

                const authorId = body?.sys?.id;
                const posts = await getAllPostsForHome({
                    preview: true,
                    customWhere: `{ author: { sys: { id: "${authorId}" } } }`,
                    fieldsGraph: "slug"
                })

                posts.forEach(p => {
                    BLOG_LOCALES.forEach(l => paths.push(`/blog/posts/${l}/${p.slug}`))
                })
            } else {
                const [categories, authors, tags, posts] = await Promise.all([
                    getCategories(true, 'en-US'),
                    getAuthors(true, 'en-US'),
                    getTags(true, 'en-US'),
                    getAllPostsWithSlug(),
                ])

                paths = BLOG_LOCALES.map(l => {
                    return `/blog/${l}`
                });

                BLOG_LOCALES.forEach(l => {
                    paths.push(`/blog/authors/${l}`)
                    categories?.filter(c => !c.isCustomPage).forEach(({ name }) => paths.push(`/blog/${l}/${name}`))
                    authors?.forEach(({ name }) => paths.push(`/blog/${l}/author/${name}`))
                    tags?.forEach(({ name }) => paths.push(`/blog/${l}/tag/${name}`))
                    posts?.forEach(({ slug }) => paths.push(`/blog/posts/${l}/${slug}`))
                });
            }
        }

        results = await throttledPromises(
            (p) => res.unstable_revalidate(p),
            paths,
            10,
            100,
            'allSettled',
        );

        return res.json({
            revalidated: true,
            failed: results?.map((r, i) => ({ result: r, path: paths[i] })).filter((r, i) => r.result.status === 'rejected'),
            paths,
        })
    } catch (err) {
        console.log(err)
        // If there was an error, Next.js will continue
        // to show the last successfully generated page
        return res.status(500).send('Error revalidating')
    }
}