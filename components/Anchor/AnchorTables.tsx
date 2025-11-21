import { Flex, Stack, HStack, Switch, Text, useDisclosure, FormControl, VStack } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { AnchorBorrowModal, AnchorCollateralModal, AnchorSupplyModal } from '@app/components/Anchor/AnchorModals'
import Container from '@app/components/common/Container'
import { SkeletonBlob, SkeletonList } from '@app/components/common/Skeleton'
import Table, { Column } from '@app/components/common/Table'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@app/hooks/useBalances'
import { useEscrow } from '@app/hooks/useEscrow'
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { useAccountMarkets, useMarkets } from '@app/hooks/useMarkets'
import { usePrices } from '@app/hooks/usePrices'
import { Market, Token } from '@app/types'
import { useWeb3React } from '@app/util/wallet'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { TEST_IDS } from '@app/config/test-ids'
import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem'
import { AnchorPoolInfo } from './AnchorPoolnfo'
import { dollarify, getBalanceInInv, getBnToNumber, getMonthlyRate, getParsedBalance, shortenNumber } from '@app/util/markets'
import { RTOKEN_CG_ID, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { useRouter } from 'next/router'
import { HAS_REWARD_TOKEN, OLD_XINV } from '@app/config/constants'
import { NotifBadge } from '@app/components/common/NotifBadge'
 
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { showToast } from '@app/util/notify'
import Link from '../common/Link'
import { isBefore, timeSince } from '@app/util/time'

const hasMinAmount = (amount: BigNumber | undefined, decimals: number, exRate: BigNumber, minWorthAccepted = 0.001): boolean => {
  if (amount === undefined) { return false }
  const bal = amount &&
    parseFloat(formatUnits(amount, decimals)) *
    parseFloat(formatUnits(exRate));
  return bal >= minWorthAccepted;
}

const isHighlightCase = (highlightInv: boolean, highlightDola: boolean, marketAd: string, underlying: Token) => {
  const isHighlightInv = highlightInv && marketAd === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN;
  const isHighlightDola = highlightDola && underlying.symbol === 'DOLA';
  return isHighlightInv || isHighlightDola;
}

const getColumn = (
  colName: 'asset' | 'supplyApy' | 'rewardApr' | 'borrowApy' | 'balance' | 'wallet' | 'supplyBalance' | 'borrowBalance',
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
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) ? 'secondary' : 'mainTextColor';
        const claimable = isBefore(claimableTime);
        return (
          <Stack position="relative" color={color} minWidth={minWidth} direction="row" align="center" data-testid={`${TEST_IDS.anchor.tableItem}-${underlying.symbol}`}>
            <UnderlyingItem
              Container={HStack}
              containerProps={{ position: 'relative', w: 'full' }}
              badge={
                !claimableAmount && token === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN ?
                  {
                    text: `STAKE ${RTOKEN_SYMBOL}`,
                    color: 'secondary',
                  }
                  : underlying.badge
              }
              textProps={{ color }}
              label={underlying.symbol}
              image={underlying.image}
              protocolImage={underlying.protocolImage}
              address={token}
            />
            {
              !!claimableAmount && claimableAmount > 0
              &&
              <NotifBadge alignItems="center" bgColor={claimable ? 'secondary' : '#ccc'}>
                {shortenNumber(claimableAmount, 2)}
                <AnimatedInfoTooltip iconProps={{ ml: '1', boxSize: '10px' }}
                  message={
                    claimable ?
                      `You can claim your withdrawn ${RTOKEN_SYMBOL} in the modal's withdraw tab`
                      : `You can claim your ${shortenNumber(claimableAmount, 2)} withdrawn ${RTOKEN_SYMBOL} ${timeSince(claimableTime)}`
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
      tooltip: <><Text fontWeight="bold">Annual Percentage Yield</Text><Text>Directly Increases the staked balance.</Text><Text>For Yield-Bearing assets, the increase is not visible on Inverse.</Text><Text>APY May vary over time</Text></>,
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ supplyApy, underlying, monthlyAssetRewards, priceUsd, token }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) ? 'secondary' : 'mainTextColor'
        return (
          <AnchorPoolInfo protocolImage={underlying.protocolImage} value={supplyApy} priceUsd={priceUsd} monthlyValue={monthlyAssetRewards} symbol={underlying.symbol} type={'supply'} textProps={{ textAlign: "end", color, minWidth: minWidth }} />
        )
      },
    },
    rewardApr: {
      field: 'rewardApr',
      label: 'Reward APR',
      tooltip: <>
        <Text fontWeight="bold">APR rewarded in {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} tokens</Text>
        <Text>Accrues {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} in a reward pool</Text>
        <Text>Total rewards near <b>Claim</b> button</Text>Reward APR May vary over time
      </>,
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ rewardApr, monthlyInvRewards, priceUsd, underlying }: Market) => (
        <AnchorPoolInfo value={rewardApr} priceUsd={priceUsd} isReward={true} monthlyValue={monthlyInvRewards} underlyingSymbol={underlying.symbol} symbol={RTOKEN_SYMBOL} type={'supply'} textProps={{ textAlign: "end", minWidth: minWidth }} />
      ),
    },
    balance: {
      field: 'balance',
      label: 'Balance',
      header: ({ ...props }) => <Flex justify="end" minWidth={minWidth} {...props} />,
      value: ({ balance, underlying, priceUsd, token }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) && (balance || 0) >= 0.01 ? 'secondary' : 'mainTextColor'
        return <AnchorPoolInfo isBalance={true} value={balance} priceUsd={priceUsd} symbol={underlying.symbol} type={'supply'} textProps={{ textAlign: "end", color, minWidth: minWidth }} />
      },
    },
    borrowApy: {
      field: 'borrowApy',
      label: 'APY',
      tooltip: <>
        <Text fontWeight="bold">Annual Percentage Yield</Text>
        <Text>Corresponds to how much your debt would increases in one year.</Text>
        <Text>The APY may vary over time.</Text>
      </>,
      header: ({ ...props }) => <Flex justify="end" minWidth={24} {...props} />,
      value: ({ borrowApy, monthlyBorrowFee, underlying, priceUsd, token }: Market) => {
        const color = isHighlightCase(highlightInv, highlightDola, token, underlying) ? 'secondary' : 'mainTextColor'
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
  const { exchangeRates } = useExchangeRatesV2()
  const { prices } = usePrices()

  const { markets: accountMarkets } = useAccountMarkets()
  const { isActive } = useWeb3React()
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

  const claims: { [key: string]: { withdrawalAmount?: BigNumber, withdrawalTime?: Date } } = {};
  if (XINV) {
    claims[XINV] = { withdrawalAmount, withdrawalTime }
  }
  if (XINV_V1) {
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
    const monthlyInvRewards = getMonthlyRate(tokenBalanceInInv, market.rewardApr);
    const monthlyAssetRewards = getMonthlyRate(tokenBalance, market.supplyApy);

    const isCollateral = !!accountMarkets?.find((market: Market) => market?.token === token)
    const usdWorth = tokenBalance * (prices && prices[underlying.coingeckoId!]?.usd || market.oraclePrice);

    const claimableAmount = !!claims[token] && !!claims[token]?.withdrawalAmount ? getBnToNumber(claims[token].withdrawalAmount, underlying.decimals) : 0;
    const claimableTime = !!claims[token] && !!claims[token]?.withdrawalAmount ? claims[token].withdrawalTime : 0;

    return { ...market, balance: tokenBalance, isCollateral, monthlyInvRewards, monthlyAssetRewards, usdWorth, claimableAmount, claimableTime }
  })

  const columns = [
    getColumn('asset', '180px', true),
    getColumn('supplyApy', 24),
    HAS_REWARD_TOKEN ? getColumn('rewardApr', 24) : null,
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
              <Switch size="sm" colorScheme="primary" isChecked={!!isCollateral} />
            </FormControl>
          </Stack>
        )
      },
    },
  ].filter(c => !!c);

  if (!isActive || (!usdSupplyCoingecko && !accountMarkets.find(m => m.collateralGuardianPaused))) {
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
          ({ token, underlying, mintable, collateralGuardianPaused, isCollateral }: Market) =>
            hasMinAmount(balances[token], underlying.decimals, exchangeRates[token], collateralGuardianPaused && isCollateral ? 0 : undefined)
            ||
            (
              token === XINV && !mintable &&
              hasMinAmount(withdrawalAmount, underlying.decimals, exchangeRates[token], collateralGuardianPaused && isCollateral ? 0 : undefined)
            )
            ||
            (
              token === XINV_V1 && !mintable &&
              hasMinAmount(withdrawalAmount_v1, underlying.decimals, exchangeRates[token], collateralGuardianPaused && isCollateral ? 0 : undefined)
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
  const { isActive } = useWeb3React()
  const { prices } = usePrices()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { usdBorrow, usdSupply, isLoading: accountLiquidityLoading } = useAccountLiquidity()
  const { balances, isLoading: balancesLoading } = useBorrowBalances()
  const { exchangeRates } = useExchangeRatesV2()
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
    return { ...market, balance, monthlyBorrowFee, usdWorth, underlying: { ...underlying, symbol: underlying.symbol.replace('-v1', '') } }
  })

  const columns = [
    getColumn('asset', '150px', false, true),
    getColumn('borrowApy', 20),
    getColumn('borrowBalance', 24),
  ]

  if (!isActive || !usdSupply) {
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
        <Flex w="full" justify="center" color="secondaryTextColor" fontSize="sm">
          You don't have any borrowed assets.
        </Flex>
      )}
      {modalAsset && <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}

const AnchorSupplyContainer = ({ paused = false, ...props }) => {
  const title = paused ? 'Supply - Paused or Deprecated Assets' : 'Supply'

  return (
    <Container
      label={title}
      description={paused ? undefined : 'Earn interest on your deposits'}
      href={paused ? undefined : process.env.NEXT_PUBLIC_SUPPLY_DOC_URL}
      headerProps={{
        direction: { base: 'column', md: 'row' },
        align: { base: 'flex-start', md: 'flex-end' },
      }}
      {...props}
    />
  )
}

// TODO: refacto components
export const AnchorSupply = ({ paused }: { paused?: boolean }) => {
  const { query } = useRouter()
  const { markets: marketsData, isLoading } = useMarkets()
  const { balances } = useAccountBalances()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deepLinkUsed, setDeepLinkUsed] = useState(false)
  const [modalAsset, setModalAsset] = useState<Market>()
  const [category, setCategory] = useState('all');

  const markets = marketsData.filter(m => !!m.underlying.isInPausedSection === paused);

  const handleSupply = (asset: Market, e: any) => {
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
    const { underlying, supplied, oraclePrice } = market;
    const balance = balances
      ? parseFloat(
        formatUnits(underlying.address ? (balances[underlying.address] || BigNumber.from('0')) : balances.CHAIN_COIN|| BigNumber.from('0'), underlying.decimals)
      )
      : 0
    const suppliedUsd = supplied * oraclePrice;
    return { ...market, balance, suppliedUsd }
  })

  const columns = [
    getColumn('asset', '180px', true),
    getColumn('supplyApy', 20, true),
    HAS_REWARD_TOKEN ? getColumn('rewardApr', 24) : null,
    {
      field: 'suppliedUsd',
      label: 'Supplied',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={24} {...props} />,
      tooltip: <Text>USD worth of the assets supplied</Text>,
      value: ({ suppliedUsd, token, underlying }: Market) => {
        const color = isHighlightCase(true, false, token, underlying) ? 'secondary' : 'mainTextColor'
        return (
          <Text textAlign="end" minWidth={24} color={color}>
            {
              suppliedUsd
                ? shortenNumber(suppliedUsd, 2, true)
                : '-'
            }
          </Text>
        )
      },
    },
    getColumn('wallet', 24, true),
  ].filter(c => !!c);

  if (isLoading || !marketsData) {
    return (
      <AnchorSupplyContainer
        paused={paused}
      >
        <SkeletonList />
      </AnchorSupplyContainer>
    )
  }

  const mintableMarkets = marketsWithBalance
    .filter(m => m.mintable)
    .filter(m => {
      if (category === 'yield') {
        return !!m.underlying.protocolImage;
      } else if (category === 'popular') {
        return m.suppliedUsd > 1000000
          || ['WBTC', 'ETH', 'stETH', 'xSUSHI', 'INV', 'DOLA', 'YFI'].includes(m.underlying.symbol);
      } else if (category === 'new') {
        return m.underlying?.badge?.text === 'NEW';
      } else if (category === 'inv') {
        return /inv|dola/i.test(m.underlying?.symbol);
      }
      return true;
    });

  mintableMarkets.sort((a, b) => (a.underlying.order ?? 1000) - (b.underlying.order ?? 1000));

  return (
    <AnchorSupplyContainer
      paused={paused}
      right={<RadioCardGroup
        wrapperProps={{ mt: { base: '2' }, overflow: 'auto', maxW: '90vw' }}
        group={{
          name: 'bool',
          defaultValue: category,
          onChange: (v) => { setCategory(v) },
        }}
        radioCardProps={{
          w: 'fit-content',
          textAlign: 'center',
          px: { base: '2', md: '3' },
          py: '1',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}
        options={[
          { label: 'All', value: 'all' },
          { label: 'INV/DOLA', value: 'inv' },
          { label: 'Popular', value: 'popular' },
          { label: 'Yield-Bearing', value: 'yield' },
          // { label: 'New', value: 'new' },
        ]}
      />}
    >
      <Table columns={columns} items={mintableMarkets} defaultSort={null} keyName="token" onClick={handleSupply} data-testid={TEST_IDS.anchor.supplyTable} />
      {modalAsset && <AnchorSupplyModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </AnchorSupplyContainer>
  )
}

export const AnchorBorrow = ({ paused, modalOnly }: { paused?: boolean, modalOnly?: boolean }) => {
  const { query } = useRouter()
  const { markets: marketsData, isLoading } = useMarkets()
  const { prices } = usePrices()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deepLinkUsed, setDeepLinkUsed] = useState(false)
  const [modalAsset, setModalAsset] = useState<Market>()

  const handleBorrow = (asset: Market) => {
    setModalAsset(asset)
    onOpen()
  }

  const markets = marketsData.filter(m => !!m.underlying.isInPausedSection === paused);

  useEffect(() => {
    const triggerAction = ({ detail }) => {
      const market = marketsData.find(m => m.underlying.symbol.toLowerCase() === detail.market.toLowerCase());
      if (!market?.borrowable) {
        showToast({ status: 'info', description: `${market?.underlying.symbol} is not Borrowable at the moment` })
        return
      }
      handleBorrow(market);
    }
    document.addEventListener('open-anchor-borrow', triggerAction)
    return () => {
      document.removeEventListener('open-anchor-borrow', triggerAction, false);
    }
  }, [marketsData])

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
    return { ...market, liquidityUsd, underlying: { ...underlying, symbol: underlying.symbol.replace('-v1', '') } };
  });

  const columns = [
    getColumn('asset', '150px', false, true),
    getColumn('borrowApy', 20, false, true),
    {
      field: 'liquidityUsd',
      label: 'Liquidity',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={24} {...props} />,
      value: ({ liquidityUsd, token, underlying }: Market) => {
        const color = isHighlightCase(false, true, token, underlying) ? 'secondary' : 'mainTextColor'
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

  const title = paused ? 'Borrow - Paused or Deprecated Assets' : 'Borrow'

  if (isLoading || !marketsData) {
    return (
      <Container
        label={title}
        description="Borrow against your supplied collateral"
        href={process.env.NEXT_PUBLIC_BORROW_DOC_URL}
      >
        <SkeletonList />
      </Container>
    )
  }

  if (modalOnly) {
    if (!modalAsset) { return <></> }
    return <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />;
  }

  return (
    <Container
      label={title}
      description="Borrow against your supplied collateral"
      href={process.env.NEXT_PUBLIC_BORROW_DOC_URL}
    >
      <Table noDataMessage={
        <VStack alignItems="flex-start">
            <Text>DOLA borrowing is now available on our new protocol!</Text>
            <Link textDecoration="underline" href="/firm">Borrow DOLA on FiRM</Link>
        </VStack>
      } columns={columns} keyName="token" items={marketsWithUsdLiquidity.filter(({ borrowable }: Market) => borrowable)} onClick={handleBorrow} data-testid={TEST_IDS.anchor.borrowTable} />
      {modalAsset && <AnchorBorrowModal isOpen={isOpen} onClose={onClose} asset={modalAsset} />}
    </Container>
  )
}
