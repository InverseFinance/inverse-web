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
  const { isOpen: supplyIsOpen, onOpen: supplyOnOpen, onClose: supplyOnClose } = useDisclosure()
  const { isOpen: borrowIsOpen, onOpen: borrowOnOpen, onClose: borrowOnClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<any>()

  const handleBorrow = (asset: any) => {
    setModalAsset(asset)
    borrowOnOpen()
  }

  const handleSupply = (asset: any) => {
    setModalAsset(asset)
    supplyOnOpen()
  }

  const supplyDisplay = { base: active === 'Supply' ? 'flex' : 'none', lg: 'flex' }
  const borrowDisplay = { base: active === 'Borrow' ? 'flex' : 'none', lg: 'flex' }

  return (
    <Layout>
      <AppNav active="Anchor" />
      <Flex w="full" justify="center">
        <AnchorOverview />
      </Flex>
      <Flex w="full" direction="column" justify="center">
        <Flex w="full" justify="center" display={{ base: 'flex', lg: 'none' }}>
          <ToggleButton active={active} onClick={setActive} options={['Supply', 'Borrow']} />
        </Flex>
        <Flex w="full" justify="center">
          <Flex w="full" justify="flex-end" display={supplyDisplay}>
            <AnchorSupplied onClick={handleSupply} />
          </Flex>
          <Flex w="full" display={borrowDisplay}>
            <AnchorBorrowed onClick={handleBorrow} />
          </Flex>
        </Flex>
        <Flex w="full" justify="center">
          <Flex w="full" justify="flex-end" display={supplyDisplay}>
            <AnchorSupply onClick={handleSupply} />
          </Flex>
          <Flex w="full" display={borrowDisplay}>
            <AnchorBorrow onClick={handleBorrow} />
          </Flex>
        </Flex>
      </Flex>
      <AnchorSupplyModal isOpen={supplyIsOpen} onClose={supplyOnClose} asset={modalAsset} />
      <AnchorBorrowModal isOpen={borrowIsOpen} onClose={borrowOnClose} asset={modalAsset} />
    </Layout>
  )
}

export default Anchor
