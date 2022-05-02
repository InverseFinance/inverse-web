import 'source-map-support'
import { getAllPostsForHome } from 'blog/lib/api'

export default async function handler(req, res) {
    const {
        byAuthor,
        category,
        tag,
        locale,
        skip,
        limit,
    } = req.query;

    try {
        const posts = await getAllPostsForHome({
            preview: false,
            locale,
            category,
            byAuthor,
            limit,
            skip,
        });

        res.status(200).send(posts);
    } catch (err) {
        console.error(err);
        res.status(200).send([]);
    }
}