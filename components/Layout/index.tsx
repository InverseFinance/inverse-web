import { Flex } from '@chakra-ui/react'
import Footer from '@inverse/components/Footer'

export const Layout = ({ children }: { children?: React.ReactNode }) => (
  <>
    <Flex w="full" minH="100vh" bgColor="purple.900" direction="column" align="center">
      {children}
    </Flex>
    <Footer />
  </>
)

export default Layout
