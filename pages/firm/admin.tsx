import { VStack, Text, Flex, Stack, HStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmMarketsAndPositionsRenderer } from '@app/components/F2/FirmMarketsAndPositions'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { InfoMessage } from '@app/components/common/Messages'
import { NavButtons } from '@app/components/common/Button'
import { useMemo, useState } from 'react'
import { fetcher } from '@app/util/web3'
import useSWR from 'swr'
import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp'
import Container from '@app/components/common/Container'

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'130px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="130px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

const MarketCell = ({ name, address }: { name: string, address: string }) => {
    return <Cell fontSize={'12px'} alignItems="flex-start" direction="column" minWidth="130px" position="relative">
        <CellText maxW="130px" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" fontWeight="bold" fontSize={{ base: '12px' }}>
            {name}
        </CellText>
        <ScannerLink value={address} type="address" useName={true} />
    </Cell>
}

const updatesColumns = [
    {
        field: 'timestamp',
        label: 'Date',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ timestamp }) => {
            return <Cell minWidth="200px" justify="flex-start" >
                <CellText><Timestamp text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px', color: 'mainTextColorLight' }} timestamp={timestamp} /></CellText>
            </Cell>
        },
    },
    {
        field: 'signer',
        label: 'Signer',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
        value: ({ signer }) => {
            return <Cell minWidth="150px" justify="flex-start" >
                <ScannerLink value={signer} />
            </Cell>
        },
    },
    {
        field: 'market',
        label: 'Market Address',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ marketAddress }) => {
            return <Cell minWidth="200px" justify="flex-start" >
                <ScannerLink value={marketAddress} />
            </Cell>
        },
    },
    {
        field: 'noDeposit',
        label: 'Disabled Deposits',
        header: ({ ...props }) => <ColHeader minWidth="130px" justify="flex-start"  {...props} />,
        value: ({ noDeposit }) => {
            return <Cell minWidth="130px" justify="flex-start" >
                <CellText>{noDeposit ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
    },
    {
        field: 'isPhasingOut',
        label: 'Hidden',
        header: ({ ...props }) => <ColHeader minWidth="130px" justify="flex-start"  {...props} />,
        value: ({ isPhasingOut }) => {
            return <Cell minWidth="130px" justify="flex-start" >
                <CellText>{isPhasingOut ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
    },
    {
        field: 'phasingOutComment',
        label: 'Comment',
        header: ({ ...props }) => <ColHeader minWidth="300px" justify="flex-start"  {...props} />,
        value: ({ phasingOutComment }) => {
            return <Cell minWidth="300px" justify="flex-start" >
                <CellText maxW="300px" whiteSpace="normal">{phasingOutComment || '-'}</CellText>
            </Cell>
        },
    },
]

export const FirmAdminPage = () => {
    const { markets, isLoading, timestamp } = useDBRMarkets();
    const { data: marketsDisplaysData } = useSWR('/api/f2/markets-display', fetcher);
    const [activeTab, setActiveTab] = useState<'Markets' | 'Updates'>('Markets');
    const updates = useMemo(() => {
        return marketsDisplaysData?.data?.updates || [];
    }, [marketsDisplaysData]);
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Firm Admin</title>
            </Head>
            <AppNav hideAnnouncement={true} active="Markets" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack spacing="8" w='full' maxW="1200px" mt="4" alignItems='center'>
                    <VStack maxW="600px" w="full" justify="space-between" alignItems="flex-end">
                        <InfoMessage
                            title="FiRM UI temporary overrides Admin"
                            alertProps={{
                                w: 'full',
                            }}
                            description={
                                <VStack spacing="0" w='full' alignItems='flex-start'>
                                    <Text>- Connect with a whitelisted PWG, RWG or TWG address</Text>
                                    <Text>- Click on a market to update visibility or disable deposits</Text>
                                    <Text>- Sign to confirm</Text>
                                    <Text>- Updates can take 1-2 minutes to fully reflect</Text>
                                </VStack>
                            }
                        />
                        <NavButtons
                            options={['Markets', 'Updates']}
                            active={activeTab}
                            onClick={(s) => setActiveTab(s)}
                        />
                    </VStack>
                    {
                        activeTab === 'Markets' && (
                            <FirmMarketsAndPositionsRenderer
                                defaultTab={'Markets'}
                                markets={markets}
                                positions={[]}
                                isLoading={isLoading}
                                timestamp={timestamp}
                                onlyShowDefaultTab={true}
                                useAdminMarketsColumns={true}
                            />
                        )
                    }
                    {
                        activeTab === 'Updates' && (
                            <Container w="full" p="0" noPadding>
                                <Table
                                    noDataMessage="No overrides found"
                                    columns={updatesColumns}
                                    items={updates}
                                    defaultSort="timestamp"
                                    defaultSortDir="desc"
                                />
                            </Container>
                        )
                    }
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAdminPage
