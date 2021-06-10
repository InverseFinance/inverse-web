import { Flex, Text } from '@chakra-ui/react'
import { Navbar, Banner, Products, Footer, Stats } from '@inverse/components/landing'

export default function Home() {
  return (
    <Flex w="full" bgColor="purple.900" direction="column" align="center">
      <Navbar />
      <Banner />
      <Stats />
      <Products />
      <Footer />
    </Flex>
  )
}
