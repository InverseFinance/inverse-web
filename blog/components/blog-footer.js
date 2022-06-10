import Container from './container'
import { BLOG_THEME } from '../lib/constants'
import Footer from '@app/components/common/Footer'
import { Box, Flex } from '@chakra-ui/react'
import { Newsletter } from '../../components/common/Newsletter/index';

export default function BlogFooter({ includeNewsletter = true }) {
  // translateY is to hide substack mention
  return (
    <Flex direction="column" as="footer" alignItems="center" justifyContent="center">
      { includeNewsletter && <Newsletter /> }
      <Box w='full' alignItems="center" justifyContent="center" bgColor={BLOG_THEME.colors.secondaryTextColor}>
        <Container>
          <Footer />
        </Container>
      </Box>
    </Flex>
  )
}
