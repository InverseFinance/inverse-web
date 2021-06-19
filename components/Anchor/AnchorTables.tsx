import { Flex, Image, Stack, Switch, Text } from '@chakra-ui/react'
import Container from '@inverse/components/Container'
import { COMPTROLLER, XINV } from '@inverse/config'
import { Market } from '@inverse/types'
import { commify, formatUnits } from 'ethers/lib/utils'
import { useAccountMarkets, useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import Table from '@inverse/components/Table'
import { useAccountLiquidity, useExchangeRates } from '@inverse/hooks/useAccountLiquidity'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { Contract } from 'ethers'
import { COMPTROLLER_ABI } from '@inverse/abis'

type AnchorProps = {
  onClick: any
}

export const AnchorSupplied = ({ onClick }: AnchorProps) => {
  const { library } = useWeb3React<Web3Provider>()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdBorrow, usdSupply, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()
  const { markets: accountMarkets } = useAccountMarkets()
  const { active } = useWeb3React()

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
      value: ({ token }: Market) => {
        const isEnabled = accountMarkets.find((market: Market) => market.token === token)
        return (
          <Flex justify="flex-end" minWidth={24} display={{ base: 'none', sm: 'flex' }}>
            <Flex
              onClick={(e) => {
                e.stopPropagation()
                const contract = new Contract(COMPTROLLER, COMPTROLLER_ABI, library?.getSigner())
                if (isEnabled) {
                  contract.exitMarket(token)
                } else {
                  contract.enterMarkets([token])
                }
              }}
            >
              <Switch size="sm" colorScheme="purple" isChecked={isEnabled} />
            </Flex>
          </Flex>
        )
      },
    },
  ]

  if (!active || marketsLoading || accountLiquidityLoading || balancesLoading || !balances || !usdSupply) {
    return <></>
  }

  return (
    <Container
      w={{ base: 'full', xl: '2xl' }}
      label={`$${commify(usdSupply.toFixed(2))}`}
      description="Your supplied assets"
    >
      <Table
        columns={columns}
        items={markets.filter(({ token }: Market) => balances[token] && balances[token].gt(0))}
        onClick={onClick}
      />
    </Container>
  )
}

export const AnchorBorrowed = ({ onClick }: AnchorProps) => {
  const { active } = useWeb3React()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdBorrow, usdSupply, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useBorrowBalances()

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

  if (!active || marketsLoading || accountLiquidityLoading || balancesLoading || !balances || !usdSupply) {
    return <></>
  }

  return (
    <Container
      w={{ base: 'full', xl: '2xl' }}
      label={`$${usdBorrow ? commify(usdBorrow.toFixed(2)) : usdBorrow.toFixed(2)}`}
      description="Your borrowed assets"
    >
      {usdBorrow ? (
        <Table
          columns={columns}
          items={markets.filter(({ token }: Market) => balances[token] && balances[token].gt(0))}
          onClick={onClick}
        />
      ) : (
        <Flex w="full" justify="center" color="purple.200" fontSize="sm">
          You don't have any borrowed assets.
        </Flex>
      )}
    </Container>
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
