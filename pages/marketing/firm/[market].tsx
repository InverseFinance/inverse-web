import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR'

import { VStack, Text, HStack, Image, Flex, Table, Tbody, Tr, Td } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { F2CombinedForm } from '@app/components/F2/forms/F2CombinedForm'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import { MarketBar } from '@app/components/F2/Infos/InfoBar'
import React, { useEffect, useState } from 'react'
import { F2Context } from '@app/components/F2/F2Contex'
import { useRouter } from 'next/router'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { FirmGovToken, InvInconsistentFirmDelegation } from '@app/components/F2/GovToken/FirmGovToken'
import { FirstTimeModal } from '@app/components/F2/Modals/FirstTimeModal'
import { FirmRewardWrapper } from '@app/components/F2/rewards/FirmRewardWrapper'
import { CvxCrvPreferences } from '@app/components/F2/rewards/CvxCrvPreferences'
import { DailyLimitCountdown } from '@app/components/common/Countdown'
import Container from '@app/components/common/Container'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { shortenNumber, smartShortNumber } from '@app/util/markets'
import { calculateMaxLeverage, preciseCommify } from '@app/util/misc'
import { DbrV1IssueModal } from '@app/components/F2/Modals/DbrV1IssueIModal'
import { useMultisig } from '@app/hooks/useSafeMultisig'
import Link from '@app/components/common/Link'
import { FirmInsuranceCover } from '@app/components/common/InsuranceCover'
import { OLD_BORROW_CONTROLLER } from '@app/config/constants'
import { DbrFloatingTrigger } from '@app/components/F2/DbrEasyBuyer.tsx/DbrEasyBuyer'
import { hasPoints, MarketNameAndIcon, MarketPointsInfo } from '@app/components/F2/F2Markets'
import { useFirmTVL } from '@app/hooks/useTVL'

const { F2_MARKETS } = getNetworkConfigConstants();

const useDefaultPreview = ['CRV', 'cvxCRV', 'cvxFXS', 'st-yCRV']

const DEFAULT_DEPOSITS = 10_000;
const DEFAULT_TIME = 'monthly';

const StatTable = ({
    data
}: {
    data: {
        label: string;
        value: number;
        color?: string;
    }[];
}) => {
    return <Table borderWidth="1px" borderColor="white" borderRadius="0">
        <Tbody>
            {data.map((item, index) => (
                <Tr key={index}>
                    <Td textTransform="capitalize" fontWeight="bold">{item.label}</Td>
                    <Td fontWeight="bold" color={item.color}>
                        {item.value === null ? '-' : index === 0 ? `${shortenNumber(item.value, 2)}%` : `${preciseCommify(item.value, 0, true)}`}
                    </Td>
                </Tr>
            ))}
        </Tbody>
    </Table>
}

export const F2MarketPage = ({ market }: { market: string }) => {
    const router = useRouter();
    const [inited, setInited] = useState(false);

    useEffect(() => {
        if(!inited) {
            setInited(true);
        }
    }, [inited]);

    const { time: _time, deposits: _deposits, layout: _layout } = router.query;

    const layout = ['yield', 'long', 'auto'].includes(_layout) ? _layout : 'auto';
    const time = ['monthly', 'yearly'].includes(_time) ? _time : DEFAULT_TIME;
    const deposits = _deposits && /^\d+$/.test(_deposits) ? Number(_deposits) : DEFAULT_DEPOSITS;

    const { firmTvls } = useFirmTVL();
    const { markets } = useDBRMarkets(market);
    const { priceUsd } = useDBRPrice();

    const f2market = markets.length > 0 && !!market ? markets[0] : undefined;
    const marketTvl = firmTvls?.find(d => d.market.address === f2market?.address)?.tvl || null;

    const maxLeverage = calculateMaxLeverage(f2market?.collateralFactor);

    const divider = time === 'monthly' ? 12 : 1;

    const apy = (f2market?.supplyApy || 0) + (f2market?.extraApy || 0);
    const borrowApy = priceUsd * 100;

    const borrowed = deposits * (maxLeverage - 1);

    const grossIncome = borrowed * apy / divider / 100;
    const dbrCost = borrowed * borrowApy / 100 / divider;
    const netIncome = grossIncome - dbrCost;

    const netApy = apy * maxLeverage - (maxLeverage - 1) * borrowApy;

    const hasYield = layout === 'auto' ? netApy > 0 : layout === 'yield';

    const leftTableStart = [
        {
            label: hasYield ? 'Collateral APY' : 'Collateral Factor',
            value: hasYield ? apy : f2market?.collateralFactor * 100,
            color: hasYield ? 'lightgreen' : 'white',
        },
        {
            label: hasYield ? 'Initial Deposit' : 'TVL',
            value: hasYield ? deposits : marketTvl,
        },
    ];

    const leftTable = hasYield ? leftTableStart.concat([
        {
            label: 'Total Borrow Liquidity',
            value: f2market?.dolaLiquidity,
        },
        {
            label: 'Daily Borrow Limit',
            value: f2market?.dailyLimit,
        },
        {
            label: 'Available Borrow liquidity',
            value: f2market?.leftToBorrow,
            color: 'lightgreen',
        },
    ]) : leftTableStart.concat([
        {
            label: 'Oracle Price',
            value: f2market?.price,
        },
        {
            label: 'Daily Borrow Limit',
            value: f2market?.dailyLimit,
        },
    ]);

    const rightTableStart = [
        {
            label: 'Fixed Borrow Rate',
            value: borrowApy,
            color: 'error',
        },
        {
            label: hasYield ? 'Total DOLA borrowed' : 'Borrows',
            value: hasYield ? borrowed : f2market?.totalDebt,
        },
    ];

    const rightTable = hasYield ? rightTableStart.concat([
        {
            label: time + ' Income',
            value: hasYield ? grossIncome : null,
            color: hasYield ? 'lightgreen' : 'white',
        },
        {
            label: time + ' Cost',
            value: dbrCost,
            color: 'error',
        },
        {
            label: time + ' Net Income',
            value: hasYield ? netIncome : null,
            color: netIncome > 0 && hasYield ? 'lightgreen' : hasYield ? 'error' : 'white',
        },
    ]) : rightTableStart.concat([
        {
            label: 'Total Borrow Liquidity',
            value: f2market?.dolaLiquidity,
        },
        {
            label: 'Available Borrow liquidity',
            value: f2market?.leftToBorrow,
            color: 'lightgreen',
        },
    ]);

    return (
        <Layout hideFooter={true} bgColor="black" bg="black">
            <Head>
                <title>Inverse Finance - FiRM {f2market?.name}</title>
                <meta name="og:description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
            </Head>
            {
                !f2market?.underlying || !inited ? null :
                    <ErrorBoundary description="Error in the market page, please try reloading">
                        <VStack alignItems="flex-start" color="white" spacing={8} w="full" justify="flex-start" maxW="1000px">
                            <Text color="white" as="h1" fontSize="40px" fontWeight="bold">Accelerated Leveraged Economics</Text>
                            <HStack w="full" justify="space-between" fontSize="24px">
                                <HStack w='fit-content' borderWidth="2px" borderColor="gold" bgColor="black" borderRadius="full" px="5" py="3">
                                    <Text whiteSpace="nowrap" color="white" >
                                        Deposit Asset:
                                    </Text>
                                    <Text fontWeight="bold" whiteSpace="nowrap" color="white">{f2market?.name}</Text>
                                    <MarketNameAndIcon marketIcon={f2market?.icon} icon={f2market?.icon} underlying={f2market?.underlying} name={""} lpSize={40} size={40} />
                                </HStack>

                                <HStack w='fit-content' borderWidth="2px" borderColor="gold" bgColor="black" borderRadius="full" px="5" py="3">
                                    <Text whiteSpace="nowrap" color="white" >
                                        Borrow Asset:
                                    </Text>
                                    <Text fontWeight="bold" whiteSpace="nowrap" color="white">DOLA</Text>
                                    <Image src="/assets/v2/dola.png" alt="DOLA" w="40px" h="40px" borderRadius="full" />
                                </HStack>
                            </HStack>
                            <HStack alignItems="flex-start" maxW="1000px" spacing={8} fontSize="20px" w="full" justify="space-between">
                                <StatTable data={leftTable} />
                                <StatTable data={rightTable} />
                            </HStack>
                            <Text color="white" as="h2" fontSize="40px" fontWeight="bold">
                                {
                                    hasYield ? 'Strategy Performance' : 'Long Strategy'
                                }
                            </Text>
                            <HStack w="full" justify="space-between" maxW="1000px" spacing={8}>
                                {
                                    hasYield && <VStack align="center" minW="200px" minH="100px" borderWidth="2px" borderColor="gold" bgColor="black" borderRadius="20px" px="5" py="3">
                                        <Text color="white" fontSize="20px" fontWeight="bold">Leveraged APY</Text>
                                        <Text color={netApy > 0 ? 'lightgreen' : 'error'} fontSize="34px" fontWeight="extrabold">{shortenNumber(netApy, 2)}%</Text>
                                    </VStack>
                                }
                                <VStack minW="200px" minH="100px" borderWidth="2px" borderColor="gold" bgColor="black" borderRadius="20px" px="5" py="3">
                                    <Text color="white" fontSize="20px" fontWeight="bold">
                                        {hasYield ? 'Collateral Multiplier' : 'Leverage Up To'}
                                    </Text>
                                    <Text color="lightgreen" fontSize="34px" fontWeight="extrabold">{shortenNumber(maxLeverage, 2)}x</Text>
                                </VStack>
                                {
                                    hasYield && <VStack minW="200px" minH="100px" borderWidth="2px" borderColor="gold" bgColor="black" borderRadius="20px" px="5" py="3">
                                        <Text color="white" fontSize="20px" fontWeight="bold">APY Amplification</Text>
                                        <Text color={netApy > apy ? 'lightgreen' : 'error'} fontSize="34px" fontWeight="extrabold">{shortenNumber(netApy / apy, 2)}x</Text>
                                    </VStack>
                                }
                                {
                                    f2market?.pointsMultiplier > 0 && <VStack minW="200px" minH="100px" borderWidth="2px" borderColor="gold" bgColor="black" borderRadius="20px" px="5" py="3">
                                        <Text color="white" fontSize="20px" fontWeight="bold">
                                            Leveraged Points
                                        </Text>
                                        <MarketPointsInfo points={f2market?.pointsMultiplier * maxLeverage} pointsImage={f2market?.pointsImage} textProps={{ fontSize: '34px', fontWeight: 'extrabold', color: 'lightgreen' }} imageProps={{ h: '34px', w: '34px' }} />
                                    </VStack>
                                }
                            </HStack>
                            <Text color="white" fontSize="16px" fontStyle="italic">
                                Example is for illustrative purposes only and does not constitute an offer, solicitation, or inducement to any person to acquire any particular asset or enter into any strategy.
                            </Text>
                        </VStack>
                    </ErrorBoundary>
            }
        </Layout>
    )
}

export default F2MarketPage

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
    const { market } = context.params;

    return {
        props: { market: market },
    }
}

export async function getStaticPaths() {
    if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
        return { paths: [], fallback: true }
    }
    return {
        paths: F2_MARKETS.map(m => `/marketing/firm/${m.name}`),
        fallback: true,
    }
}
