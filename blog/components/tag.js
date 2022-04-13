import { BLOG_THEME } from '../lib/constants';
import BlogText from './common/text';

export default function Tag({ label }) {
    return <BlogText
        py="1"
        px="3"
        borderRadius="10"
        bgColor={BLOG_THEME.colors.badgeBgColor}
        fontSize="14px"
    >
        {label}
    </BlogText>
}