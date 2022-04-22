import { Box, Flex, Text, VStack } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedHistory, useFedPolicyChartData, useFedPolicyMsg } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Container } from '@app/components/common/Container';
import { EditIcon } from '@chakra-ui/icons'
import { useState } from 'react'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router'
import { FED_POLICY_SIGN_MSG } from '@app/config/constants'
import { showToast } from '@app/util/notify'
import { FedAreaChart } from '@app/components/Transparency/fed/FedAreaChart'
import { FedsSelector } from '@app/components/Transparency/fed/FedsSelector'
import { FedPolicyTable } from '@app/components/Transparency/fed/FedPolicyTable'

const { DOLA, TOKENS, FEDS_WITH_ALL, DEPLOYER } = getNetworkConfigConstants(NetworkIds.mainnet);

const oneDay = 86400000;

export const FedPolicyPage = () => {
    const { account, library } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const userAddress = (query?.viewAddress as string) || account;
    const { dolaTotalSupply, fantom, feds } = useDAO();
    const [msgUpdates, setMsgUpdates] = useState(0)
    const { totalEvents: eventsWithFedInfos, isLoading } = useFedHistory();
    const { fedPolicyMsg } = useFedPolicyMsg(msgUpdates);
    const [chosenFedIndex, setChosenFedIndex] = useState<number>(0);
    const isAllFedsCase = chosenFedIndex === 0;
    const fedHistoricalEvents = isAllFedsCase ? eventsWithFedInfos : eventsWithFedInfos.filter(e => e.fedIndex === (chosenFedIndex - 1));
    const { chartData } = useFedPolicyChartData(fedHistoricalEvents, isAllFedsCase);
    const chosenFedHistory = FEDS_WITH_ALL[chosenFedIndex];

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
                                <FedsSelector feds={FEDS_WITH_ALL} setChosenFedIndex={setChosenFedIndex} />
                                <FedAreaChart
                                    title={`${chosenFedHistory.name} Supply Evolution (Current supply: ${chartData.length ? shortenNumber(chartData[chartData.length - 1].y, 1) : 0})`}
                                    fed={chosenFedHistory}
                                    chartData={chartData}
                                    domainYpadding={5000000}
                                />
                            </Box>
                        }
                    >
                        <FedPolicyTable fedHistoricalEvents={fedHistoricalEvents} isLoading={isLoading} />
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
