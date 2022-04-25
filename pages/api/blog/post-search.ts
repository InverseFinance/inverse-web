import 'source-map-support'
import { getAllPostsForHome } from 'blog/lib/api'

export default async function handler(req, res) {
    const {
        search,
        byAuthor,
        category,
        locale,
    } = req.query;

    try {
        const posts = await getAllPostsForHome({ preview: false, locale, category, byAuthor, fulltext: search, limit: 20 });

        res.status(200).send(posts);
    } catch (err) {
        console.error(err);
        res.status(200).send([]);
    }
}