import { BLOG_THEME } from '../lib/constants';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import { Text } from '@chakra-ui/react';
import Link from 'next/link';

export default function Excerpt({ excerpt, content, url }) {
    return (
        <Link href={url}>
            <Text as="a" color={BLOG_THEME.colors.secondaryTextColor} cursor="pointer">
                {excerpt || (documentToPlainTextString(content.json).substring(0, 200) + '...')}
            </Text>
        </Link>
    )
}