import { Text } from '@chakra-ui/react'
import Link from 'next/link'
import { BLOG_THEME } from '../../lib/constants'

export default function BlogLink({ href, children, ...props }) {
    return (
        <Link href={href} legacyBehavior>
            <Text href={href} as="a" _hover={{ textDecoration: 'underline' }} cursor="pointer" fontWeight="bold" color={BLOG_THEME.colors.activeTextColor} {...props}>
                {children}
            </Text>
        </Link>
    )
}