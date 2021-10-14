import { Flex, Image, Stack, Switch, Text, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { AnchorBorrowModal, AnchorSupplyModal } from '@inverse/components/Anchor/AnchorModals'
import Container from '@inverse/components/Container'
import { SkeletonBlob, SkeletonList } from '@inverse/components/Skeleton'
import Table from '@inverse/components/Table'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useAccountMarkets, useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { Market } from '@inverse/types'
import { getComptrollerContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { commify, formatUnits } from 'ethers/lib/utils'
import { useState } from 'react'

export const AnchorSupplied = () => {
  const { library } = useWeb3React<Web3Provider>()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdSupply, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()
  const { markets: accountMarkets } = useAccountMarkets()
  const { active } = useWeb3React()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleSupply = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  const columns = [
    {
      header: <Flex minWidth={40}>Asset</Flex>,
      value: ({ underlying }: Market) => (
        <Stack minWidth={40} direction="row" align="center">
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
          Reward APY
        </Flex>
      ),
      value: ({ rewardApy }: Market) => (
        <Text textAlign="center" minWidth={24}>
          {rewardApy ? `${rewardApy.toFixed(2)}%` : '-'}
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
            ? parseFloat(formatUnits(balances[token], underlying.decimals)) *
              parseFloat(formatUnits(exchangeRates[token]))
            : 0

        return <Text textAlign="center" minWidth={24}>{`${balance.toFixed(2)}`}</Text>
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
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation()
                const contract = getComptrollerContract(library?.getSigner())
                if (isEnabled) {
                  contract.exitMarket(token)
                } else {
                  contract.enterMarkets([token])
                }
              }}
            >
              <Switch size="sm" colorScheme="purple" isChecked={!!isEnabled} />
            </Flex>
          </Flex>
        )
      },
    },
  ]

  if (!active || !usdSupply) {
    return <></>
  }

  if (marketsLoading || accountLiquidityLoading || balancesLoading || !balances || !exchangeRates) {
    return (
      <Container description="Your supplied assets">
        <SkeletonBlob skeletonHeight={6} noOfLines={5} />
      </Container>
    )
  }

  return (
    <Container label={`$${commify(usdSupply.toFixed(2))}`} description="Your supplied assets">
      <Table
        columns={columns}
        items={markets.filter(
          ({ token, underlying }: Market) =>
            balances[token] &&
            parseFloat(formatUnits(balances[token], underlying.decimals)) *
              parseFloat(formatUnits(exchangeRates[token])) >=
              0.01
        )}
        onClick={handleSupply}
      />
      {modalAsset && <AnchorSupplyModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}

export const AnchorBorrowed = () => {
  const { active } = useWeb3React()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdBorrow, usdSupply, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useBorrowBalances()
  const { exchangeRates } = useExchangeRates()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleBorrow = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

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

        return <Text textAlign="end" minWidth={24}>{`${balance.toFixed(2)}`}</Text>
      },
    },
  ]

  if (!active || !usdSupply) {
    return <></>
  }

  if (marketsLoading || accountLiquidityLoading || balancesLoading || !balances || !exchangeRates) {
    return (
      <Container description="Your borrowed assets">
        <SkeletonBlob skeletonHeight={6} noOfLines={5} />
      </Container>
    )
  }

  return (
    <Container
      label={`$${usdBorrow ? commify(usdBorrow.toFixed(2)) : usdBorrow.toFixed(2)}`}
      description="Your borrowed assets"
    >
      {usdBorrow ? (
        <Table
          columns={columns}
          items={markets.filter(
            ({ token, underlying }: Market) =>
              balances[token] &&
              parseFloat(formatUnits(balances[token], underlying.decimals)) *
                parseFloat(formatUnits(exchangeRates[token])) >=
                0.01
          )}
          onClick={handleBorrow}
        />
      ) : (
        <Flex w="full" justify="center" color="purple.200" fontSize="sm">
          You don't have any borrowed assets.
        </Flex>
      )}
      {modalAsset && <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}

export const AnchorSupply = () => {
  const { markets, isLoading } = useMarkets()
  const { balances } = useAccountBalances()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleSupply = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

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
        <Flex justify="center" minWidth={24}>
          Reward APY
        </Flex>
      ),
      value: ({ rewardApy }: Market) => (
        <Text textAlign="center" minWidth={24}>
          {rewardApy ? `${rewardApy.toFixed(2)}%` : '-'}
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
          >{`${balance.toFixed(2)}`}</Text>
        )
      },
    },
  ]

  if (isLoading || !markets) {
    return (
      <Container
        label="Supply"
        description="Earn interest on your deposits"
        href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
      >
        <SkeletonList />
      </Container>
    )
  }

  return (
    <Container
      label="Supply"
      description="Earn interest on your deposits"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
    >
      <Table columns={columns} items={markets} onClick={handleSupply} />
      {modalAsset && <AnchorSupplyModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}

export const AnchorBorrow = () => {
  const { markets, isLoading } = useMarkets()
  const { prices } = usePrices()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleBorrow = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

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
        <Text textAlign="end" minWidth={24}>
          {liquidity && prices
            ? `$${commify(((liquidity * (prices[underlying.coingeckoId]?.usd || 1)) / 1e6).toFixed(2))}M`
            : '-'}
        </Text>
      ),
    },
  ]

  if (isLoading || !markets) {
    return (
      <Container
        label="Borrow"
        description="Borrow against your supplied collateral"
        href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/borrowing"
      >
        <SkeletonList />
      </Container>
    )
  }

  return (
    <Container
      label="Borrow"
      description="Borrow against your supplied collateral"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/borrowing"
    >
      <Table columns={columns} items={markets.filter(({ borrowable }: Market) => borrowable)} onClick={handleBorrow} />
      {modalAsset && <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}
