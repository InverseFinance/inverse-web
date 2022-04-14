import Container from './container'
import { BLOG_THEME } from '../lib/constants'
import { Footer as InvFooter } from '../../components/common/footer'
import { Box } from '@chakra-ui/react'

export default function Footer() {
  return (
    <Box as="footer" bgColor={BLOG_THEME.colors.secondaryTextColor}>
      <Container>
        <InvFooter />
      </Container>
    </Box>
  )
}
