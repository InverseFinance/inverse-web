import { Flex, Stack, Switch, Text, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { AnchorBorrowModal, AnchorSupplyModal } from '@inverse/components/Anchor/AnchorModals'
import Container from '@inverse/components/common/Container'
import { SkeletonBlob, SkeletonList } from '@inverse/components/common/Skeleton'
import Table, { Column } from '@inverse/components/common/Table'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useEscrow } from '@inverse/hooks/useEscrow'
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
import { AnchorPoolInfo } from './AnchorPoolnfo'
import { getBalanceInInv, getMonthlyRate, getParsedBalance } from '@inverse/util/markets'

const hasMinAmount = (amount: BigNumber | undefined, decimals: number, exRate: BigNumber, minWorthAccepted = 0.01): boolean => {
  if (amount === undefined) { return false }
  return amount &&
    parseFloat(formatUnits(amount, decimals)) *
    parseFloat(formatUnits(exRate)) >=
    minWorthAccepted;
}

const getColumn = (colName: 'asset' | 'supplyApy' | 'rewardApy' | 'borrowApy' | 'balance' | 'wallet', minWidth = 24, invPriceUsd?: number): Column => {
  const cols: { [key: string]: Column } = {
    asset: {
      field: 'symbol',
      label: 'Asset',
      header: ({ ...props }) => <Flex minWidth={minWidth} {...props} />,
      value: ({ token, underlying }: Market) => (
        <Stack minWidth={minWidth} direction="row" align="center" data-testid={`${TEST_IDS.anchor.tableItem}-${underlying.symbol}`}>
          <UnderlyingItem label={underlying.symbol} image={underlying.image} address={token} />
        </Stack>
      ),
    },
    supplyApy: {
      field: 'supplyApy',
      label: 'APY',
      tooltip: 'Annual Percentage Yield',
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ supplyApy, underlying, monthlyAssetRewards, priceUsd }: Market) => (
        <AnchorPoolInfo apy={supplyApy} priceUsd={priceUsd} invPriceUsd={invPriceUsd} monthlyValue={monthlyAssetRewards} symbol={underlying.symbol} type={'supply'} textProps={{ textAlign: "end", minWidth: minWidth }} />
      ),
    },
    rewardApy: {
      field: 'rewardApy',
      label: 'Reward APY',
      tooltip: <>Annual Percentage Yield in <b>INV</b> token</>,
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ rewardApy, monthlyInvRewards, priceUsd }: Market) => (
        <AnchorPoolInfo apy={rewardApy} priceUsd={priceUsd} invPriceUsd={invPriceUsd} isReward={true} monthlyValue={monthlyInvRewards} symbol="INV" type={'supply'} textProps={{ textAlign: "end", minWidth: minWidth }} />
      ),
    },
    balance: {
      field: 'balance',
      label: 'Balance',
      header: ({ ...props }) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ balance }: Market) => {
        return <Text textAlign="end" minWidth={24} opacity={balance ? 1 : 0.5}>{`${balance?.toFixed(2)}`}</Text>
      },
    },
    borrowApy: {
      field: 'borrowApy',
      label: 'APR',
      tooltip: 'Annual Percentage Rate to borrow asset',
      header: ({ ...props }) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ borrowApy, monthlyBorrowFee, underlying, priceUsd }: Market) => (
        <AnchorPoolInfo apy={borrowApy} priceUsd={priceUsd} monthlyValue={monthlyBorrowFee} symbol={underlying.symbol} type="borrow" textProps={{ textAlign: "end", minWidth: 24 }} />
      ),
    },
  }
  cols.wallet = {
    ...cols.balance,
    label: 'Wallet',
  }
  return cols[colName];
}

export const AnchorSupplied = () => {
  const { chainId, library } = useWeb3React<Web3Provider>()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdSupply, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()
  const { prices } = usePrices()
  const { markets: accountMarkets } = useAccountMarkets()
  const { active } = useWeb3React()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<Market>()
  const [double, setDouble] = useState(false)
  const { XINV, XINV_V1, ESCROW, ESCROW_V1 } = getNetworkConfigConstants(chainId)

  const { withdrawalAmount: withdrawalAmount_v1 } = useEscrow(ESCROW_V1)
  const { withdrawalAmount } = useEscrow(ESCROW)

  const handleSupply = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  const invPriceUsd = prices['inverse-finance']?.usd||0;

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying, priceUsd } = market;

    const anTokenToTokenExRate = exchangeRates ? parseFloat(formatUnits(exchangeRates[token])) : 0;
    // balance of the "anchor" version of the token supplied
    const anTokenBalance = getParsedBalance(balances, token, underlying.decimals);
    // balance in undelying token
    const tokenBalance = anTokenBalance * anTokenToTokenExRate;
    
    const tokenBalanceInInv = getBalanceInInv(balances, token, exchangeRates, priceUsd, invPriceUsd, underlying.decimals);
    const monthlyInvRewards = getMonthlyRate(tokenBalanceInInv, market.rewardApy);
    const monthlyAssetRewards = getMonthlyRate(tokenBalance, market.supplyApy);

    const isCollateral = !!accountMarkets?.find((market: Market) => market?.token === token)

    return { ...market, balance: tokenBalance, isCollateral, monthlyInvRewards, monthlyAssetRewards }
  })

  const columns = [
    getColumn('asset', 32),
    getColumn('supplyApy', 24, invPriceUsd),
    getColumn('rewardApy', 24, invPriceUsd),
    getColumn('balance', 24),
    {
      field: 'isCollateral',
      label: 'Collateral',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={24} display={{ base: 'none', sm: 'flex' }} {...props} />,
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
        items={marketsWithBalance?.filter(
          ({ token, underlying, mintable }: Market) =>
            hasMinAmount(balances[token], underlying.decimals, exchangeRates[token])
            ||
            (
              token === XINV && !mintable &&
              hasMinAmount(withdrawalAmount, underlying.decimals, exchangeRates[token])
            )
            ||
            (
              token === XINV_V1 && !mintable &&
              hasMinAmount(withdrawalAmount_v1, underlying.decimals, exchangeRates[token])
            )
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
    const { token, underlying, borrowApy } = market;
    const balance = getParsedBalance(balances, token, underlying.decimals);
    const monthlyBorrowFee = getMonthlyRate(balance, borrowApy);
    return { ...market, balance, monthlyBorrowFee }
  })

  const columns = [
    getColumn('asset', 24),
    getColumn('borrowApy', 24),
    getColumn('balance', 24),
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

const AnchorSupplyContainer = ({ ...props }) => {
  return (
    <Container
      label="Supply"
      description="Earn interest on your deposits"
      href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
      {...props}
    />
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
    getColumn('asset', 32),
    getColumn('supplyApy', 20),
    getColumn('rewardApy', 24),
    getColumn('wallet', 24),
  ]

  if (isLoading || !markets) {
    return (
      <AnchorSupplyContainer>
        <SkeletonList />
      </AnchorSupplyContainer>
    )
  }

  const mintableMarkets = marketsWithBalance.filter(m => m.mintable);

  return (
    <AnchorSupplyContainer>
      <Table columns={columns} items={mintableMarkets} onClick={handleSupply} data-testid={TEST_IDS.anchor.supplyTable} />
      {modalAsset && <AnchorSupplyModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </AnchorSupplyContainer>
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
    getColumn('asset', 24),
    getColumn('borrowApy', 24),
    {
      field: 'liquidityUsd',
      label: 'Liquidity',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={24} {...props} />,
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
