import {
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Switch,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import Container from '@inverse/components/Container'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { XINV } from '@inverse/constants'
import { Market } from '@inverse/types'
import { commify, formatUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import Table from '@inverse/components/Table'
import { useAccountLiquidity, useExchangeRates } from '@inverse/hooks/useAccountLiquidity'

type AnchorProps = {
  onBorrow?: any
  onSupply?: any
}

const AnchorOverview = () => {
  const { usdBorrow, usdBorrowable, netApy } = useAccountLiquidity()

  return usdBorrow || usdBorrowable ? (
    <Container w="84rem" label={`Net APY: ${netApy.toFixed(2)}%`}>
      <Flex w="full" justify="center">
        <Stack w="full" direction="row" justify="center" align="center" spacing={2} fontSize="sm" fontWeight="semibold">
          <Flex whiteSpace="nowrap" color="purple.100" fontSize="13px">
            Borrow Limit
          </Flex>
          <Text>{`${usdBorrowable ? Math.floor((usdBorrow / (usdBorrowable + usdBorrow)) * 100) : 0}%`}</Text>
          <Flex w="full" h={1} borderRadius={8} bgColor="purple.900">
            <Flex
              w={`${Math.floor((usdBorrow / (usdBorrowable + usdBorrow)) * 100)}%`}
              h="full"
              borderRadius={8}
              bgColor="purple.300"
            ></Flex>
          </Flex>
          <Text>{`$${usdBorrowable ? commify((usdBorrowable + usdBorrow).toFixed(2)) : '0.00'}`}</Text>
        </Stack>
      </Flex>
    </Container>
  ) : (
    <></>
  )
}

const AnchorSupplied = () => {
  const { markets } = useMarkets()
  const { usdSupply } = useAccountLiquidity()
  const { balances } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()

  const columns = [
    {
      header: <Flex width={1 / 5}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack width={1 / 5} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" width={1 / 5}>
          APY
        </Flex>
      ),
      value: ({ supplyApy }: Market) => (
        <Text textAlign="center" width={1 / 5}>
          {supplyApy ? `${supplyApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="center" width={1 / 5}>
          Balance
        </Flex>
      ),
      value: ({ token, underlying }: Market) => {
        const balance =
          balances && exchangeRates
            ? parseFloat(formatUnits(balances[token])) * parseFloat(formatUnits(exchangeRates[token]))
            : 0

        return <Text textAlign="center" width={1 / 5}>{`${balance.toFixed(2)} ${underlying.symbol}`}</Text>
      },
    },
    {
      header: (
        <Flex justify="flex-end" width={1 / 5}>
          Collateral
        </Flex>
      ),
      value: () => (
        <Flex justify="flex-end" width={1 / 5}>
          <Flex onClick={(e) => e.stopPropagation()}>
            <Switch size="sm" colorScheme="purple" onClick={(e) => e.stopPropagation()} />
          </Flex>
        </Flex>
      ),
    },
  ]

  return balances && usdSupply ? (
    <Container w="2xl" label={`$${commify(usdSupply.toFixed(2))}`} description="Your supplied assets">
      <Table columns={columns} items={markets.filter(({ token }: Market) => balances[token])} />
    </Container>
  ) : (
    <></>
  )
}

const AnchorBorrowed = () => {
  const { markets } = useMarkets()
  const { usdBorrow } = useAccountLiquidity()
  const { balances } = useBorrowBalances()
  const { exchangeRates } = useExchangeRates()

  const columns = [
    {
      header: <Flex width={1 / 3}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack width={1 / 3} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" width={1 / 3}>
          APR
        </Flex>
      ),
      value: ({ borrowApy }: Market) => (
        <Text textAlign="center" width={1 / 3}>
          {borrowApy ? `${borrowApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="center" width={1 / 5}>
          Balance
        </Flex>
      ),
      value: ({ token, underlying }: Market) => {
        const balance = balances ? parseFloat(formatUnits(balances[token], underlying.decimals)) : 0

        return <Text textAlign="center" width={1 / 5}>{`${balance.toFixed(2)} ${underlying.symbol}`}</Text>
      },
    },
  ]

  return balances && usdBorrow ? (
    <Container w="2xl" label={`$${commify(usdBorrow.toFixed(2))}`} description="Your supplied assets">
      <Table columns={columns} items={markets.filter(({ token }: Market) => balances[token])} />
    </Container>
  ) : (
    <></>
  )
}

const AnchorSupply = () => {
  const { markets } = useMarkets()
  const { balances } = useAccountBalances()

  const columns = [
    {
      header: <Flex width={1 / 3}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack width={1 / 3} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" width={1 / 3}>
          APY
        </Flex>
      ),
      value: ({ supplyApy }: Market) => (
        <Text width={1 / 3} textAlign="center">
          {supplyApy ? `${supplyApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="flex-end" width={1 / 3}>
          Wallet
        </Flex>
      ),
      value: ({ underlying }: Market) => {
        const balance = balances
          ? parseFloat(
              formatUnits(underlying.address ? balances[underlying.address] : balances.ETH, underlying.decimals)
            )
          : 0

        return (
          <Text
            textAlign="end"
            width={1 / 3}
            justify="flex-end"
            color={balance ? '' : 'purple.200'}
          >{`${balance.toFixed(2)} ${underlying.symbol}`}</Text>
        )
      },
    },
  ]

  return markets ? (
    <Container
      w="2xl"
      label="Supply"
      description="Earn interest on your deposits"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
    >
      <Table columns={columns} items={markets} />
    </Container>
  ) : (
    <></>
  )
}

const AnchorBorrow = () => {
  const { markets } = useMarkets()
  const { prices } = usePrices()

  const columns = [
    {
      header: <Flex width={1 / 3}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack width={1 / 3} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" width={1 / 3}>
          APR
        </Flex>
      ),
      value: ({ borrowApy }: Market) => (
        <Text textAlign="center" width={1 / 3}>
          {borrowApy ? `${borrowApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="flex-end" width={1 / 3}>
          Liquidity
        </Flex>
      ),
      value: ({ underlying, liquidity }: Market) => (
        <Text textAlign="end" width={1 / 3}>{`$${
          liquidity ? commify(((liquidity * (prices ? prices[underlying.coingeckoId]?.usd : 1)) / 1e6).toFixed(2)) : 0
        }M`}</Text>
      ),
    },
  ]

  return markets ? (
    <Container
      w="2xl"
      label="Supply"
      description="Earn interest on your deposits"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
    >
      <Table columns={columns} items={markets.filter(({ token }: Market) => token !== XINV)} />
    </Container>
  ) : (
    <></>
  )
}

export const AnchorBorrowModal = ({ isOpen, onClose, asset }: any) => {
  return (
    <Modal onClose={onClose} isOpen={isOpen} colorScheme="purple">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Borrow</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{JSON.stringify(asset)}</ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export const AnchorSupplyModal = ({ isOpen, onClose, asset }: any) => {
  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Supply</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{JSON.stringify(asset)}</ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export const Anchor = () => {
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

  return (
    <Layout>
      <AppNav active="Anchor" />
      <Flex w="full" justify="center">
        <AnchorOverview />
      </Flex>
      <Flex w="full" justify="center">
        <AnchorSupplied />
        <AnchorBorrowed />
      </Flex>
      <Flex w="full" justify="center">
        <AnchorSupply />
        <AnchorBorrow />
      </Flex>
    </Layout>
  )
}

export default Anchor
