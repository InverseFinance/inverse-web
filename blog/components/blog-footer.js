import Container from './container'
import { BLOG_THEME } from '../lib/constants'
import Footer from '@app/components/common/Footer'
import { Box } from '@chakra-ui/react'

export default function BlogFooter() {
  return (
    <Box as="footer" bgColor={BLOG_THEME.colors.secondaryTextColor}>
      <Container>
        <Footer />
      </Container>
    </Box>
  )
}
