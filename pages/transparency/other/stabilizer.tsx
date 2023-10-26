import { Box, Flex, HStack, Switch, Text, useMediaQuery, VStack } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyOtherTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useStabilizer } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import Table from '@app/components/common/Table'
import { Container } from '@app/components/common/Container';
import { ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { useEffect, useState } from 'react'
import { AreaChart } from '@app/components/Transparency/AreaChart'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import { StabilizerOverview } from '@app/components/Stabilizer/Overview'
import ScannerLink from '@app/components/common/ScannerLink'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { BarChart } from '@app/components/Transparency/BarChart'
import Link from '@app/components/common/Link'
import { DolaSupplies } from '@app/components/common/Dataviz/DolaSupplies'

const months = [...Array(12).keys()];

const SupplyChange = ({ newSupply, changeAmount, isBuy }: { newSupply: number, changeAmount: number, isBuy: boolean }) => {
    return (
        <Flex alignItems="center" justify="space-between" color={!isBuy ? 'info' : 'secondary'} pl="2" minW="160px">
            <Text textAlign="left" w="70px">{shortenNumber(newSupply - changeAmount, 2, true)}</Text>
            <ArrowForwardIcon />
            <Text textAlign="right" w="70px">{shortenNumber(newSupply, 2, true)}</Text>
        </Flex>
    )
}

const columns = [
    {
        field: 'event',
        label: 'Event Type',
        header: ({ ...props }) => <Flex justify="flex-start" minW="110px" {...props} />,
        value: ({ event, isBuy }) => <Flex minW="110px" justify="flex-start" alignItems="center" color={!isBuy ? 'info' : 'secondary'}>
            {event} DOLA {!isBuy ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Flex>,
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp, isBuy }) => {
            const textColor = !isBuy ? 'info' : 'secondary'
            return (
                <Flex minW="100px">
                    <VStack spacing="0">
                        <Text color={textColor} fontSize="12px">{moment(timestamp).fromNow()}</Text>
                        <Text color={textColor} fontSize="10px">{moment(timestamp).format('MMM Do YYYY')}</Text>
                    </VStack>
                </Flex>
            )
        },
    },
    {
        field: 'transactionHash',
        label: 'Transaction',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ transactionHash, isBuy }) => <Flex minW="120px">
            <ScannerLink color={!isBuy ? 'info' : 'secondary'} value={transactionHash} type="tx" />
        </Flex>,
    },
    {
        field: 'amount',
        label: 'Amount',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ amount, isBuy }) => <Flex justify="flex-end" minW="60px" color={!isBuy ? 'info' : 'secondary'}>
            {shortenNumber(amount, 2, true)}
        </Flex>,
    },
    {
        field: 'profit',
        label: 'Profit',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ profit, isBuy }) => <Flex justify="flex-end" minW="60px" color={!isBuy ? 'info' : 'secondary'}>
            {shortenNumber(profit, 2, true)}
        </Flex>,
    },
    {
        field: 'newTotal',
        label: 'New Total Profits',
        header: ({ ...props }) => <Flex justify="flex-end" minW="160px" {...props} />,
        value: ({ newTotal, profit, isBuy }) =>
            <SupplyChange newSupply={newTotal} changeAmount={profit} isBuy={isBuy} />
    },
]

export const StabilizerTransparency = () => {
    const { dolaSupplies } = useDAO();
    const { totalEvents } = useStabilizer();
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [now, setNow] = useState<number>(Date.now());
    const [useSmoothLine, setUseSmoothLine] = useState(true);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    totalEvents.sort((a, b) => b.timestamp - a.timestamp);

    const tableData = totalEvents.filter(e => !!e.transactionHash);

    const chartData = [...totalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
        const date = new Date(event.timestamp);
        return {
            x: event.timestamp,
            y: event.newTotal,
            profit: event.profit,
            event: event.event,
            blockNumber: event.blockNumber,
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
        }
    })];

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth();

    const barChartData = ['Buy', 'Sell'].map(event => {
        return months.map(month => {
            const date = Date.UTC(currentYear, currentMonth - 11 + month);
            const filterMonth = new Date(date).getUTCMonth();
            const filterYear = new Date(date).getUTCFullYear();
            const y = chartData.filter(d => d.event === event && d.month === filterMonth && d.year === filterYear).reduce((p, c) => p + c.profit, 0);

            return {
                label: `${event}s: ${shortenNumber(y, 2, true)}`,
                x: moment(date).utc().format(chartWidth <= 400 ? 'MMM' : 'MMM-YY'),
                y,
            }
        });
    })

    // add today's timestamp and zero one day before first supply
    if (chartData.length) {
        chartData.push({ x: now, y: chartData[chartData.length - 1].y });
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Stabilizer</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="Stabilizer Income" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
                <meta name="description" content="Inverse Finance Stabilizer for DOLA" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dola, stabilizer, peg" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Frontier & Other" hideAnnouncement={true} />
            <TransparencyOtherTabs active="other-stabilizer" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label="Accumulated Income in DAI from the Stabilizer Swap fees"
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                <Flex h="25px" position="relative" alignItems="center">
                                    <HStack position="absolute" right={{ base: 0, sm: '50px' }} top="3px">
                                        <Text fontSize="12px">
                                            Smooth line
                                        </Text>
                                        <Switch value="true" isChecked={useSmoothLine} onChange={() => setUseSmoothLine(!useSmoothLine)} />
                                    </HStack>
                                </Flex>
                                {
                                    totalEvents?.length > 0 ?
                                        <>
                                            <AreaChart
                                                title={`Accumulated Income (Current Total: ${chartData.length ? shortenNumber(chartData[chartData.length - 1].y, 2, true) : 0})`}
                                                showTooltips={true}
                                                showMaxY={false}
                                                height={300}
                                                width={chartWidth}
                                                data={chartData}
                                                domainYpadding={20000}
                                                interpolation={useSmoothLine ? 'basis' : 'stepAfter'}
                                                mainColor="secondary"
                                                isDollars={true}
                                            />
                                            <BarChart
                                                width={chartWidth}
                                                height={300}
                                                title="Monthly income for the last 12 months"
                                                groupedData={barChartData}
                                                colorScale={['#34E795', '#4299e1']}
                                                isDollars={true}
                                            />
                                        </>
                                        :
                                        <>
                                            <SkeletonBlob skeletonHeight={3} noOfLines={9} w={`${chartWidth - 60}px`} />
                                            <SkeletonBlob pt="6" skeletonHeight={3} noOfLines={9} w={`${chartWidth - 60}px`} />
                                        </>
                                }
                            </Box>
                        }
                    >
                        <VStack w='full'>
                            <Text fontSize="14px" fontWeight="bold" mb="2">Income from the Last {tableData.length} Stabilizer Swap Fees</Text>
                            {
                                tableData?.length > 0 ?
                                    <Table
                                        keyName="transactionHash"
                                        defaultSort="timestamp"
                                        defaultSortDir="desc"
                                        alternateBg={false}
                                        columns={columns}
                                        items={tableData} />
                                    : <SkeletonBlob />
                            }
                        </VStack>
                    </Container>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <StabilizerOverview />
                    <ShrinkableInfoMessage description={
                        <Link href="https://dune.xyz/naoufel/dola-metrics">
                            DOLA and Stabilizer metrics on Dune Analytics <ExternalLinkIcon />
                        </Link>
                    } />
                    <ShrinkableInfoMessage description={
                        <Text>DAI income is sent to the Inverse Treasury on each swap</Text>
                    } />
                    <DolaSupplies supplies={dolaSupplies.filter(chain => chain.supply > 0)} />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default StabilizerTransparency
