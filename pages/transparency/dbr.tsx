import { Flex, HStack, Link, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { useDBR } from '@app/hooks/useDBR'
import { DbrSpenders } from '@app/components/F2/liquidations/dbr-spenders'
import { DBRFlowChart } from '@app/components/Transparency/DBRFlowChart'
import { shortenNumber, smartShortNumber } from '@app/util/markets'
import { useEffect, useState } from 'react'
import { NavButtons } from '@app/components/common/Button'
import { DbrReplenishments } from '@app/components/F2/liquidations/dbr-replenishments'
import { useEventsAsChartData } from '@app/hooks/misc'
import { useDBRBurns, useDBRDebtHisto, useDBRReplenishments } from '@app/hooks/useFirm'
import { DbrIncome } from '@app/components/Transparency/DbrIncome'
import { useRouter } from 'next/router'
import { timestampToUTC } from '@app/util/misc'
import { DbrAll } from '@app/components/Transparency/DbrAll'
import { useDbrAuctionActivity } from '@app/util/dbr-auction'
import { useDolaStakingActivity } from '@app/util/dola-staking'

const { TOKENS, TREASURY, DBR } = getNetworkConfigConstants(NetworkIds.mainnet);

const tabsOptions = ['Issuance', 'Spenders', 'Replenishments', 'Income', 'Flowchart'];

export const DBRTransparency = () => {
    const router = useRouter();
    const { totalSupply, operator, priceUsd, yearlyRewardRate, rewardRate, minYearlyRewardRate, maxYearlyRewardRate, historicalData } = useDBR();
    const { events } = useDBRReplenishments();
    const { events: auctionBuys } = useDbrAuctionActivity();
    const { events: dsaEvents } = useDolaStakingActivity(undefined, 'dsa');
    const mintsFromAuctionBuys = auctionBuys.filter(b => b.auctionType === 'Virtual');
    const { events: burnEvents } = useDBRBurns();
    const { history } = useDBRDebtHisto();
    const { chartData } = useEventsAsChartData(events, 'daoFeeAcc', 'daoDolaReward');
    const [tab, setTab] = useState('Issuance');
    
    const histoPrices = historicalData && !!historicalData?.prices ? historicalData.prices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};

    const handleTabChange = (v: string) => {
        location.hash = v;
        setTab(v);
    }

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (tabsOptions.includes(hash) && tab !== hash) {
            setTab(hash);
        }
    }, [router, tab]);

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Transparency DBR</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="DBR Transparency" />
                <meta name="description" content="DBR Transparency" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-dbr.png" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dbr, dola, supply" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="DBR" hideAnnouncement={true} />
            <TransparencyTabs active="dbr" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2" maxW='1200px'>
                <VStack w={{ base: 'full', xl: '900px' }}>
                    <VStack mt="4" spacing="8" w='full'>
                        <VStack alignItems="flex-start" maxW={{ base: '300px', sm: '600px' }} w='full'>
                            <NavButtons
                                onClick={handleTabChange}
                                active={tab}
                                options={tabsOptions}
                                textProps={{ p: '1', fontSize: { base: '12px', sm: '14px' } }}
                                overflow={{ base: 'scroll', sm: 'auto' }}
                            />
                        </VStack>
                        {
                            tab === 'Spenders' && <DbrSpenders />
                        }
                        {
                            tab === 'Replenishments' && <DbrReplenishments />
                        }
                        {
                            tab === 'Flowchart' && <DBRFlowChart operator={operator || TREASURY} />
                        }
                        {
                            tab === 'Income' && <DbrIncome chartData={chartData} />
                        }
                        {
                            tab === 'Issuance' && <VStack w='full'>                                
                                <DbrAll histoPrices={histoPrices} history={history} burnEvents={burnEvents} dsaEvents={dsaEvents} replenishments={events} auctionBuys={mintsFromAuctionBuys} yearlyRewardRate={yearlyRewardRate} />
                            </VStack>
                        }
                    </VStack>
                </VStack>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: '300px' }}>
                    <ShrinkableInfoMessage
                        title="💸&nbsp;&nbsp;DBR Issuance Policy"
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/governance/proposals/mills/75" isExternal target="_blank">
                                    See initial emission of 4,646,000 for FiRM launch.
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/governance/proposals/mills/109" isExternal target="_blank">
                                    See DBR streaming proposal.
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/governance/proposals/mills/164" isExternal target="_blank">
                                    See DBR auction proposal.
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/governance/proposals/mills/167" isExternal target="_blank">
                                    See DSA & sDOLA proposal.
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr#dbr-issuance" isExternal target="_blank">
                                    DBR issuance documentation
                                </Link>
                                <Text fontWeight="bold">
                                    Yearly rewards to stakers: {smartShortNumber(yearlyRewardRate)} DBR.
                                </Text>
                                {/* <Text>
                                    Current min. yearly rewards: {smartShortNumber(minYearlyRewardRate)} DBR.
                                </Text>
                                <Text>
                                    Current max. yearly rewards: {smartShortNumber(maxYearlyRewardRate)} DBR.
                                </Text> */}
                                <Text pt="4">
                                    There is no max supply.
                                </Text>
                                <Text>
                                    New emissions are via DBR streaming to INV stakers on FiRM, DSA and Virtual DBR auctions.
                                </Text>                                
                            </VStack>
                        }
                    />
                    <ShrinkableInfoMessage
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Text>DBR stands for DOLA Borrowing Right.</Text>
                                <Text>1 DBR = right for 1 DOLA a year.</Text>
                                <HStack w='full' justify="space-between">
                                    <Text>Current DBR price: </Text>
                                    <Text>{shortenNumber(priceUsd, 4, true)}</Text>
                                </HStack>
                            </VStack>
                        }
                    />
                    <ShrinkableInfoMessage
                        title="🗄️&nbsp;&nbsp;Docs & Media"
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights" isExternal target="_blank">
                                    DBR documentation
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/whitepaper" isExternal target="_blank">
                                    FiRM whitepaper
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/about-firm" isExternal target="_blank">
                                    FiRM infographic
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.youtube.com/watch?v=RUgJQ5HOp2Y" isExternal target="_blank">
                                    FiRM introduction video (~1min)
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.youtube.com/watch?v=gAcp1YiuGkg" isExternal target="_blank">
                                    FiRM explainer video (~11min)
                                </Link>
                            </VStack>
                        }
                    />
                    <SupplyInfos token={TOKENS[DBR]} supplies={[
                        { chainId: NetworkIds.mainnet, supply: totalSupply },
                    ]}
                    />
                    <ShrinkableInfoMessage
                        title="⚡&nbsp;&nbsp;Roles & Powers"
                        description={
                            <>
                                <Flex direction="column" w='full' justify="space-between">
                                    <Text fontWeight="bold">- DBR operator:</Text>
                                    <Text>Add/remove DBR minters, mint</Text>
                                </Flex>
                                {/* <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Controller:</Text>
                                    <Text>A contract whitelisting contracts that can borrow</Text>
                                </Flex> */}
                            </>
                        }
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default DBRTransparency
