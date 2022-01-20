import { Box, Flex, Image, Text } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants, getNetworkImage } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types'
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

const { DOLA, TOKENS, FEDS, DEPLOYER, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultFeds = FEDS.map(((fed) => {
    return {
        ...fed,
        supply: 0,
        chair: DEPLOYER,
        gov: TREASURY,
    }
}))

const columns = [
    {
        field: 'blockNumber',
        label: 'Block Number',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ blockNumber, isContraction }) => <Flex color={isContraction ? 'info' : 'secondary'} minW="120px">{blockNumber}</Flex>,
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ timestamp, isContraction }) => <Flex color={isContraction ? 'info' : 'secondary'} minW="120px">
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
        label: 'Resize Event',
        header: ({ ...props }) => <Flex justify="flex-start" minW="80px" {...props} />,
        value: ({ event, isContraction }) => <Flex minW="80px" justify="flex-start" alignItems="center" color={isContraction ? 'info' : 'secondary'}>
            {event}{isContraction ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Flex>,
    },
    {
        field: 'value',
        label: 'Amount',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ value, isContraction }) => <Flex justify="flex-end" minW="60px" color={isContraction ? 'info' : 'secondary'}>
            {shortenNumber(value, 0)}
        </Flex>,
    },
    {
        field: 'newSupply',
        label: 'New Supply',
        header: ({ ...props }) => <Flex justify="flex-end" minW="100px" {...props} />,
        value: ({ newSupply, value, isContraction }) =>
            <Flex alignItems="center" justify="space-between" color={isContraction ? 'info' : 'secondary'} pl="2" minW="100px">
                <Text textAlign="left" w="40px">{shortenNumber(newSupply - value, 0)}</Text>
                <ArrowForwardIcon />
                <Text textAlign="right" w="40px">{shortenNumber(newSupply, 0)}</Text>
            </Flex>,
    },
]

export const DolaDiagram = () => {
    const { dolaTotalSupply, fantom, feds } = useDAO();
    const { feds: fedsHistory } = useFedHistory();
    const [chosenFedIndex, setChosenFedIndex] = useState<any>(0);

    const fedsWithData = feds?.length > 0 ? feds : defaultFeds;
    const chosenFedHistory = (fedsHistory?.length > 0 ? fedsHistory[chosenFedIndex] : { events: [] });
    const fedHistoricalEvents = chosenFedHistory.events.map(event => ({ ...event, chainId: chosenFedHistory.chainId }));

    const fedOptionList = FEDS.map((fed, i) => ({
        value: i.toString(),
        label: <Flex alignItems="center">
            <Image src={getNetworkImage(fed.chainId)} w={'15px'} h={'15px'} mr="2" />
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
                        description={<Box w='full' overflow="auto">
                            <RadioCardGroup
                                wrapperProps={{ overflow: 'auto', justify: 'left', mt: '2', w: { base: '90vw', sm: '100%' } }}
                                group={{
                                    name: 'bool',
                                    defaultValue: '0',
                                    onChange: (v: string) => setChosenFedIndex(parseInt(v)),
                                }}
                                radioCardProps={{ w: '150px', textAlign: 'center', p: '2' }}
                                options={fedOptionList}
                            />
                        </Box>}
                    >
                        {
                            fedHistoricalEvents?.length > 0 ?
                                <Table
                                    keyName="transactionHash"
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

export default DolaDiagram
