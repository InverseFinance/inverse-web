import { Box, Flex, useMediaQuery, VStack } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedRevenues } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Container } from '@app/components/common/Container';
import { useEffect, useState } from 'react'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos';
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { FedAreaChart } from '@app/components/Transparency/fed/FedAreaChart'
import { FedBarChart } from '@app/components/Transparency/fed/FedBarChart'
import { FedsSelector } from '@app/components/Transparency/fed/FedsSelector'
import { FedRevenueTable } from '@app/components/Transparency/fed/FedRevenueTable'

const { DOLA, TOKENS, FEDS_WITH_ALL } = getNetworkConfigConstants(NetworkIds.mainnet);

const months = [...Array(12).keys()];

const oneDay = 86400000;

export const FedRevenuesPage = () => {
    const { dolaTotalSupply, fantom, feds } = useDAO();
    const { totalEvents: eventsWithFedInfos, totalRevenues, isLoading } = useFedRevenues();
    const [chosenFedIndex, setChosenFedIndex] = useState<number>(0);
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [now, setNow] = useState<number>(Date.now());
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const chosenFedHistory = FEDS_WITH_ALL[chosenFedIndex];

    const isAllFedsCase = chosenFedIndex === 0;

    const fedHistoricalEvents = isAllFedsCase ? eventsWithFedInfos : eventsWithFedInfos.filter(e => e.fedIndex === (chosenFedIndex - 1));

    const chartData = [...fedHistoricalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
        const date = new Date(event.timestamp);
        return {
            x: event.timestamp,
            y: event[isAllFedsCase ? 'totalAccProfit' : 'accProfit'],
            profit: event.profit,
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
        }
    })];

    // add today's timestamp and zero one day before first supply
    const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
    chartData.unshift({ x: minX - oneDay, y: 0 });
    chartData.push({ x: now, y: chartData[chartData.length - 1].y });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const barChartData = ['Profit'].map(event => {
        return months.map(month => {
            const date = Date.UTC(currentYear, currentMonth - 11 + month);
            const filterMonth = new Date(date).getMonth();
            const filterYear = new Date(date).getFullYear();
            const y = chartData.filter(d => d.month === filterMonth && d.year === filterYear).reduce((p, c) => p + c.profit, 0);

            return {
                label: `${event}s: ${shortenNumber(y, 2, true)}`,
                x: moment(date).format(chartWidth <= 400 ? 'MMM' : 'MMM-YY'),
                y,
            }
        });
    })

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Fed Revenue</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="Dola & the Feds Revenue" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-fed-revenues.png" />
                <meta name="description" content="Dola & the Feds Revenue" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply, revenue" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Fed Revenues" />
            <TransparencyTabs active="fed-revenues" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label="Fed Revenues"
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                <FedsSelector feds={FEDS_WITH_ALL} setChosenFedIndex={setChosenFedIndex} />
                                <FedAreaChart
                                    title={`${chosenFedHistory.name} Revenue Evolution (Current accumulated revenue: ${chartData.length ? shortenNumber(chartData[chartData.length - 1].y, 2) : 0})`}
                                    fed={chosenFedHistory}
                                    chartData={chartData}
                                    domainYpadding={50000}
                                    mainColor="secondary"
                                />
                                <FedBarChart chartData={barChartData} />
                            </Box>
                        }
                    >
                        <FedRevenueTable fedHistoricalEvents={fedHistoricalEvents} isLoading={isLoading} />
                    </Container>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <DolaMoreInfos />
                    <ShrinkableInfoMessage
                        description={
                            <>Profits are not taken in a continuous way, it needs a <b>"Take Profit"</b> transaction to be executed, that is why revenues may seem irregular.</>
                        }
                    />
                    <SuppplyInfos token={TOKENS[DOLA]} supplies={[
                        { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply },
                        { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
                    ]}
                    />
                    <SuppplyInfos
                        title="🦅&nbsp;&nbsp;DOLA Fed Revenues"
                        supplies={
                            feds.map((fed, fedIndex) => {
                                return { supply: totalRevenues[fedIndex], chainId: fed.chainId, name: fed.name, projectImage: fed.projectImage }
                            })
                        }
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default FedRevenuesPage
