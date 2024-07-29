import { Badge, Divider, Flex, HStack, Stack, Text, useMediaQuery, VStack, Image, PopoverBody, Popover, PopoverTrigger, PopoverContent } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useAccountF2Markets, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
import { useRouter } from 'next/router';
import { useAccount } from '@app/hooks/misc';
import { getRiskColor } from "@app/util/f2";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import Table from "@app/components/common/Table";
import { useFirmTVL } from "@app/hooks/useTVL";
import { AnchorPoolInfo } from "../Anchor/AnchorPoolnfo";
import { OracleType, OracleTypeTooltipContent } from "./Infos/OracleType";
import { SkeletonList } from "@app/components/common/Skeleton";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { gaEvent } from "@app/util/analytics";
import { DailyLimitCountdown } from "@app/components/common/Countdown";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { SafetyBadges } from "./SecurityMiniCaroussel";
import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";
import { SplashedText } from "../common/SplashedText";
import { lightTheme } from "@app/variables/theme";
import { useState } from "react";
import Link from "../common/Link";


export const MARKET_INFOS = {
    'INV': {
        name: 'INV',
        fullname: 'Inverse DAO',
        description: 'The Governance token of the Inverse Finance DAO, staking it prevents from being diluted if new tokens are minted and the stakers also get real-yield with DBR rewards.',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68',
    },
    'WETH': {
        name: 'WETH',
        fullname: 'Wrapped ETH',
        description: 'In this market you can use ETH or Wrapped ETH',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
    'sFRAX': {
        name: 'sFRAX',
        fullname: 'Staked FRAX',
        description: 'sFRAX is an ERC4626 staking vault that distributes part of the Frax Protocol yield weekly to stakers denominated in FRAX stablecoins.',
        getLink: 'https://app.frax.finance/sfrax/stake',
    },
    'DAI': {
        name: 'DAI',
        fullname: 'Dai Stablecoin',
        description: 'When DAI is deposited on FiRM it is automatically staked in the DAI Savings Rate contract to benefit from the yield, the staked version of DAI is known as sDAI.',
        getLink: 'https://app.spark.fi/',
    },
    'CVX': {
        name: 'CVX',
        fullname: 'Convex Token',
        description: 'CVX is the native platform token for Convex Finance',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
    },
    'cvxCRV': {
        name: 'cvxCRV',
        fullname: 'Convex CRV',
        description: 'Stake the CRV token to get cvxCRV, when deposited on FiRM you still get all the rewards of cvxCRV',
        getLink: 'https://curve.convexfinance.com/stake',
    },
    'cvxFXS': {
        name: 'cvxFX',
        fullname: 'Convex FXS',
        description: 'Stake the FXS (Frax Share token) to get cvxFXS, when deposited on FiRM you still get all the rewards of cvxFXS',
        getLink: 'https://frax.convexfinance.com/stake',
    },
    'CRV': {
        name: 'CRV',
        fullname: 'Curve Token',
        description: 'CRV is the native platform token for Curve Finance',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xd533a949740bb3306d119cc777fa900ba034cd52',
    },
    'stETH': {
        name: 'stETH',
        fullname: 'Staked ETH',
        description: 'Liquid staked ETH by Lido, rebasing token',
        getLink: 'https://stake.lido.fi/',
    },
    'wstETH': {
        name: 'wstETH',
        fullname: 'Wrapped Staked ETH',
        description: 'Wrapped version of stETH with no rebasing',
        getLink: 'https://stake.lido.fi/wrap',
    },
    'st-yETH': {
        name: 'st-yETH',
        fullname: 'Staked yETH',
        description: 'Staked version of yETH, a user-governed liquidity pool token consisting of various Ethereum Liquid Staking Derivatives (LSTs), by Yearn',
        getLink: 'https://yeth.yearn.fi/',
    },
    'st-yCRV': {
        name: 'st-yCRV',
        fullname: 'Staked yCRV',
        description: "Staked version of yCRV, which is Yearn's veCRV yLocker product. It is designed to tokenize the different benefits of a veCRV position in a simple, user-friendly way",
        getLink: 'https://ycrv.yearn.fi/app/deposit'
    },
    'WBTC': {
        name: 'WBTC',
        fullname: 'Wrapped Bitcoin',
        description: 'Wrapped “There is no second best”',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    'gOHM': {
        name: 'gOHM',
        fullname: 'Governance OHM',
        description: 'gOHM, or Governance OHM, is an ERC-20 token that is the only token used for proposing upgrades to Olympus protocol. gOHM can be obtained by wrapping OHM, and vice versa. The only use cases of gOHM today is for voting in governance and as collateral to take a Cooler Loan.',
        getLink: 'https://app.olympusdao.finance/#/my-balances',
    },
    'COMP': {
        name: 'COMP',
        fullname: 'Compound Finance',
        description: 'COMP is the native platform token for Compound Finance, when depositing COMP on FiRM you keep your Governance Rights thanks to the Personal Collateral Escrow design.',
        getLink: 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&tab=swap&to=0xc00e94cb662c3520282e6f5717214004a7f26888',
    },
    'sUSDe': {
        name: 'sUSDe',
        fullname: 'Staked sUSDe',
        description: 'sUSDe is staked USDe which is a synthetic stablecoin by etherfi, backed with crypto assets and corresponding short futures positions.',
        getLink: 'https://app.ethena.fi/stake',
    },
}

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

export const MarketInfos = ({ name, nameAndIcon, ...props }) => {
    const marketInfos = MARKET_INFOS[name];
    if (!marketInfos) {
        return null;
    }
    return <VStack py="4" px="4" cursor="default" w='full' alignItems="flex-start" {...props}>
        <HStack spacing="4" alignItems="center" justify="flex-start" w='full'>
            <Stack>
                {nameAndIcon}
            </Stack>
            <Text>-</Text>
            <Text fontSize="18px" fontWeight="extrabold">{marketInfos.fullname}</Text>
        </HStack>
        <Text fontSize="16px" color="mainTextColorLight">{marketInfos.description}</Text>
        <Link fontSize="14px" textDecoration="underline" href={marketInfos.getLink} isExternal target="_blank">
            Get {name} <ExternalLinkIcon />
        </Link>
    </VStack>
}

export const MarketNameAndIcon = ({ marketIcon, icon, underlying, name }) => {
    return <HStack justify="flex-start" alignItems="center" spacing="2" w='full'>
        <BigImageButton bg={`url('${marketIcon || icon || underlying.image}')`} h="25px" w="25px" backgroundSize='contain' backgroundRepeat="no-repeat" />
        <CellText fontWeight="bold" fontSize={{ base: '18px', '2xl': '20px' }}>{name}</CellText>
    </HStack>
}

const MarketCell = ({ icon, marketIcon, underlying, badgeInfo, badgeProps, name }) => {
    const [isSmallerThan] = useMediaQuery(`(max-width: ${responsiveThreshold}px)`);
    const nameAndIcon = <MarketNameAndIcon name={name} icon={icon} marketIcon={marketIcon} underlying={underlying} />
    return <Cell minWidth="110px" position="relative">
        <Popover closeOnBlur={true} trigger="hover" isLazy placement="right-end" strategy={isSmallerThan ? 'fixed' : 'absolute'}>
            <PopoverTrigger>
                <Cell minWidth='110px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <HStack onClick={(e) => e.stopPropagation()} spacing="1" w="fit-content">
                        {nameAndIcon}<InfoIcon cursor="default" position="absolute" right="-18px" opacity="0.5" color="mainTextColor" />
                    </HStack>
                    {
                        !!badgeInfo && <CellText fontWeight="bold">
                            <Badge fontWeight="normal"
                                textTransform="none"
                                borderRadius="50px"
                                px="8px"
                                {...badgeProps}>
                                {badgeInfo}
                            </Badge>
                        </CellText>
                    }
                </Cell>
            </PopoverTrigger>
            <PopoverContent transform="translateX(300px)" bgColor="containerContentBackground" zIndex="99" border="1px solid #ccc" _focus={{ outline: 'none' }} maxW={isSmallerThan ? '100vw' : '98vw'} w='600px'>
                <PopoverBody>
                    <MarketInfos nameAndIcon={nameAndIcon} name={name} />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    </Cell>
}

const columns = [
    {
        field: 'name',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-start"  {...props} />,
        tooltip: 'Market type, each market have an underlying token and strategy',
        value: (props) => {
            return <MarketCell {...props} />
        },
    },
    {
        field: 'supplyApy',
        label: 'Underlying APY',
        tooltip: 'The APY provided by the asset itself (or via its claimable rewards) and that is kept even after supplying. This is not an additional APY from FiRM',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="center"  {...props} />,
        value: ({ supplyApy, supplyApyLow, extraApy, price, underlying, hasClaimableRewards, isInv, rewardTypeLabel }) => {
            return <Cell spacing="0" direction="column" minWidth="140px" alignItems="center" justify="center" fontSize="14px">
                <AnchorPoolInfo
                    protocolImage={underlying.protocolImage}
                    value={supplyApy}
                    valueExtra={extraApy}
                    valueLow={supplyApyLow}
                    priceUsd={price}
                    symbol={underlying.symbol}
                    type={'supply'}
                    textProps={{ textAlign: "end" }}
                    hasClaimableRewards={hasClaimableRewards}
                />
                {
                    supplyApy > 0 && <Text fontSize="12px" color="mainTextColorLight2">
                        {rewardTypeLabel || (isInv ? 'INV + DBR APR' : hasClaimableRewards ? 'Claimable APR' : 'Rebase APY')}
                    </Text>
                }
            </Cell>
        },
    },
    {
        field: 'oracleType',
        label: 'Oracle Type',
        tooltip: <OracleTypeTooltipContent />,
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="center"  {...props} />,
        value: ({ oracleType, underlying }) => {
            return <Cell alignItems="center" minWidth="110px" justify="center" fontSize="12px">
                <OracleType showTooltip={true} showImage={false} oracleType={oracleType} subText={underlying.symbol === 'gOHM' ? 'index' : undefined} />
            </Cell>
        },
    },
    // {
    //     field: 'price',
    //     label: 'price',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ price }) => {
    //         return <Cell minWidth="100px" justify="center" >
    //             <CellText>${commify((price||0)?.toFixed(2))}</CellText>
    //         </Cell>
    //     },
    // },
    {
        field: 'collateralFactor',
        label: 'CF',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        tooltip: 'Collateral Factor: maximum percentage of collateral value that can be used for borrowing',
        value: ({ collateralFactor }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CellText>{shortenNumber(collateralFactor * 100, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'tvl',
        label: 'TVL',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        tooltip: 'Total Value Locked',
        value: ({ tvl }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText>{tvl > 0 ? shortenNumber(tvl, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'totalDebt',
        label: 'Borrows',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        tooltip: 'Total DOLA borrowed in the Market',
        value: ({ totalDebt, borrowPaused }) => {
            return <Cell minWidth="80px" justify="center" >
                <CellText>{!totalDebt ? '-' : smartShortNumber(totalDebt, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaLiquidity',
        label: 'DOLA Liquidity',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Remaining borrowable DOLA liquidity, not taking into account daily limits',
        value: ({ dolaLiquidity, borrowPaused }) => {
            return <Cell minWidth="120px" justify="center" >
                <CellText>{borrowPaused || dolaLiquidity < 1 ? '-' : smartShortNumber(dolaLiquidity, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'leftToBorrow',
        label: "Available to borrow",
        header: ({ ...props }) => <ColHeader minWidth="135px" justify="center"  {...props} />,
        tooltip: 'Markets can have daily borrow limits, this shows the DOLA left to borrow for the day (UTC timezone)',
        value: ({ leftToBorrow, totalDebt, dailyLimit, dolaLiquidity, borrowPaused }) => {
            return <Cell minWidth="135px" justify="center" alignItems="center" direction="column" spacing="0" >
                {
                    borrowPaused ? <CellText>Borrow Paused</CellText> : <>
                        <CellText>{leftToBorrow > 1 ? smartShortNumber(leftToBorrow, 2) : totalDebt ? 'Depleted' : 'No liquidity'}</CellText>
                        {
                            leftToBorrow < dailyLimit && dolaLiquidity > 0 && leftToBorrow < dolaLiquidity && smartShortNumber(dolaLiquidity, 2) !== smartShortNumber(leftToBorrow, 2)
                            && <CellText overflow="visible" whiteSpace="nowrap" minW="130px" textAlign={{ base: 'right', sm: 'left' }} fontSize={{ base: '10px', sm: '12px' }} color="mainTextColorLight2">
                                <DailyLimitCountdown prefix="Limit resets in " />
                            </CellText>
                        }
                    </>
                }
            </Cell>
        },
    },
    // {
    //     field: 'collateralBalance',
    //     label: 'Wallet',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     tooltip: 'Collateral balance in your wallet',
    //     value: ({ collateralBalance, price, account }) => {
    //         return <Cell minWidth="100px" justify="center" alignItems="center" direction={{ base: 'row', sm: 'column' }} spacing={{ base: '1', sm: '0' }}>
    //             {
    //                 account && collateralBalance > 0 ? <>
    //                     <CellText>{shortenNumber(collateralBalance, 2)}</CellText>
    //                     <CellText>({shortenNumber(collateralBalance * price, 2, true)})</CellText>
    //                 </> : <>-</>
    //             }
    //         </Cell>
    //     },
    // },
    {
        field: 'depositsUsd',
        label: 'Your Deposits',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of Collateral you deposited in the Market',
        value: ({ depositsUsd, deposits, account, collateralBalance, collateralBalanceUsd, underlying }) => {
            return <Cell minWidth="120px" justify="center" alignItems="center" direction={{ base: 'row', sm: 'column' }} spacing={{ base: '1', sm: '0' }}>
                {
                    account && collateralBalanceUsd > 1 && <Badge display={{ base: 'none', xl: 'inline-block' }} bgColor="mainTextColor" color="contrastMainTextColor" position="absolute" top="-4.5px" textTransform="none">
                        {shortenNumber(collateralBalance, 2)} {underlying.symbol} available in your wallet
                    </Badge>
                }
                {
                    account && deposits > 0 ? <>
                        <CellText>{smartShortNumber(deposits, 2)}</CellText>
                        <CellText>({smartShortNumber(depositsUsd, 2, true)})</CellText>
                    </> : <>-</>
                }
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Your Debt',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA you borrowed from the Market',
        value: ({ debt, account }) => {
            return <Cell minWidth="80px" justify="center">
                <CellText>{account && debt > 0 ? smartShortNumber(debt, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Your Borrow Limit',
        header: ({ ...props }) => <ColHeader minWidth="116px" justify="flex-end"  {...props} />,
        tooltip: 'Your Borrow Limit, should not reach 160%, otherwise liquidations can happen',
        value: ({ perc, debt }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="110px" justify="flex-end" >
                <CellText color={debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(100 - perc, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

const columnsWithout = columns.slice(0, 9);

const firmImages = {
    'dark': 'firm-final-logo-white.png',
    'light': 'firm-final-logo.png',
}

const responsiveThreshold = 1260;

export const F2Markets = ({
    isDashboardPage = false
}: {
    isDashboardPage?: boolean
}) => {
    const { markets } = useDBRMarkets();
    const account = useAccount();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const router = useRouter();
    const { firmTvls, isLoading: tvlLoading } = useFirmTVL();
    const { themeStyles, themeName } = useAppTheme();
    const [showMyPositions, setShowMyPositions] = useState(true);
    const [showOther, setShowOther] = useState(true);
    const [isSmallerThan] = useMediaQuery(`(max-width: ${responsiveThreshold}px)`);

    const isLoading = tvlLoading || !markets?.length;

    const openMarket = (market: any) => {
        gaEvent({ action: `FiRM-list-open-market-${market.name}` });
        const newPath = router.asPath.replace(router.pathname, `/firm/${market.name}`);
        router.push(newPath);
    }

    // hide phasing out markets if user has no debt or deposits in it
    const accountMarketsWithoutPhasingOutMarkets = accountMarkets
        .filter(m => !m.isPhasingOut || (m.debt > 0 || (m.deposits * m.price) >= 1));

    const withDeposits = accountMarketsWithoutPhasingOutMarkets
        .filter(m => m.depositsUsd > 1 || m.debt > 1);

    const withoutDeposits = accountMarketsWithoutPhasingOutMarkets
        .filter(m => m.deposits <= 1 && m.debt <= 1);

    const depositsUsd = withDeposits.reduce((prev, curr) => prev + curr.depositsUsd, 0);

    const toggleMyPositions = () => {
        setShowMyPositions(!showMyPositions);
    }

    const toggleOther = () => {
        setShowOther(!showOther);
    }

    const invMarketIsInOtherSection = withoutDeposits.some(m => m.isInv);

    const pinnedItems = invMarketIsInOtherSection ?
        ['0xb516247596Ca36bf32876199FBdCaD6B3322330B', (markets?.length > 0 ? markets[markets?.length - 1].address : '')]
        : [(markets?.length > 0 ? markets[markets?.length - 1].address : '')];

    const pinnedLabels = invMarketIsInOtherSection ? ['Stake', 'New'] : ['New'];

    return <Container
        p={isDashboardPage ? '0' : '6'}
        label={
            <Stack h={{ base: 'auto', xl: '56px' }} direction={{ base: 'column', xl: 'row' }} alignItems="flex-start" justify="center">
                <Image transform="translateY(6px)" src={`/assets/firm/${firmImages[themeName]}`} w='110px' h="auto" />
                <VStack h={{ base: 'auto', xl: '56px' }} overflow="hidden" spacing="0" alignItems="flex-start">
                    <Text display="inline-block" fontWeight="bold" fontSize={{ base: '14px', md: '16px', 'xl': '20px' }}>
                        {
                            !dbrPrice ?
                                null
                                // <SmallTextLoader h="16px" pt="8px" width="42px" />
                                :
                                <b style={{ color: themeStyles.colors.success, fontSize: '20px', fontWeight: '900' }}>
                                    {shortenNumber(dbrPrice * 100, 2)}%
                                </b>
                        }
                        &nbsp;Fixed Borrow APR, Unlimited Duration
                    </Text>
                    <Link fontSize='14px' textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/firm" isExternal target="_blank">
                        All markets are isolated - Learn more about FiRM <ExternalLinkIcon />
                    </Link>
                </VStack>
            </Stack>
        }
        labelProps={{ fontSize: { base: '14px', sm: '18px' }, fontWeight: 'extrabold' }}
        contentProps={{
            maxW: { base: '90vw', sm: '100%' },
            overflow: isSmallerThan ? 'auto' : 'visible',
            p: isSmallerThan ? '0' : '4',
            shadow: isSmallerThan ? '0' : '0 0 0px 1px rgba(0, 0, 0, 0.25)',
            borderRadius: isSmallerThan ? '0' : '8px',
            direction: 'column',
        }}
        contentBgColor={isSmallerThan ? 'transparent' : undefined}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <SafetyBadges />
        }
    >
        {
            isLoading ?
                <SkeletonList /> :
                <VStack alignItems="flex-start" spacing="6">
                    {
                        withDeposits.length > 0 && <>
                            <HStack _hover={{ filter: 'brightness(1.5)', transition: '400ms all' }} cursor="pointer" onClick={() => toggleMyPositions()}>
                                <SplashedText
                                    as="h3"
                                    color={`${lightTheme?.colors.mainTextColor}`}
                                    fontSize={'20px'}
                                    fontWeight="extrabold"
                                    color={`${themeStyles?.colors.mainTextColor}`}
                                    splashColor={`${themeStyles?.colors.accentTextColor}`}
                                    lineHeight='1'
                                    splashProps={{
                                        top: '-10px',
                                        left: '-14px',
                                        w: '370px',
                                        opacity: 0.3,
                                    }}
                                >
                                    Your Isolated Markets ({shortenNumber(depositsUsd, 2, true)}) {showMyPositions ? <ChevronDownIcon fontSize="24px" /> : <ChevronRightIcon fontSize="24px" />}
                                </SplashedText>
                            </HStack>
                            {
                                showMyPositions && <Table
                                    keyName="address"
                                    noDataMessage="Loading..."
                                    columns={columns}
                                    items={withDeposits.map(m => {
                                        return { ...m, tvl: firmTvls ? firmTvls?.find(d => d.market.address === m.address)?.tvl : 0 }
                                    })}
                                    onClick={openMarket}
                                    defaultSort={'depositsUsd'}
                                    defaultSortDir="desc"
                                    secondarySortFields={['maxBorrowableByUserWallet', 'leftToBorrow']}
                                    enableMobileRender={true}
                                    mobileClickBtnLabel={'View Market'}
                                    mobileThreshold={responsiveThreshold}
                                    showRowBorder={true}
                                    spacing="0"
                                />
                            }
                            <HStack _hover={{ filter: 'brightness(1.5)', transition: '400ms all' }} cursor="pointer" onClick={() => toggleOther()}>
                                <SplashedText
                                    as="h3"
                                    splash="horizontal-lr2"
                                    color={`${themeStyles?.colors.mainTextColor}`}
                                    splashColor={`${themeStyles?.colors.accentTextColor}`}
                                    fontSize={'20px'}
                                    fontWeight="extrabold"
                                    lineHeight='1'
                                    splashProps={{
                                        top: '-10px',
                                        left: '-10px',
                                        w: '180px',
                                        opacity: 0.3,
                                    }}
                                >
                                    Other Isolated Markets{showOther ? <ChevronDownIcon fontSize="24px" /> : <ChevronRightIcon fontSize="24px" />}
                                </SplashedText>
                            </HStack>
                        </>
                    }
                    {
                        showOther && <Table
                            keyName="address"
                            pinnedItems={pinnedItems}
                            pinnedLabels={pinnedLabels}
                            noDataMessage="Loading..."
                            columns={withDeposits.length > 0 ? columns : columnsWithout}
                            items={withoutDeposits.map(m => {
                                return { ...m, tvl: firmTvls ? firmTvls?.find(d => d.market.address === m.address)?.tvl : 0 }
                            })}
                            onClick={openMarket}
                            defaultSort={'maxBorrowableByUserWallet'}
                            defaultSortDir="desc"
                            secondarySortFields={['maxBorrowableByUserWallet', 'leftToBorrow', 'tvl']}
                            enableMobileRender={true}
                            mobileClickBtnLabel={'View Market'}
                            mobileThreshold={responsiveThreshold}
                            showRowBorder={true}
                            spacing="0"
                        />
                    }
                </VStack>
        }
    </Container>
}