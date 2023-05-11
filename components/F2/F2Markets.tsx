import { Badge, Flex, HStack, Stack, Text, Image, VStack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
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
import { SkeletonList } from "../common/Skeleton";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { gaEvent } from "@app/util/analytics";
import Link from "../common/Link";

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
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        tooltip: 'Market type, each market have an underlying token and strategy',
        value: ({ name, icon, marketIcon, underlying, badgeInfo, badgeProps }) => {
            return <Cell minWidth="90px">
                <Cell minWidth='90px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <HStack justify="flex-start" alignItems="center" spacing="1" w='full'>
                        <BigImageButton bg={`url('${marketIcon || icon || underlying.image}')`} h="25px" w="25px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                        <CellText fontWeight="bold">{name}</CellText>
                    </HStack>
                    {
                        !!badgeInfo && <CellText fontWeight="bold">
                            <Badge fontWeight="normal"
                                textTransform="capitalize"
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
        tooltip: 'The APY provided by the asset itself (or claimable rewards) and that is kept even after supplying. This is not an additional APY from FiRM',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ supplyApy, supplyApyLow, price, underlying, hasClaimableRewards }) => {
            return <Cell direction="column" minWidth="150px" alignItems="center" justify="center" fontSize="14px">
                <AnchorPoolInfo
                    protocolImage={underlying.protocolImage}
                    value={supplyApy}
                    valueLow={supplyApyLow}
                    priceUsd={price}
                    symbol={underlying.symbol}
                    type={'supply'}
                    textProps={{ textAlign: "end" }}
                    hasClaimableRewards={hasClaimableRewards}
                />
                {
                    supplyApy > 0 && <Text fontSize="12px" color="mainTextColorLight2">
                        {hasClaimableRewards ? 'Claimable rewards' : 'Rebase APY'}
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
                <CellText>{shortenNumber(tvl, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'totalDebt',
        label: 'Borrows',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        tooltip: 'Total DOLA borrowed in the Market',
        value: ({ totalDebt }) => {
            return <Cell minWidth="80px" justify="center" >
                <CellText>{shortenNumber(totalDebt, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaLiquidity',
        label: 'DOLA Liquidity',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Remaining borrowable DOLA liquidity, not taking into account daily limits',
        value: ({ dolaLiquidity }) => {
            return <Cell minWidth="120px" justify="center" >
                <CellText>{shortenNumber(dolaLiquidity, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'leftToBorrow',
        label: "Available to borrow",
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Markets can have daily borrow limits, this shows the DOLA left to borrow for the day (UTC timezone)',
        value: ({ leftToBorrow, totalDebt }) => {
            return <Cell minWidth="120px" justify="center" alignItems="center" direction="column" spacing="0" >
                <CellText>{leftToBorrow ? shortenNumber(leftToBorrow, 2) : totalDebt ? 'Depleted' : 'No liquidity'}</CellText>
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
                        <CellText>{shortenNumber(deposits, 2)}</CellText>
                        <CellText>({shortenNumber(deposits * price, 2, true)})</CellText>
                    </> : <>-</>
                }
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Your Debt',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA you borrowed from the Market',
        value: ({ debt, account }) => {
            return <Cell minWidth="90px" justify="center">
                <CellText>{account && debt > 0 ? shortenNumber(debt, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Your Borrow Limit',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-end"  {...props} />,
        tooltip: 'Your Borrow Limit, should not reach 100%, otherwise liquidations can happen',
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

export const F2Markets = ({

}: {

    }) => {
    const { markets } = useDBRMarkets();
    const account = useAccount();
    const { price: dbrPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const { debt } = useAccountDBR(account);
    const router = useRouter();
    const { firmTvls, isLoading: tvlLoading } = useFirmTVL();
    const { themeStyles, themeName } = useAppTheme();

    const isLoading = tvlLoading || !markets?.length;

    const openMarket = (market: any) => {
        gaEvent({ action: `FiRM-list-open-market-${market.name}` });
        const newPath = router.asPath.replace(router.pathname, `/firm/${market.name}`);
        router.push(newPath);
    }

    return <Container
        label={
            <Text fontWeight="bold" fontSize={{ base: '14px', md: '16px' }}>
                <b style={{ color: themeStyles.colors.success, fontSize: '18px', fontWeight: '900' }}>{shortenNumber(dbrPrice * 100, 2)}%</b> Fixed Borrow APR
            </Text>
        }
        labelProps={{ fontSize: { base: '14px', sm: '18px' }, fontWeight: 'extrabold' }}
        description={`Learn more`}
        href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/firm"
        image={<BigImageButton transform="translateY(5px)" bg={`url('/assets/firm/${firmImages[themeName]}')`} h={{ base: '50px' }} w={{ base: '110px' }} borderRadius="0" />}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <VStack pt={{ base: '4', sm: '0' }} display={{ base: 'none', sm: 'inline-flex' }} spacing="0" alignItems="flex-end">
                <Link href="https://chain.link/badge" isExternal target="_blank">
                    <Image ignoreFallback={true} h="50px" src="https://chain.link/badge-market-data-white" alt="market data secured with chainlink" />
                </Link>
            </VStack>
        }
    >
        {
            isLoading ?
                <SkeletonList /> :
                <Table
                    keyName="address"
                    noDataMessage="Loading..."
                    columns={columns}
                    items={accountMarkets.map(m => {
                        return { ...m, tvl: firmTvls ? firmTvls?.find(d => d.market.address === m.address)?.tvl : 0 }
                    })}
                    onClick={openMarket}
                    defaultSort={debt > 0 ? 'deposits' : 'tvl'}
                    defaultSortDir="desc"
                    enableMobileRender={true}
                    mobileClickBtnLabel={'View Market'}
                    mobileThreshold={1260}
                    showRowBorder={true}
                    spacing="0"
                />
        }
    </Container>
}