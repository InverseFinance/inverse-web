import { Box, Flex, Image, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { InfoMessage } from '@inverse/components/common/Messages'
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
                        <Table
                            keyName="transactionHash"
                            defaultSortDir="desc"
                            alternateBg={false}
                            columns={columns}
                            items={fedHistoricalEvents}
                        />
                    </Container>
                </Flex>
                <Flex direction="column" p={{ base: '4', xl: '0' }}>
                    <Flex w={{ base: 'full', xl: 'sm' }} mt="4" justify="center">
                        <SuppplyInfos token={TOKENS[DOLA]} mainnetSupply={dolaTotalSupply - fantom?.dolaTotalSupply} fantomSupply={fantom?.dolaTotalSupply} />
                    </Flex>
                    <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
                        <InfoMessage
                            title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
                            alertProps={{ fontSize: '12px', w: 'full' }}
                            description={
                                <>
                                    {fedsWithData.map(fed => {
                                        return <Flex key={fed.address} direction="row" w='full' justify="space-between">
                                            <Text>- {fed.name}:</Text>
                                            <Text>{shortenNumber(fed.supply)}</Text>
                                        </Flex>
                                    })}
                                    <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                                        <Text>- Total:</Text>
                                        <Text>{shortenNumber(fedsWithData.reduce((prev, curr) => curr.supply + prev, 0))}</Text>
                                    </Flex>
                                </>
                            }
                        />
                    </Flex>
                </Flex>
            </Flex>
        </Layout>
    )
}

export default DolaDiagram
