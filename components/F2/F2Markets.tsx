import { Badge, Flex, HStack, Stack, Text, useMediaQuery } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useAccountDBR, useAccountF2Markets, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
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
import { SafetyBadges, SafetyMiniCaroussel } from "./SecurityMiniCaroussel";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

const columns = [
    {
        field: 'name',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-start"  {...props} />,
        tooltip: 'Market type, each market have an underlying token and strategy',
        value: ({ name, icon, marketIcon, underlying, badgeInfo, badgeProps }) => {
            return <Cell minWidth="110px">
                <Cell minWidth='110px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <HStack justify="flex-start" alignItems="center" spacing="1" w='full'>
                        <BigImageButton bg={`url('${marketIcon || icon || underlying.image}')`} h="25px" w="25px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                        <CellText fontWeight="bold">{name}</CellText>
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
            </Cell>
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
            return <Cell alignItems="center" minWidth="110px" justify="center" fontSize="14px">
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
        field: 'deposits',
        label: 'Your Deposits',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of Collateral you deposited in the Market',
        value: ({ deposits, price, account }) => {
            return <Cell minWidth="120px" justify="center" alignItems="center" direction={{ base: 'row', sm: 'column' }} spacing={{ base: '1', sm: '0' }}>
                {
                    account && deposits > 0 ? <>
                        <CellText>{smartShortNumber(deposits, 2)}</CellText>
                        <CellText>({smartShortNumber(deposits * price, 2, true)})</CellText>
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

const firmImages = {
    'dark': 'firm-final-logo-white.png',
    'light': 'firm-final-logo.png',
}

const responsiveThreshold = 1260;

export const F2Markets = ({

}: {

    }) => {
    const { markets } = useDBRMarkets();
    const account = useAccount();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const { debt } = useAccountDBR(account);
    const router = useRouter();
    const { firmTvls, isLoading: tvlLoading } = useFirmTVL();
    const { themeStyles, themeName } = useAppTheme();
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

    return <Container
        label={
            <Text fontWeight="bold" fontSize={{ base: '14px', md: '16px' }}>
                {
                    !dbrPrice ?
                        <SmallTextLoader pt="13px" width="42px" />
                        :
                        <b style={{ color: themeStyles.colors.success, fontSize: '18px', fontWeight: '900' }}>
                            {shortenNumber(dbrPrice * 100, 2)}
                        </b>
                        
                }
                <b style={{ color: themeStyles.colors.success, fontSize: '18px', fontWeight: '900' }}>%</b> Fixed Borrow APR, Unlimited Duration
            </Text>
        }
        labelProps={{ fontSize: { base: '14px', sm: '18px' }, fontWeight: 'extrabold' }}
        description={`Learn more`}
        href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/firm"
        image={<BigImageButton transform="translateY(5px)" bg={`url('/assets/firm/${firmImages[themeName]}')`} h={{ base: '50px' }} w={{ base: '110px' }} borderRadius="0" />}
        contentProps={{
            maxW: { base: '90vw', sm: '100%' },
            overflowX: 'auto',
            p: isSmallerThan ? '0' : '4',
            shadow: isSmallerThan ? '0' : '0 0 0px 1px rgba(0, 0, 0, 0.25)',
            borderRadius: isSmallerThan ? '0' : '8px',
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
                <Table
                    keyName="address"
                    pinnedItems={['0xb516247596Ca36bf32876199FBdCaD6B3322330B', markets?.length > 0 ? markets[markets?.length-1].address : '']}
                    pinnedLabels={['Stake', 'New']}
                    noDataMessage="Loading..."
                    columns={columns}
                    items={accountMarketsWithoutPhasingOutMarkets.map(m => {
                        return { ...m, tvl: firmTvls ? firmTvls?.find(d => d.market.address === m.address)?.tvl : 0 }
                    })}
                    onClick={openMarket}
                    defaultSort={debt > 0 ? 'deposits' : 'leftToBorrow'}
                    defaultSortDir="desc"
                    enableMobileRender={true}
                    mobileClickBtnLabel={'View Market'}
                    mobileThreshold={responsiveThreshold}
                    showRowBorder={true}
                    spacing="0"
                />
        }
    </Container>
}