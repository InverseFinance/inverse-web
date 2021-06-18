import { Flex, Image, Stack, Switch, Text } from '@chakra-ui/react'
import Container from '@inverse/components/Container'
import { XINV } from '@inverse/constants'
import { Market } from '@inverse/types'
import { commify, formatUnits } from 'ethers/lib/utils'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import Table from '@inverse/components/Table'
import { useAccountLiquidity, useExchangeRates } from '@inverse/hooks/useAccountLiquidity'

type AnchorProps = {
  onClick: any
}

export const AnchorSupplied = ({ onClick }: AnchorProps) => {
  const { markets } = useMarkets()
  const { usdSupply } = useAccountLiquidity()
  const { balances } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()

  const columns = [
    {
      header: <Flex minWidth={24}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack minWidth={24} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" minWidth={24}>
          APY
        </Flex>
      ),
      value: ({ supplyApy }: Market) => (
        <Text textAlign="center" minWidth={24}>
          {supplyApy ? `${supplyApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="center" minWidth={24}>
          Balance
        </Flex>
      ),
      value: ({ token, underlying }: Market) => {
        const balance =
          balances && exchangeRates
            ? parseFloat(formatUnits(balances[token])) * parseFloat(formatUnits(exchangeRates[token]))
            : 0

        return <Text textAlign="center" minWidth={24}>{`${balance.toFixed(2)} ${underlying.symbol}`}</Text>
      },
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={24} display={{ base: 'none', sm: 'flex' }}>
          Collateral
        </Flex>
      ),
      value: () => (
        <Flex justify="flex-end" minWidth={24} display={{ base: 'none', sm: 'flex' }}>
          <Flex onClick={(e) => e.stopPropagation()}>
            <Switch size="sm" colorScheme="purple" onClick={(e) => e.stopPropagation()} />
          </Flex>
        </Flex>
      ),
    },
  ]

  return balances && usdSupply ? (
    <Container
      w={{ base: 'full', xl: '2xl' }}
      label={`$${commify(usdSupply.toFixed(2))}`}
      description="Your supplied assets"
    >
      <Table columns={columns} items={markets.filter(({ token }: Market) => balances[token])} onClick={onClick} />
    </Container>
  ) : (
    <></>
  )
}

export const AnchorBorrowed = ({ onClick }: AnchorProps) => {
  const { markets } = useMarkets()
  const { usdBorrow } = useAccountLiquidity()
  const { balances } = useBorrowBalances()

  const columns = [
    {
      header: <Flex minWidth={24}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack minWidth={24} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" minWidth={24}>
          APR
        </Flex>
      ),
      value: ({ borrowApy }: Market) => (
        <Text textAlign="center" minWidth={24}>
          {borrowApy ? `${borrowApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={24}>
          Balance
        </Flex>
      ),
      value: ({ token, underlying }: Market) => {
        const balance = balances ? parseFloat(formatUnits(balances[token], underlying.decimals)) : 0

        return <Text textAlign="end" minWidth={24}>{`${balance.toFixed(2)} ${underlying.symbol}`}</Text>
      },
    },
  ]

  return balances && usdBorrow ? (
    <Container
      w={{ base: 'full', xl: '2xl' }}
      label={`$${commify(usdBorrow.toFixed(2))}`}
      description="Your borrowed assets"
    >
      <Table columns={columns} items={markets.filter(({ token }: Market) => balances[token])} onClick={onClick} />
    </Container>
  ) : (
    <></>
  )
}

export const AnchorSupply = ({ onClick }: AnchorProps) => {
  const { markets } = useMarkets()
  const { balances } = useAccountBalances()

  const columns = [
    {
      header: <Flex minWidth={24}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack minWidth={24} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" minWidth={24}>
          APY
        </Flex>
      ),
      value: ({ supplyApy }: Market) => (
        <Text minWidth={24} textAlign="center">
          {supplyApy ? `${supplyApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={24}>
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
            minWidth={24}
            justify="flex-end"
            color={balance ? '' : 'purple.200'}
          >{`${balance.toFixed(2)} ${underlying.symbol}`}</Text>
        )
      },
    },
  ]

  return markets ? (
    <Container
      w={{ base: 'full', xl: '2xl' }}
      label="Supply"
      description="Earn interest on your deposits"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
    >
      <Table columns={columns} items={markets} onClick={onClick} />
    </Container>
  ) : (
    <></>
  )
}

export const AnchorBorrow = ({ onClick }: AnchorProps) => {
  const { markets } = useMarkets()
  const { prices } = usePrices()

  const columns = [
    {
      header: <Flex minWidth={24}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack minWidth={24} direction="row" align="center">
          <Image src={underlying.image} w={5} h={5} />
          <Text>{underlying.symbol}</Text>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="center" minWidth={24}>
          APR
        </Flex>
      ),
      value: ({ borrowApy }: Market) => (
        <Text textAlign="center" minWidth={24}>
          {borrowApy ? `${borrowApy.toFixed(2)}%` : '-'}
        </Text>
      ),
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={24}>
          Liquidity
        </Flex>
      ),
      value: ({ underlying, liquidity }: Market) => (
        <Text textAlign="end" minWidth={24}>{`$${
          liquidity ? commify(((liquidity * (prices ? prices[underlying.coingeckoId]?.usd : 1)) / 1e6).toFixed(2)) : 0
        }M`}</Text>
      ),
    },
  ]

  return markets ? (
    <Container
      w={{ base: 'full', xl: '2xl' }}
      label="Borrow"
      description="Borrow against your supplied collateral"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/borrowing"
    >
      <Table columns={columns} items={markets.filter(({ token }: Market) => token !== XINV)} onClick={onClick} />
    </Container>
  ) : (
    <></>
  )
}
