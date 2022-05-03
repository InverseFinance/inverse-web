import Container from './container'
import { BLOG_THEME } from '../lib/constants'
import Footer from '@app/components/common/Footer'
import { Box, Flex } from '@chakra-ui/react'

export default function BlogFooter() {
  // translateY is to hide substack mention
  return (
    <Flex direction="column" as="footer" alignItems="center" justifyContent="center">
      <Box overflow="hidden" h="250px">
        <iframe
          src="https://inversestarship.substack.com/embed"
          width="100%"
          height="320"
          frameBorder="0"
          style={{ transform: 'translateY(-30px)' }}
          scrolling="no"></iframe>
      </Box>
      <Box w='full' alignItems="center" justifyContent="center" bgColor={BLOG_THEME.colors.secondaryTextColor}>
        <Container>
          <Footer />
        </Container>
      </Box>
    </Flex>
  )
}
