export const getBlogContext = (context) => {
    const { slug } = context.params || { slug: ['en-US'] };
    const { byAuthor, byTag, previewKey } = context.query || {};

    return {
        locale: (slug[0] || 'en-US').replace('undefined', 'en-US'),
        category: slug[1] && !['posts', 'author', 'tag'].includes(slug[1]) ? slug[1] : 'home',
        byAuthor: slug[1] === 'author' ? slug[2] : '',
        byTag: slug[1] === 'tag' ? slug[2] : '',
        isPreviewUrl: previewKey === process.env.CONTENTFUL_PREVIEW_SECRET,
    }
}