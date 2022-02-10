import { Flex, Stack, Switch, Text, useDisclosure, FormControl } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { AnchorBorrowModal, AnchorCollateralModal, AnchorSupplyModal } from '@app/components/Anchor/AnchorModals'
import Container from '@app/components/common/Container'
import { SkeletonBlob, SkeletonList } from '@app/components/common/Skeleton'
import Table, { Column } from '@app/components/common/Table'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@app/hooks/useBalances'
import { useEscrow } from '@app/hooks/useEscrow'
import { useExchangeRates } from '@app/hooks/useExchangeRates'
import { useAccountMarkets, useMarkets } from '@app/hooks/useMarkets'
import { usePrices } from '@app/hooks/usePrices'
import { Market, Token } from '@app/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { TEST_IDS } from '@app/config/test-ids'
import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem'
import { AnchorPoolInfo } from './AnchorPoolnfo'
import { dollarify, getBalanceInInv, getBnToNumber, getMonthlyRate, getParsedBalance, shortenNumber } from '@app/util/markets'
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import { useRouter } from 'next/router'
import { OLD_XINV } from '@app/config/constants'
import { NotifBadge } from '@app/components/common/NotifBadge'
import moment from 'moment'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'

const hasMinAmount = (amount: BigNumber | undefined, decimals: number, exRate: BigNumber, minWorthAccepted = 0.01): boolean => {
  if (amount === undefined) { return false }
  return amount &&
    parseFloat(formatUnits(amount, decimals)) *
    parseFloat(formatUnits(exRate)) >=
    minWorthAccepted;
}

const isHighlightCase = (highlightInv: boolean, highlightDola: boolean, marketAd: string, underlying: Token) => {
  const isHighlightInv = highlightInv && marketAd === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN;
  const isHighlightDola = highlightDola && underlying.symbol === 'DOLA';
  return isHighlightInv || isHighlightDola;
}

const getColumn = (
  colName: 'asset' | 'supplyApy' | 'rewardApy' | 'borrowApy' | 'balance' | 'wallet' | 'supplyBalance' | 'borrowBalance',
  minWidth = 24,
  highlightInv = false,
  highlightDola = false,
): Column => {
  const cols: { [key: string]: Column } = {
    asset: {
      field: 'symbol',
      label: 'Asset',
      header: ({ ...props }) => <Flex minWidth={minWidth} {...props} />,
      value: ({ token, underlying, claimableAmount, claimableTime }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) ? 'secondary' : 'white';
        const claimable = moment(claimableTime).isBefore(moment());
        return (
          <Stack position="relative" color={color} minWidth={minWidth} direction="row" align="center" data-testid={`${TEST_IDS.anchor.tableItem}-${underlying.symbol}`}>
            <UnderlyingItem textProps={{ color }} label={underlying.symbol} image={underlying.image} address={token} />
            {
              !!claimableAmount && claimableAmount > 0
              &&

              <NotifBadge alignItems="center" bgColor={claimable ? 'secondary' : '#ccc'}>
                {shortenNumber(claimableAmount, 2)}
                <AnimatedInfoTooltip iconProps={{ ml: '1', boxSize: '10px' }}
                  message={
                    claimable ?
                      "You can claim your withdrawn INV in the modal's withdraw tab"
                      :  `You can claim your ${shortenNumber(claimableAmount, 2)} withdrawn INV ${moment(claimableTime).fromNow()}`
                  }
                />
              </NotifBadge>

            }
          </Stack>
        )
      },
    },
    supplyApy: {
      field: 'supplyApy',
      label: 'APY',
      tooltip: <><Text fontWeight="bold">Annual Percentage Yield</Text><Text>Increases the staked balance</Text>APY May vary over time</>,
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ supplyApy, underlying, monthlyAssetRewards, priceUsd, token }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) ? 'secondary' : 'white'
        return (
          <AnchorPoolInfo value={supplyApy} priceUsd={priceUsd} monthlyValue={monthlyAssetRewards} symbol={underlying.symbol} type={'supply'} textProps={{ textAlign: "end", color, minWidth: minWidth }} />
        )
      },
    },
    rewardApy: {
      field: 'rewardApy',
      label: 'Reward APY',
      tooltip: <>
        <Text fontWeight="bold">APY rewarded in {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} tokens</Text>
        <Text>Accrues {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} in a reward pool</Text>
        <Text>Total rewards near <b>Claim</b> button</Text>Reward APY May vary over time
      </>,
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ rewardApy, monthlyInvRewards, priceUsd, underlying }: Market) => (
        <AnchorPoolInfo value={rewardApy} priceUsd={priceUsd} isReward={true} monthlyValue={monthlyInvRewards} underlyingSymbol={underlying.symbol} symbol="INV" type={'supply'} textProps={{ textAlign: "end", minWidth: minWidth }} />
      ),
    },
    balance: {
      field: 'balance',
      label: 'Balance',
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ balance, underlying, priceUsd, token }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) && (balance || 0) >= 0.01 ? 'secondary' : 'white'
        return <AnchorPoolInfo isBalance={true} value={balance} priceUsd={priceUsd} symbol={underlying.symbol} type={'supply'} textProps={{ textAlign: "end", color, minWidth: minWidth }} />
      },
    },
    borrowApy: {
      field: 'borrowApy',
      label: 'APR',
      tooltip: <>
        <Text fontWeight="bold">Annual Percentage Rate</Text>
        <Text>Corresponds to how much your debt would increases in one year.</Text>
        <Text>The APR may vary over time.</Text>
      </>,
      header: ({ ...props }) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ borrowApy, monthlyBorrowFee, underlying, priceUsd, token }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) ? 'secondary' : 'white'
        return (
          <AnchorPoolInfo value={borrowApy} priceUsd={priceUsd} monthlyValue={monthlyBorrowFee} symbol={underlying.symbol} type="borrow" textProps={{ textAlign: "end", color, minWidth: 24 }} />
        )
      },
    },
  }
  cols.supplyBalance = {
    ...cols.balance,
    field: 'usdWorth',
    tooltip: 'Equals the Supplied amount plus the generated supply Interests over time',
  }
  cols.borrowBalance = {
    ...cols.balance,
    field: 'usdWorth',
    label: 'Debt',
    tooltip: <Text>
      Your <b>Debt</b> equals to the <b>Borrowed Amount plus the generated borrow Interests</b> over time.
    </Text>,
    value: ({ balance, underlying, priceUsd }: Market) => {
      return <AnchorPoolInfo isBalance={true} value={balance} priceUsd={priceUsd} symbol={underlying.symbol} type={'borrow'} textProps={{ textAlign: "end", minWidth: minWidth }} />
    },
  }
  cols.wallet = {
    ...cols.balance,
    tooltip: undefined,
    label: 'Wallet',
  }
  return cols[colName];
}

export const AnchorSupplied = () => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdSupplyCoingecko, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()
  const { prices } = usePrices()

  const { markets: accountMarkets } = useAccountMarkets()
  const { active } = useWeb3React()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isCollateralOpen, onOpen: onCollateralOpen, onClose: onCollateralClose } = useDisclosure()
  const [modalAsset, setModalAsset] = useState<Market>()
  const [double, setDouble] = useState(false)
  const { XINV, XINV_V1, ESCROW, ESCROW_OLD } = getNetworkConfigConstants(chainId)

  const { withdrawalAmount: withdrawalAmount_v1, withdrawalTime: withdrawalTime_v1 } = useEscrow(ESCROW_OLD)
  const { withdrawalAmount, withdrawalTime } = useEscrow(ESCROW)

  const handleSupply = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  const invPriceUsd = prices[RTOKEN_CG_ID]?.usd || 0;

  const claims = {
    [XINV]: { withdrawalAmount, withdrawalTime },
  }
  if(XINV_V1) {
    claims[XINV_V1] = { withdrawalAmount: withdrawalAmount_v1, withdrawalTime: withdrawalTime_v1 };
  }

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
    const usdWorth = tokenBalance * (prices && prices[underlying.coingeckoId!]?.usd || market.oraclePrice);

    const claimableAmount = !!claims[token] && !!claims[token]?.withdrawalAmount ? getBnToNumber(claims[token].withdrawalAmount, underlying.decimals) : 0;
    const claimableTime = !!claims[token] && !!claims[token]?.withdrawalAmount ? claims[token].withdrawalTime : 0;

    return { ...market, balance: tokenBalance, isCollateral, monthlyInvRewards, monthlyAssetRewards, usdWorth, claimableAmount, claimableTime }
  })

  const columns = [
    getColumn('asset', 32),
    getColumn('supplyApy', 24),
    getColumn('rewardApy', 24),
    getColumn('supplyBalance', 24),
    {
      field: 'isCollateral',
      label: 'Collateral',
      tooltip: 'If enabled, your asset will be used as collateral to increase your borrow capacity. Collaterals can be liquidated if the borrow limit reaches 100%.',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={24} {...props} />,
      value: (market: Market) => {
        const { isCollateral } = market;
        return (
          <Stack cursor="default" minWidth={24} direction="row" align="center"
            onClick={async (e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              if (!e.target.className.includes("switch")) { return }
              if (!double) {
                setDouble(true)
                setModalAsset(market);
                onCollateralOpen();
                setDouble(false);
              }
            }}
          >
            <FormControl w='full' justifyContent="flex-end" display='flex' alignItems='center'>
              <Switch size="sm" colorScheme="purple" isChecked={!!isCollateral} />
            </FormControl>
          </Stack>
        )
      },
    },
  ]

  if (!active || !usdSupplyCoingecko) {
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
    <Container
      label={`${usdSupplyCoingecko ? (usdSupplyCoingecko >= 0.01 ? dollarify(usdSupplyCoingecko, 2) : 'Less than $0.01 supplied') : '$0'}`}
      description="Your supplied assets">
      <Table
        keyName="token"
        defaultSort="usdWorth"
        defaultSortDir="desc"
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
      {modalAsset && <AnchorCollateralModal isOpen={isCollateralOpen} onClose={onCollateralClose} asset={modalAsset} />}
    </Container>
  )
}

export const AnchorBorrowed = () => {
  const { active } = useWeb3React()
  const { prices } = usePrices()
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
    const usdWorth = balance * (prices && prices[underlying.coingeckoId!]?.usd || 0);
    return { ...market, balance, monthlyBorrowFee, usdWorth }
  })

  const columns = [
    getColumn('asset', 16),
    getColumn('borrowApy', 20),
    getColumn('borrowBalance', 24),
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
      label={`${usdBorrow ? (usdBorrow >= 0.01 ? dollarify(usdBorrow, 2) : 'Less than $0.01 debt') : '$0'}`}
      description="Your borrowed assets"
    >
      {usdBorrow ? (
        <Table
          keyName="token"
          defaultSort="usdWorth"
          defaultSortDir="desc"
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

// TODO: refacto components
export const AnchorSupply = () => {
  const { query } = useRouter()
  const { markets, isLoading } = useMarkets()
  const { balances } = useAccountBalances()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deepLinkUsed, setDeepLinkUsed] = useState(false)
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleSupply = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  const handleExternalOpen = (marketName: string, markets: Market[]) => {
    const market = markets.filter(m => m.token !== OLD_XINV).find(m => m.underlying.symbol.toLowerCase() === marketName.toLowerCase());
    
    if (!market?.mintable) { return }
    setDeepLinkUsed(true);
    handleSupply(market);
  }

  useEffect(() => {
    const triggerAction = ({ detail }) => {
      handleExternalOpen(detail.market, markets);
    }
    document.addEventListener('open-anchor-supply', triggerAction)
    return () => {
      document.removeEventListener('open-anchor-supply', triggerAction, false);
    }
  }, [markets])

  useEffect(() => {
    if (!deepLinkUsed && markets?.length && query?.market && query?.marketType === 'supply') {
      handleExternalOpen(query.market!.toLowerCase(), markets)
    }
  }, [query, markets, deepLinkUsed])

  const marketsWithBalance = markets?.map((market) => {
    const { underlying } = market;
    const balance = balances
      ? parseFloat(
        formatUnits(underlying.address ? (balances[underlying.address] || BigNumber.from('0')) : balances.CHAIN_COIN, underlying.decimals)
      )
      : 0
    return { ...market, balance }
  })

  const columns = [
    getColumn('asset', 32, true),
    getColumn('supplyApy', 20, true),
    getColumn('rewardApy', 24),
    getColumn('wallet', 24, true),
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
      <Table columns={columns} items={mintableMarkets} keyName="token" defaultSortDir="desc" defaultSort="supplyApy" onClick={handleSupply} data-testid={TEST_IDS.anchor.supplyTable} />
      {modalAsset && <AnchorSupplyModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </AnchorSupplyContainer>
  )
}

export const AnchorBorrow = () => {
  const { query } = useRouter()
  const { markets, isLoading } = useMarkets()
  const { prices } = usePrices()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deepLinkUsed, setDeepLinkUsed] = useState(false)
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleBorrow = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  useEffect(() => {
    if (!deepLinkUsed && markets?.length && query?.market && query?.marketType === 'borrow') {
      const market = markets.filter(m => m.token !== OLD_XINV).find(m => m.underlying.symbol.toLowerCase() === query.market!.toLowerCase());
      if (!market?.borrowable) { return }
      setDeepLinkUsed(true);
      handleBorrow(market);
    }
  }, [query, markets, deepLinkUsed])

  const marketsWithUsdLiquidity = markets?.map((market) => {
    const { underlying, liquidity } = market;
    const liquidityUsd = liquidity && prices ? liquidity * (prices[underlying?.coingeckoId]?.usd || 1) : 0;
    return { ...market, liquidityUsd };
  });

  const columns = [
    getColumn('asset', 16, false, true),
    getColumn('borrowApy', 20, false, true),
    {
      field: 'liquidityUsd',
      label: 'Liquidity',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={24} {...props} />,
      value: ({ liquidityUsd, token, underlying }: Market) => {
        const color = isHighlightCase(false, true, token, underlying) ? 'secondary' : 'white'
        return (
          <Text textAlign="end" minWidth={24} color={color}>
            {
              liquidityUsd
                ? shortenNumber(liquidityUsd, 2, true)
                : '-'
            }
          </Text>
        )
      },
    },
  ]

  if (isLoading || !markets) {
    return (
      <Container
        label="Borrow"
        description="Borrow against your supplied collateral"
        href={process.env.NEXT_PUBLIC_SUPPLY_DOC_URL}
      >
        <SkeletonList />
      </Container>
    )
  }

  return (
    <Container
      label="Borrow"
      description="Borrow against your supplied collateral"
      href={process.env.NEXT_PUBLIC_BORROW_DOC_URL}
    >
      <Table columns={columns} keyName="token" items={marketsWithUsdLiquidity.filter(({ borrowable }: Market) => borrowable)} onClick={handleBorrow} data-testid={TEST_IDS.anchor.borrowTable} />
      {modalAsset && <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}
