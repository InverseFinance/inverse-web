import 'source-map-support'
import { getAllPostsForHome } from 'blog/lib/api'

export default async function handler(req, res) {
    const {
        search,
        byAuthor,
        category,
    } = req.query;

    try {
        const posts = await getAllPostsForHome(false, 'en-US', category, byAuthor, search);
        console.log(search)

        res.status(200).send(posts);
    } catch (err) {
        console.error(err);
        res.status(200).send([]);
    }
}