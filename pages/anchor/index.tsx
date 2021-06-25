import { Flex } from '@chakra-ui/react'
import { AnchorBorrow, AnchorBorrowed, AnchorOverview, AnchorSupplied, AnchorSupply } from '@inverse/components/Anchor'
import { NavButtons } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { useState } from 'react'

export const Anchor = () => {
  const [active, setActive] = useState('Supply')

  const supplyDisplay = { base: active === 'Supply' ? 'flex' : 'none', lg: 'flex' }
  const borrowDisplay = { base: active === 'Borrow' ? 'flex' : 'none', lg: 'flex' }

  return (
    <Layout>
      <AppNav active="Anchor" />
      <Flex w={{ base: 'full', xl: '84rem' }} justify="center">
        <AnchorOverview />
      </Flex>
      <Flex w="full" direction="column" justify="center">
        <Flex w="full" justify="center" display={{ base: 'flex', lg: 'none' }}>
          <Container noPadding>
            <NavButtons options={['Supply', 'Borrow']} active={active} onClick={setActive} />
          </Container>
        </Flex>
        <Flex w="full" justify="center">
          <Flex w={{ base: 'full', xl: '2xl' }} justify="flex-end" display={supplyDisplay}>
            <AnchorSupplied />
          </Flex>
          <Flex w={{ base: 'full', xl: '2xl' }} display={borrowDisplay}>
            <AnchorBorrowed />
          </Flex>
        </Flex>
        <Flex w="full" justify="center">
          <Flex w={{ base: 'full', xl: '2xl' }} justify="flex-end" display={supplyDisplay}>
            <AnchorSupply />
          </Flex>
          <Flex w={{ base: 'full', xl: '2xl' }} display={borrowDisplay}>
            <AnchorBorrow />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Anchor
