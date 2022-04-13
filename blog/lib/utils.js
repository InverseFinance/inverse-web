export const getBlogContext = (context) => {
    const { slug } = context.params;
    const { byAuthor } = context.query;
    return {
        locale: slug[0],
        category: slug[1] && slug[1] !== 'posts' ? slug[1] : 'home',
        byAuthor: decodeURIComponent(byAuthor||''),
    }
}