import { Text } from '@chakra-ui/react';
import { BLOG_THEME } from '../lib/constants';

export default function PostTitle({ children }) {
  return (
    <Text mb="5" textAlign="center" as="h1" color={BLOG_THEME.colors.activeTextColor} fontSize="90" fontWeight="extrabold">
      {children}
    </Text>
  )
}
