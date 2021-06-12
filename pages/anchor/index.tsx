import { Flex, Spacer } from '@chakra-ui/react'
import Footer from '@inverse/components/Footer'
import { Navbar, Banner, Products, Stats } from '@inverse/components/Landing'

export const Landing = () => (
  <Flex w="full" minH="100vh" bgColor="purple.900" direction="column" align="center">
    <Spacer />
    <Footer />
  </Flex>
)

export default Landing
