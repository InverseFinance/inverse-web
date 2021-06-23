import { Flex, useDisclosure } from '@chakra-ui/react'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { useState } from 'react'
import { ToggleButton } from '@inverse/components/Button'
import {
  AnchorBorrow,
  AnchorBorrowed,
  AnchorBorrowModal,
  AnchorOverview,
  AnchorSupplied,
  AnchorSupply,
  AnchorSupplyModal,
} from '@inverse/components/Anchor'

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
          <ToggleButton active={active} onClick={setActive} options={['Supply', 'Borrow']} />
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
