export const getBlogContext = (context) => {
    const { slug } = context.params;
    return { locale: slug[0], category: slug[1] && slug[1] !== 'posts' ? slug[1] : 'home' }
}