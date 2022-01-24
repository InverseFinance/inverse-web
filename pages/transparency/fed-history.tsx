import { Box, Flex, Image, Text } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { FedHistory, NetworkIds } from '@inverse/types'
import { TransparencyTabs } from '@inverse/components/Transparency/TransparencyTabs'
import { useDAO, useFedHistory } from '@inverse/hooks/useDAO'
import { shortenNumber } from '@inverse/util/markets'
import { SuppplyInfos } from '@inverse/components/common/Dataviz/SupplyInfos'
import Table from '@inverse/components/common/Table'
import { Container } from '@inverse/components/common/Container';
import { ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon } from '@chakra-ui/icons'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { useState } from 'react'
import { RadioCardGroup } from '@inverse/components/common/Input/RadioCardGroup';
import { SkeletonBlob } from '@inverse/components/common/Skeleton';
import { shortenAddress } from '@inverse/util'
import { DolaMoreInfos } from '@inverse/components/Transparency/DolaMoreInfos'

const { DOLA, TOKENS, FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultFeds: FedHistory[] = FEDS.map(((fed) => {
    return {
        ...fed,
        events: [],
        supply: 0,
    }
}))

const SupplyChange = ({ newSupply, changeAmount, isContraction }: { newSupply: number, changeAmount: number, isContraction: boolean }) => {
    return (
        <Flex alignItems="center" justify="space-between" color={isContraction ? 'info' : 'secondary'} pl="2" minW="140px">
            <Text textAlign="left" w="60px">{shortenNumber(newSupply - changeAmount, 1)}</Text>
            <ArrowForwardIcon />
            <Text textAlign="right" w="60px">{shortenNumber(newSupply, 1)}</Text>
        </Flex>
    )
}

const columns = [
    {
        field: 'fedName',
        label: 'Fed',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ fedName, isContraction, projectImage }) =>
            <Flex alignItems="center" color={isContraction ? 'info' : 'secondary'} minW="120px">
                <Image ignoreFallback={true} src={`/assets/projects/${projectImage}`} w={'15px'} h={'15px'} mr="2" />
                {fedName}
            </Flex>,
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp, isContraction }) => <Flex color={isContraction ? 'info' : 'secondary'} minW="100px">
            {moment(timestamp * 1000).fromNow()}
        </Flex>,
    },
    {
        field: 'transactionHash',
        label: 'Transaction',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ transactionHash, chainId, isContraction }) => <Flex minW="120px">
            <ScannerLink color={isContraction ? 'info' : 'secondary'} value={transactionHash} type="tx" chainId={chainId} />
        </Flex>,
    },
    {
        field: 'event',
        label: 'Event Type',
        header: ({ ...props }) => <Flex justify="center" minW="95px" {...props} />,
        value: ({ event, isContraction }) => <Flex minW="95px" justify="center" alignItems="center" color={isContraction ? 'info' : 'secondary'}>
            {event}{isContraction ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Flex>,
    },
    {
        field: 'value',
        label: 'Amount',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ value, isContraction }) => <Flex justify="flex-end" minW="60px" color={isContraction ? 'info' : 'secondary'}>
            {shortenNumber(value, 1)}
        </Flex>,
    },
    {
        field: 'newSupply',
        label: 'New Fed Supply',
        header: ({ ...props }) => <Flex justify="center" minW="140px" {...props} />,
        value: ({ newSupply, value, isContraction }) =>
            <SupplyChange newSupply={newSupply} changeAmount={value} isContraction={isContraction} />
    },
    {
        field: 'newTotalSupply',
        label: 'New TOTAL Supply',
        header: ({ ...props }) => <Flex justify="flex-end" minW="140px" {...props} />,
        value: ({ newTotalSupply, value, isContraction }) =>
            <SupplyChange newSupply={newTotalSupply} changeAmount={value} isContraction={isContraction} />
    },
]

export const FedHistoryPage = () => {
    const { dolaTotalSupply, fantom, feds } = useDAO();
    const { totalEvents } = useFedHistory();
    const [chosenFedIndex, setChosenFedIndex] = useState<any>(0);

    const fedsWithData = feds?.length > 0 ? feds : defaultFeds;

    const eventsWithFedInfos = totalEvents
        .map(e => {
            const fed = fedsWithData[e.fedIndex];
            return {
                ...e,
                chainId: fed.chainId,
                fedName: fed.name,
                projectImage: fed.projectImage,
            }
        })

    const fedHistoricalEvents = chosenFedIndex === 0 ? eventsWithFedInfos : eventsWithFedInfos.filter(e => e.fedIndex === (chosenFedIndex - 1));
    const fedsIncludingAll = [{
        name: 'All Feds',
        projectImage: 'eth-ftm.webp',
        address: '',
        chainId: NetworkIds.ethftm,
    }].concat(FEDS);

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

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Transparency Fed History</title>
            </Head>
            <AppNav active="Transparency" />
            <TransparencyTabs active="fed-history" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '1000px' }}
                        label="Fed Supplies Contractions and Expansions"
                        description={<Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
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
                            <Box h="25px">
                                {
                                    !!chosenFedHistory.address &&
                                    <>
                                        <Text display="inline-block" mr="2">Contract:</Text>
                                        <ScannerLink chainId={chosenFedHistory.chainId} value={chosenFedHistory.address} label={shortenAddress(chosenFedHistory.address)} />
                                    </>
                                }
                            </Box>
                        </Box>}
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
                <Flex direction="column" p={{ base: '4', xl: '0' }}>
                    <Flex w={{ base: 'full', xl: 'sm' }} mt="4" justify="center">
                        <DolaMoreInfos />
                    </Flex>
                    <Flex w={{ base: 'full', xl: 'sm' }} mt="4" justify="center">
                        <SuppplyInfos token={TOKENS[DOLA]} supplies={[
                            { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply },
                            { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
                        ]}
                        />
                    </Flex>
                    <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
                        <SuppplyInfos
                            title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
                            supplies={fedsWithData}
                        />
                    </Flex>
                </Flex>
            </Flex>
        </Layout>
    )
}

export default FedHistoryPage
