import { Text } from '@chakra-ui/react';
import { BLOG_THEME } from '../lib/constants';

export default function PostTitle({ children }) {
  return (
    <Text
      w='full'
      mb="8"
      textAlign="center"
      as="h1"
      color={BLOG_THEME.colors.activeTextColor}
      fontSize={{ base: '30', sm: '40', lg: '60' }}
      fontWeight="extrabold">
      {children}
    </Text>
  )
}
