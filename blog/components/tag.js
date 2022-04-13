import { Text } from '@chakra-ui/react';
import { BLOG_THEME } from '../lib/constants';

export default function Tag({ name, label }) {
    return <Text
        py="1"
        px="3"
        borderRadius="10"
        color={BLOG_THEME.colors.activeTextColor}
        bgColor={BLOG_THEME.colors.badgeBgColor}
        fontSize="14px"
    >
        {label}
    </Text>
}