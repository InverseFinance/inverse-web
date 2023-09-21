import { BLOG_THEME } from '../lib/constants';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import BlogLink from './common/blog-link';
import BlogText from './common/text';

export default function Excerpt({ excerpt, content, url, charLimit = 256, asLink = true, color = BLOG_THEME.colors.secondaryTextColor }) {
    const text = (excerpt || (!!content?.json ? documentToPlainTextString(content?.json) : ''))
    const excerptContent = text.substring(0, charLimit) + (text?.length > charLimit ? '...' : '')
    
    if (asLink) {
        return <BlogLink href={url} color={color} cursor="pointer" fontWeight="normal" _hover={{}}>
            {excerptContent}
        </BlogLink>
    }

    return (
        <BlogText color={color} fontWeight="normal" _hover={{}}>
            {excerptContent}
        </BlogText>
    )
}