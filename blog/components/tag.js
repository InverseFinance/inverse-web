import { useContext } from 'react';
import { BlogContext } from '../../pages/_app';
import { BLOG_THEME } from '../lib/constants';
import BlogText from './common/text';

export default function Tag({ label, name }) {
    const { locale } = useContext(BlogContext);
    return <BlogText
        as="a"
        py="1"
        px="3"
        borderRadius="10"
        bgColor={BLOG_THEME.colors.badgeBgColor}
        fontSize="12px"
        href={`/blog/${locale}/tag/${name}`}
        transitionProperty="background-color, color"
        transitionDuration="500ms"
        textTransform="uppercase"
        _hover={{
            bgColor: '#ddd',
            color: '#000'
        }}
    >
        {label}
    </BlogText>
}