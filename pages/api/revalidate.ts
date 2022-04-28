import { getAuthorById, getAuthors, getCategories, getTags } from '@app/blog/lib/api';
import { BLOG_LOCALES } from 'blog/lib/constants'

export default async function handler(req, res) {
    // Check for secret to confirm this is a valid request
    if (req.query.secret !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ message: 'Invalid token' })
    }

    const { type } = req.query;
    const { body } = req;
    let results;

    try {

        if (type === 'blog') {
            if (body?.sys?.contentType?.sys?.id === 'post') {
                const authorId = body?.fields?.author['en-US']?.sys?.id;
                const tagIds = body?.fields?.tags['en-US']?.map(t => t?.sys?.id);

                const [author, tags] = await Promise.all([
                    getAuthorById(true, 'en-US', authorId),
                    getTags(true, 'en-US', tagIds)
                ])

                const tagsRevalidations = BLOG_LOCALES
                    .map(l => tags.map(t => res.unstable_revalidate(`/blog/${l}/tag/${t.name}`)))
                    .reduce((prev, curr) => [...prev, ...curr], []);

                results = await Promise.allSettled([
                    res.unstable_revalidate(`/blog`),
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/${l}`)),
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/${l}/author/${author.name}`)),
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/posts/${l}/${body?.fields?.slug['en-US']}`)),
                    ...tagsRevalidations
                ]);
            } else {
                const [categories, authors, tags] = await Promise.all([
                    getCategories(true, 'en-US'),
                    getAuthors(true, 'en-US'),
                    getTags(true, 'en-US'),
                ])

                const paths = BLOG_LOCALES.map(l => {
                    return `/blog/${l}`
                }).concat(['/blog']);

                BLOG_LOCALES.forEach(l => {
                    paths.push(`/blog/authors/${l}`)
                    categories?.filter(c => !c.isCustomPage).forEach(({ name }) => paths.push(`/blog/${l}/${name}`))
                    authors?.forEach(({ name }) => paths.push(`/blog/${l}/author/${name}`))
                    tags?.forEach(({ name }) => paths.push(`/blog/${l}/tag/${name}`))
                });

                console.log(paths)

                results = await Promise.allSettled([
                    ...paths.map(p => res.unstable_revalidate(p)),
                ]);
            }
        }
        return res.json({ revalidated: true, failed: results?.filter(r => r.status === 'rejected') })
    } catch (err) {
        console.log(err)
        // If there was an error, Next.js will continue
        // to show the last successfully generated page
        return res.status(500).send('Error revalidating')
    }
}