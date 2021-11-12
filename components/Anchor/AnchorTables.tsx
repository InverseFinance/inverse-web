import { Flex, Stack, Switch, Text, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { AnchorBorrowModal, AnchorSupplyModal } from '@inverse/components/Anchor/AnchorModals'
import Container from '@inverse/components/common/Container'
import { SkeletonBlob, SkeletonList } from '@inverse/components/common/Skeleton'
import Table from '@inverse/components/common/Table'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useAccountMarkets, useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { Market } from '@inverse/types'
import { getComptrollerContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { commify, formatUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { handleTx } from '@inverse/util/transactions'
import { showFailNotif } from '@inverse/util/notify'
import { TEST_IDS } from '@inverse/config/test-ids'
import { UnderlyingItem } from '@inverse/components/common/Underlying/UnderlyingItem'

const hasMinAmount = (amount: BigNumber | undefined, decimals: number, exRate: BigNumber, minWorthAccepted = 0.01): boolean => {
  if (amount === undefined) { return false }
  return amount &&
    parseFloat(formatUnits(amount, decimals)) *
    parseFloat(formatUnits(exRate)) >=
    minWorthAccepted;
}

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
  const [double, setDouble] = useState(false)

  const handleSupply = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying } = market;

    const balance =
      balances && exchangeRates
        ? parseFloat(formatUnits(balances[token], underlying.decimals)) *
        parseFloat(formatUnits(exchangeRates[token]))
        : 0

    const isCollateral = !!accountMarkets?.find((market: Market) => market?.token === token)

    return { ...market, balance, isCollateral }
  })

  const columns = [
    {
      field: 'symbol',
      label: 'Asset',
      header: ({...props}) => <Flex minWidth={40} {...props} />,
      value: ({ token, underlying }: Market) => (
        <Stack minWidth={40} direction="row" align="center">
          <UnderlyingItem label={underlying.symbol} image={underlying.image} address={token} />
        </Stack>
      ),
    },
    {
      field: 'supplyApy',
      label: 'APY',
      header: ({...props}) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ supplyApy }: Market) => (
        <Text textAlign="end" minWidth={24}>
          {supplyApy ? `${supplyApy.toFixed(2)}%` : '0.00%'}
        </Text>
      ),
    },
    {
      field: 'rewardApy',
      label: 'Reward APY',
      header: ({...props}) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ rewardApy }: Market) => (
        <Text textAlign="end" minWidth={24}>
          {rewardApy ? `${rewardApy.toFixed(2)}%` : '0.00%'}
        </Text>
      ),
    },
    {
      field: 'balance',
      label: 'Balance',
      header: ({...props}) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ balance }: Market) => {
        return <Text textAlign="end" minWidth={24}>{`${balance?.toFixed(2)}`}</Text>
      },
    },
    {
      field: 'isCollateral',
      label: 'Collateral',
      header: ({...props}) => <Flex justify="flex-end" minWidth={24} display={{ base: 'none', sm: 'flex' }} {...props} />,
      value: ({ token, isCollateral }: Market) => {
        return (
          <Flex justify="flex-end" minWidth={24} display={{ base: 'none', md: 'flex' }}>
            <Flex
              onClick={async (e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation()
                if (!double) {
                  setDouble(true)
                  try {
                    const contract = getComptrollerContract(library?.getSigner())
                    if (isCollateral) {
                      await handleTx(await contract.exitMarket(token))
                    } else {
                      await handleTx(await contract.enterMarkets([token]))
                    }
                  } catch (e) {
                    showFailNotif(e, true);
                  } finally {
                    setDouble(false)
                  }
                }
              }}
            >
              <Switch size="sm" colorScheme="purple" isChecked={!!isCollateral} />
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
        items={marketsWithBalance.filter(
          ({ token, underlying }: Market) =>
            hasMinAmount(balances[token], underlying.decimals, exchangeRates[token])
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

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying } = market;
    const balance = balances && balances[token] ? parseFloat(formatUnits(balances[token], underlying.decimals)) : 0
    return { ...market, balance }
  })

  const columns = [
    {
      field: 'symbol',
      label: 'Asset',
      header: ({...props}) => <Flex minWidth={24} {...props} />,
      value: ({ token, underlying }: Market) => (
        <Stack minWidth={24} direction="row" align="center">
          <UnderlyingItem label={underlying.symbol} image={underlying.image} address={token} />
        </Stack>
      ),
    },
    {
      field: 'borrowApy',
      label: 'APR',
      header: ({...props}) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ borrowApy }: Market) => (
        <Text textAlign="end" minWidth={24}>
          {borrowApy ? `${borrowApy.toFixed(2)}%` : '0.00%'}
        </Text>
      ),
    },
    {
      field: 'balance',
      label: 'Balance',
      header: ({...props}) => <Flex justify="flex-end" minWidth={24} {...props} />,
      value: ({ balance }: Market) => {
        return <Text textAlign="end" minWidth={24}>{`${balance?.toFixed(2)}`}</Text>
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
          items={marketsWithBalance.filter(
            ({ token, underlying }: Market) =>
              hasMinAmount(balances[token], underlying.decimals, exchangeRates[token])
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

  const marketsWithBalance = markets?.map((market) => {
    const { underlying } = market;
    const balance = balances
      ? parseFloat(
        formatUnits(underlying.address ? balances[underlying.address] : balances.ETH, underlying.decimals)
      )
      : 0
    return { ...market, balance }
  })

  const columns = [
    {
      field: 'symbol',
      label: 'Asset',
      header: ({...props}) => <Flex minWidth={36} {...props} />,
      value: ({ token, underlying }: Market) => (
        <Stack minWidth={36} direction="row" align="center" data-testid={`${TEST_IDS.anchor.tableItem}-${underlying.symbol}`}>
          <UnderlyingItem label={underlying.symbol} image={underlying.image} address={token} />
        </Stack>
      ),
    },
    {
      field: 'supplyApy',
      label: 'APY',
      header: ({...props}) => <Flex justify="end" minWidth={20} {...props} />,
      value: ({ supplyApy }: Market) => (
        <Text minWidth={20} textAlign="end">
          {supplyApy ? `${supplyApy.toFixed(2)}%` : '0.00%'}
        </Text>
      ),
    },
    {
      field: 'rewardApy',
      label: 'Reward APY',
      header: ({...props}) => <Flex justify="end" minWidth={20} {...props} />,
      value: ({ rewardApy }: Market) => (
        <Text textAlign="end" minWidth={20}>
          {rewardApy ? `${rewardApy.toFixed(2)}%` : '0.00%'}
        </Text>
      ),
    },
    {
      field: 'balance',
      label: 'Wallet',
      header: ({...props}) => <Flex justify="flex-end" minWidth={24} {...props} />,
      value: ({ balance }: Market) => {
        return (
          <Text
            textAlign="end"
            minWidth={24}
            justify="flex-end"
            color={balance ? '' : 'purple.300'}
          >{`${balance?.toFixed(2)}`}</Text>
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
      <Table columns={columns} items={marketsWithBalance} onClick={handleSupply} data-testid={TEST_IDS.anchor.supplyTable} />
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

  const marketsWithUsdLiquidity = markets?.map((market) => {
    const { underlying, liquidity } = market;
    const liquidityUsd = liquidity && prices ? liquidity * (prices[underlying?.coingeckoId]?.usd || 1) : 0;
    return { ...market, liquidityUsd };
  });

  const columns = [
    {
      field: 'symbol',
      label: 'Asset',
      header: ({...props}) => <Flex minWidth={24} {...props} />,
      value: ({ token, underlying }: Market) => (
        <Stack minWidth={24} direction="row" align="center" data-testid={`${TEST_IDS.anchor.tableItem}-${underlying.symbol}`}>
          <UnderlyingItem label={underlying.symbol} image={underlying.image} address={token} />
        </Stack>
      ),
    },
    {
      field: 'borrowApy',
      label: 'APR',
      header: ({...props}) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ borrowApy }: Market) => (
        <Text textAlign="end" minWidth={24}>
          {borrowApy ? `${borrowApy.toFixed(2)}%` : '0.00%'}
        </Text>
      ),
    },
    {
      field: 'liquidityUsd',
      label: 'Liquidity',
      header: ({...props}) => <Flex justify="flex-end" minWidth={24} {...props} />,
      value: ({ liquidityUsd }: Market) => (
        <Text textAlign="end" minWidth={24}>
          {
            liquidityUsd
              ? `$${commify((liquidityUsd / 1e6).toFixed(2))}M`
              : '-'
          }
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
      <Table columns={columns} items={marketsWithUsdLiquidity.filter(({ borrowable }: Market) => borrowable)} onClick={handleBorrow} data-testid={TEST_IDS.anchor.borrowTable} />
      {modalAsset && <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}
