import { Box, Flex, HStack, Switch, Text, useMediaQuery, VStack } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useStabilizer } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import Table from '@app/components/common/Table'
import { Container } from '@app/components/common/Container';
import { ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { useEffect, useState } from 'react'
import { AreaChart } from '@app/components/Transparency/AreaChart'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { SkeletonBlob } from '@app/components/common/Skeleton'

const { DOLA, TOKENS, FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);

const oneDay = 86400000;

const SupplyChange = ({ newSupply, changeAmount, isBuy }: { newSupply: number, changeAmount: number, isBuy: boolean }) => {
    return (
        <Flex alignItems="center" justify="space-between" color={isBuy ? 'info' : 'secondary'} pl="2" minW="140px">
            <Text textAlign="left" w="60px">{shortenNumber(newSupply - changeAmount, 1)}</Text>
            <ArrowForwardIcon />
            <Text textAlign="right" w="60px">{shortenNumber(newSupply, 1)}</Text>
        </Flex>
    )
}

const columns = [
    {
        field: 'event',
        label: 'Event Type',
        header: ({ ...props }) => <Flex justify="center" minW="95px" {...props} />,
        value: ({ event, isBuy }) => <Flex minW="95px" justify="center" alignItems="center" color={isBuy ? 'info' : 'secondary'}>
            {event}{isBuy ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Flex>,
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp, isBuy }) => {
            const textColor = isBuy ? 'info' : 'secondary'
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
        field: 'profit',
        label: 'Profit',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ value, isBuy }) => <Flex justify="flex-end" minW="60px" color={isBuy ? 'info' : 'secondary'}>
            {shortenNumber(value, 1)}
        </Flex>,
    },
    {
        field: 'newTotal',
        label: 'New Total Profits',
        header: ({ ...props }) => <Flex justify="flex-end" minW="140px" {...props} />,
        value: ({ newTotal, value, isBuy }) =>
            <SupplyChange newSupply={newTotal} changeAmount={value} isBuy={isBuy} />
    },
]

export const FedPolicyPage = () => {
    const { dolaTotalSupply, fantom } = useDAO();
    const { totalEvents } = useStabilizer();
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [now, setNow] = useState<number>(Date.now());
    const [useSmoothLine, setUseSmoothLine] = useState(true);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    totalEvents.sort((a, b) => b.timestamp - b.timestamp);

    // const tableData = [...totalEvents.splice(0, 5)];

    const chartData = [...totalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
        return {
            x: event.timestamp,
            y: event.newTotal,
        }
    })];

    // add today's timestamp and zero one day before first supply
    if (chartData.length) {
        chartData.push({ x: now, y: chartData[chartData.length - 1].y });
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Stabilizer</title>
            </Head>
            <AppNav active="Transparency" />
            <TransparencyTabs active="fed-policy" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label="Profits in DAI from the Stabilizer Swap fees"
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
                                <AreaChart
                                    title={`Profits from the Stabilizer`}
                                    showTooltips={true}
                                    showMaxY={false}
                                    height={300}
                                    width={chartWidth}
                                    data={chartData}
                                    domainYpadding={20000}
                                    interpolation={useSmoothLine ? 'basis' : 'stepAfter'}
                                />
                            </Box>
                        }
                    >
                        <VStack w='full'>
                            <Text>Profits from the Last 100 Stabilizer swaps</Text>
                            {/* {
                                tableData?.length > 0 ?
                                    <Table
                                        keyName="timestamp"
                                        defaultSort="timestamp"
                                        defaultSortDir="desc"
                                        alternateBg={false}
                                        columns={columns}
                                        items={tableData} />
                                    : <SkeletonBlob />
                            } */}
                        </VStack>
                    </Container>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <DolaMoreInfos />
                    <SuppplyInfos token={TOKENS[DOLA]} supplies={[
                        { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply },
                        { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
                    ]}
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default FedPolicyPage
