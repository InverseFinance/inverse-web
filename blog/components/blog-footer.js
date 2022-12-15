import { useAppTheme } from '@app/hooks/useAppTheme';
import Container from './container'
import { BLOG_THEME } from '../lib/constants'
import Footer from '@app/components/common/Footer'
import { Box, Flex } from '@chakra-ui/react'
import { Newsletter } from '../../components/common/Newsletter/index';

export default function BlogFooter({ includeNewsletter = true }) {
  const { themeName } = useAppTheme();
  // translateY is to hide substack mention
  return (
    <Flex direction="column" as="footer" alignItems="center" justifyContent="center">
      {includeNewsletter && <Newsletter />}
      <Box w='full' alignItems="center" justifyContent="center" bgColor={
        themeName === 'dark' ? BLOG_THEME.colors.secondaryTextColor : undefined
      }>
        <Footer />
      </Box>
    </Flex>
  )
}
