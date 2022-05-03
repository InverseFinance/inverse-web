import { Text } from '@chakra-ui/react'
import { BLOG_THEME } from '../../lib/constants'

export default function BlogText({ children, ...props }) {
    return (
        <Text color={BLOG_THEME.colors.activeTextColor} {...props}>
            {children}
        </Text>
    )
}