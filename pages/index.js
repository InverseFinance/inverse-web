import { Stack } from '@chakra-ui/react'
import { Navbar, Banner, Products, Footer, Stats } from '@inverse/components/landing'

export default function Home() {
  return (
    <Stack bgColor="darkestSlateBlue" direction="column" width="full" align="center" spacing={0}>
      <Navbar />
      <Banner />
      <Stats />
      <Products />
      <Footer />
    </Stack>
  )
}
