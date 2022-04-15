import { useContext } from 'react';
import { BlogContext } from '../../pages/blog/[...slug]';
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
        fontSize="14px"
        href={`/blog/${locale}?byTag=${name}`}
        transitionProperty="background-color, color"
        transitionDuration="500ms"
        _hover={{
            bgColor: '#ddd',
            color: '#000'
        }}
    >
        {label}
    </BlogText>
}