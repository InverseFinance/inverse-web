import { BLOG_THEME } from '../lib/constants';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import BlogLink from './common/blog-link';

export default function Excerpt({ excerpt, content, url, charLimit = 200 }) {
    return (
        <BlogLink href={url} color={BLOG_THEME.colors.secondaryTextColor} cursor="pointer" fontWeight="normal" _hover={{}}>
            {excerpt || (documentToPlainTextString(content.json).substring(0, charLimit) + '...')}
        </BlogLink>
    )
}