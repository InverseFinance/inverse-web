import { Box, Flex, Image, Text, VStack } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { FedHistory, NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedHistory, useFedPolicyMsg } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import Table from '@app/components/common/Table'
import { Container } from '@app/components/common/Container';
import { ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon, EditIcon } from '@chakra-ui/icons'
import ScannerLink from '@app/components/common/ScannerLink'
import { useState } from 'react'
import { SkeletonBlob } from '@app/components/common/Skeleton';
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router'
import { FED_POLICY_SIGN_MSG } from '@app/config/constants'
import { showToast } from '@app/util/notify'
import { FedAreaChart } from '@app/components/Transparency/fed/FedAreaChart'
import { FedsSelector } from '@app/components/Transparency/fed/FedsSelector'

const { DOLA, TOKENS, FEDS, DEPLOYER } = getNetworkConfigConstants(NetworkIds.mainnet);

const oneDay = 86400000;

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
                <Image ignoreFallback={true} src={`${projectImage}`} w={'15px'} h={'15px'} mr="2" />
                {fedName}
            </Flex>,
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp, isContraction }) => {
            const textColor = isContraction ? 'info' : 'secondary'
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

export const FedPolicyPage = () => {
    const { account, library } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const userAddress = (query?.viewAddress as string) || account;
    const { dolaTotalSupply, fantom, feds } = useDAO();
    const [msgUpdates, setMsgUpdates] = useState(0)
    const { totalEvents: eventsWithFedInfos, isLoading } = useFedHistory();
    const { fedPolicyMsg } = useFedPolicyMsg(msgUpdates);
    const [chosenFedIndex, setChosenFedIndex] = useState<number>(0);
    const [now, setNow] = useState<number>(Date.now());

    const isAllFedsCase = chosenFedIndex === 0;

    const fedHistoricalEvents = isAllFedsCase ? eventsWithFedInfos : eventsWithFedInfos.filter(e => e.fedIndex === (chosenFedIndex - 1));
    const fedsIncludingAll = [{
        name: 'All Feds',
        projectImage: '/assets/projects/eth-ftm.webp',
        address: '',
        chainId: NetworkIds.ethftm,
    }].concat(FEDS);

    const chosenFedHistory = fedsIncludingAll[chosenFedIndex];

    const chartData = [...fedHistoricalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
        return {
            x: event.timestamp,
            y: event[isAllFedsCase ? 'newTotalSupply' : 'newSupply'],
        }
    })];

    // add today's timestamp and zero one day before first supply
    const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
    chartData.unshift({ x: minX - oneDay, y: 0 });
    chartData.push({ x: now, y: chartData[chartData.length - 1].y });

    const handlePolicyEdit = async () => {
        try {
            if (!library) { return }
            const signer = library?.getSigner()
            const newMsg = window.prompt("New Fed Chair Guidance", fedPolicyMsg.msg);

            if (newMsg === null) {
                return
            }

            const sig = await signer.signMessage(FED_POLICY_SIGN_MSG);

            showToast({ id: 'fed-policy', status: "loading", title: "In Progress" });

            setTimeout(async () => {
                const rawResponse = await fetch(`/api/transparency/fed-policy-msg`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ sig, msg: newMsg })
                });

                const result = await rawResponse.json();

                if (result.status === "success") {
                    showToast({ id: 'fed-policy', status: "success", title: "Current Fed Chair Guidance", description: "Message updated" })
                    setMsgUpdates(msgUpdates + 1)
                } else {
                    showToast({ id: 'fed-policy', status: "warning", title: "Current Fed Chair Guidance", description: "Update unauthorized" })
                }
            }, 0);
            return result;
        } catch (e: any) {
            return { status: 'warning', message: e.message || 'An error occured' }
        }
    }

    const canEditFedPolicy = userAddress === DEPLOYER;

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Fed Policy</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="DOLA Fed Policy" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-fed-policy.png" />
                <meta name="description" content="Dola & the Feds policy" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Fed Policy" />
            <TransparencyTabs active="fed-policy" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label="Fed Supplies Contractions and Expansions"
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                <FedsSelector feds={fedsIncludingAll} setChosenFedIndex={setChosenFedIndex} />
                                <FedAreaChart
                                    title={`${chosenFedHistory.name} Supply Evolution (Current supply: ${chartData.length ? shortenNumber(chartData[chartData.length - 1].y, 1) : 0})`}
                                    fed={chosenFedHistory}
                                    chartData={chartData}
                                    domainYpadding={5000000}
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
                                : isLoading ? <SkeletonBlob /> : <Text>No Contraction or Expansion has been executed yet</Text>
                        }
                    </Container>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <DolaMoreInfos />
                    <ShrinkableInfoMessage
                        title={
                            <Flex alignItems="center">
                                Current Fed Chair Guidance
                                {canEditFedPolicy && <EditIcon cursor="pointer" ml="1" color="blue.500" onClick={handlePolicyEdit} />}
                            </Flex>
                        }
                        description={
                            <>
                                {
                                    fedPolicyMsg?.lastUpdate !== null &&
                                    <Text>{moment(fedPolicyMsg?.lastUpdate).format('MMM Do YYYY')}</Text>
                                }
                                <Text>{fedPolicyMsg?.msg}</Text>
                            </>
                        }
                    />
                    <SuppplyInfos token={TOKENS[DOLA]} supplies={[
                        { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply },
                        { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
                    ]}
                    />
                    <SuppplyInfos
                        title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
                        supplies={feds}
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default FedPolicyPage
