import { Box, Flex, HStack, Image, Switch, Text, useMediaQuery, VStack } from '@chakra-ui/react'

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
import Table from '@app/components/common/Table'
import { Container } from '@app/components/common/Container';
import { ArrowForwardIcon } from '@chakra-ui/icons'
import ScannerLink from '@app/components/common/ScannerLink'
import { useEffect, useState } from 'react'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';
import { SkeletonBlob } from '@app/components/common/Skeleton';
import { shortenAddress } from '@app/util'
import { AreaChart } from '@app/components/Transparency/AreaChart'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos';
import { BarChart } from '@app/components/Transparency/BarChart'

const { DOLA, TOKENS, FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);

const months = [...Array(12).keys()];

const oneDay = 86400000;

const SupplyChange = ({ newSupply, changeAmount }: { newSupply: number, changeAmount: number }) => {
    return (
        <Flex alignItems="center" justify="space-between" pl="2" minW="140px">
            <Text textAlign="left" w="60px">{shortenNumber(newSupply - changeAmount, 2)}</Text>
            <ArrowForwardIcon />
            <Text textAlign="right" w="60px">{shortenNumber(newSupply, 2)}</Text>
        </Flex>
    )
}

const columns = [
    {
        field: 'fedName',
        label: 'Fed',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ fedName, projectImage }) =>
            <Flex alignItems="center" minW="120px">
                <Image ignoreFallback={true} src={`/assets/projects/${projectImage}`} w={'15px'} h={'15px'} mr="2" />
                {fedName}
            </Flex>,
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp }) => {
            const textColor = 'info'
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
        value: ({ transactionHash, chainId }) => <Flex minW="120px">
            <ScannerLink value={transactionHash} type="tx" chainId={chainId} />
        </Flex>,
    },
    {
        field: 'profit',
        label: 'Profit',
        tooltip: 'After the bridging fee',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ profit }) => <Flex justify="flex-end" minW="60px" >
            {shortenNumber(profit, 2)}
        </Flex>,
    },
    {
        field: 'accProfit',
        label: 'New Fed Revenue',
        header: ({ ...props }) => <Flex justify="center" minW="140px" {...props} />,
        value: ({ accProfit, profit }) =>
            <SupplyChange newSupply={accProfit} changeAmount={profit} />
    },
    {
        field: 'totalAccProfit',
        label: 'New TOTAL Revenue',
        header: ({ ...props }) => <Flex justify="flex-end" minW="140px" {...props} />,
        value: ({ totalAccProfit, profit }) =>
            <SupplyChange newSupply={totalAccProfit} changeAmount={profit} />
    },
]

export const FedRevenuesPage = () => {
    const { dolaTotalSupply, fantom } = useDAO();
    const { totalEvents, totalRevenues } = useFedRevenues();
    const [chosenFedIndex, setChosenFedIndex] = useState<number>(0);
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [now, setNow] = useState<number>(Date.now());
    const [useSmoothLine, setUseSmoothLine] = useState(false);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const feds = FEDS;

    const eventsWithFedInfos = totalEvents
        .map(e => {
            const fed = feds[e.fedIndex];
            return {
                ...e,
                chainId: fed.chainId,
                fedName: fed.name,
                projectImage: fed.projectImage,
            }
        })

    const isAllFedsCase = chosenFedIndex === 0;

    const fedHistoricalEvents = isAllFedsCase ? eventsWithFedInfos : eventsWithFedInfos.filter(e => e.fedIndex === (chosenFedIndex - 1));
    const fedsIncludingAll = [{
        name: 'All Feds',
        projectImage: 'eth-ftm.webp',
        address: '',
        chainId: NetworkIds.ethftm,
    }].concat(feds);

    const chosenFedHistory = fedsIncludingAll[chosenFedIndex];

    const fedOptionList = fedsIncludingAll
        .map((fed, i) => ({
            value: i.toString(),
            label: <Flex alignItems="center">
                {
                    !!fed.chainId && <Image ignoreFallback={true} src={`/assets/projects/${fed.projectImage}`} w={'15px'} h={'15px'} mr="2" />
                }
                {fed.name}
            </Flex>,
        }));

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
    if (chartData.length) {
        const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
        chartData.unshift({ x: minX - oneDay, y: 0 });
        chartData.push({ x: now, y: chartData[chartData.length - 1].y });
    }

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
            </Head>
            <AppNav active="Transparency" />
            <TransparencyTabs active="fed-revenues" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label="Fed Revenues"
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                <RadioCardGroup
                                    wrapperProps={{ overflow: 'auto', position: 'relative', justify: 'left', mt: '2', mb: '2', maxW: { base: '90vw', sm: '100%' } }}
                                    group={{
                                        name: 'bool',
                                        defaultValue: '0',
                                        onChange: (v: string) => setChosenFedIndex(parseInt(v)),
                                    }}
                                    radioCardProps={{ w: '150px', textAlign: 'center', p: '2', position: 'relative' }}
                                    options={fedOptionList}
                                />
                                <Flex h="25px" position="relative" alignItems="center">
                                    {
                                        !!chosenFedHistory.address &&
                                        <>
                                            <Text display="inline-block" mr="2">Contract:</Text>
                                            <ScannerLink chainId={chosenFedHistory.chainId} value={chosenFedHistory.address} label={shortenAddress(chosenFedHistory.address)} />
                                        </>
                                    }
                                    <HStack position="absolute" right={{ base: 0, sm: '50px' }} top="3px">
                                        <Text fontSize="12px">
                                            Smooth line
                                        </Text>
                                        <Switch value="true" isChecked={useSmoothLine} onChange={() => setUseSmoothLine(!useSmoothLine)} />
                                    </HStack>
                                </Flex>
                                <AreaChart
                                    title={`${chosenFedHistory.name} Revenue Evolution (Current accumulated revenue: ${chartData.length ? shortenNumber(chartData[chartData.length - 1].y, 2) : 0})`}
                                    showTooltips={true}
                                    height={300}
                                    width={chartWidth}
                                    data={chartData}
                                    domainYpadding={50000}
                                    mainColor="secondary"
                                    interpolation={useSmoothLine ? 'basis' : 'stepAfter'}
                                />
                                <BarChart
                                    width={chartWidth}
                                    height={300}
                                    title="Monthly profits for the last 12 months"
                                    groupedData={barChartData}
                                    colorScale={['#34E795']}
                                    isDollars={true}
                                />
                            </Box>
                        }
                    >
                        {
                            fedHistoricalEvents?.length > 0 ?
                                <Table
                                    keyName="transactionHash"
                                    defaultSort="timestamp"
                                    defaultSortDir="desc"
                                    alternateBg={false}
                                    columns={columns}
                                    items={fedHistoricalEvents} />
                                : <SkeletonBlob />
                        }
                    </Container>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <DolaMoreInfos />
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
