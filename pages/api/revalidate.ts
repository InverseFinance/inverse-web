import { BLOG_LOCALES } from 'blog/lib/constants'

export default async function handler(req, res) {
    // Check for secret to confirm this is a valid request
    if (req.query.secret !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ message: 'Invalid token' })
    }

    const { type } = req.query;
    const { body } = req;

    try {
        if (type === 'blog') {
            if(body?.fields?.slug) {
                // with post
                await Promise.all([
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/${l}`)),
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/authors/${l}`)),
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/posts/${l}/${body?.fields?.slug['en-US']}`)),
                ]);
            } else {
                await Promise.all([
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/${l}`)),
                    ...BLOG_LOCALES.map(l => res.unstable_revalidate(`/blog/authors/${l}`)),
                ]);
            }
        }
        return res.json({ revalidated: true })
    } catch (err) {
        console.log(err)
        // If there was an error, Next.js will continue
        // to show the last successfully generated page
        return res.status(500).send('Error revalidating')
    }
}