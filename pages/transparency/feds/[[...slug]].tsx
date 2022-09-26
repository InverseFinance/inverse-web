import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react'

import moment from 'moment'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedHistory, useFedPolicyChartData, useFedPolicyMsg, useFedRevenues, useFedRevenuesChartData } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
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
import { useEffect } from 'react';
import { FedBarChart } from '@app/components/Transparency/fed/FedBarChart'
import { FedRevenueTable } from '@app/components/Transparency/fed/FedRevenueTable'
import { useAppTheme } from '@app/hooks/useAppTheme'

const { DOLA, TOKENS, FEDS_WITH_ALL, DEPLOYER } = getNetworkConfigConstants(NetworkIds.mainnet);

export const FedPolicyPage = () => {
    const { account, library } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const { themeStyles } = useAppTheme();

    const slug = query?.slug || ['policy', 'all'];
    const queryFedName = slug[1] || 'all';
    const userAddress = (query?.viewAddress as string) || account;
    const { dolaTotalSupply, fantom, feds, optimism } = useDAO();
    const [msgUpdates, setMsgUpdates] = useState(0)

    const { totalEvents: policyEvents, isLoading: isPolicyLoading } = useFedHistory();
    const { totalEvents: profitsEvents, totalRevenues, isLoading: isProfitsLoading } = useFedRevenues();

    const { fedPolicyMsg } = useFedPolicyMsg(msgUpdates);
    const [detailsType, setDetailsType] = useState(slug[0]);

    const queryFedIndex = FEDS_WITH_ALL.findIndex(fed => fed.name.replace(' Fed', '').toLowerCase() === queryFedName.toLowerCase())
    const [chosenFedIndex, setChosenFedIndex] = useState<number>(queryFedIndex === -1 ? 0 : queryFedIndex);
    const isAllFedsCase = chosenFedIndex === 0;

    const fedPolicyEvents = isAllFedsCase ? policyEvents : policyEvents.filter(e => e.fedIndex === (chosenFedIndex - 1));
    const fedProfitsEvents = isAllFedsCase ? profitsEvents : profitsEvents.filter(e => e.fedIndex === (chosenFedIndex - 1));

    const { chartData: chartDataPolicies } = useFedPolicyChartData(fedPolicyEvents, isAllFedsCase);
    const { chartData: chartDataRevenues } = useFedRevenuesChartData(fedProfitsEvents, isAllFedsCase);

    const chosenFed = FEDS_WITH_ALL[chosenFedIndex];

    useEffect(() => {
        const queryFedIndex = FEDS_WITH_ALL.findIndex(fed => fed.name.replace(' Fed', '').toLowerCase() === queryFedName.toLowerCase())
        setChosenFedIndex(queryFedIndex === -1 ? 0 : queryFedIndex)
        setDetailsType(slug && slug[0] ? slug[0] : 'policy')
    }, [queryFedIndex, queryFedName, slug])

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
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Feds</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="Feds Policy & Revenues" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-fed-policy.png" />
                <meta name="description" content="Feds Policy & Revenues" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply, revenue" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Fed Policy" />
            <TransparencyTabs active="feds" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label={
                            <HStack alignItems="center" mb="2" spacing="4">
                                <Text fontSize="18px" fontWeight="bold" cursor="pointer" _hover={{ textDecoration: 'underline' }} color={detailsType === 'policy' ? themeStyles.colors.mainTextColor : 'gray.600'} onClick={() => setDetailsType('policy')}>
                                    Policy
                                </Text>
                                <Text fontSize="18px" fontWeight="bold" cursor="pointer" _hover={{ textDecoration: 'underline' }} color={detailsType === 'revenue' ? themeStyles.colors.mainTextColor : 'gray.600'} onClick={() => setDetailsType('revenue')}>
                                    Revenue
                                </Text>
                            </HStack>
                        }
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                <FedsSelector pb="2" feds={FEDS_WITH_ALL} setChosenFedIndex={setChosenFedIndex} value={chosenFedIndex} />
                                {
                                    detailsType === 'policy' ?
                                        <FedAreaChart
                                            title={`${chosenFed.name} Supply Evolution (Current supply: ${chartDataPolicies.length ? shortenNumber(chartDataPolicies[chartDataPolicies.length - 1].y, 1) : 0})`}
                                            fed={chosenFed}
                                            chartData={chartDataPolicies}
                                            domainYpadding={5000000}
                                        />
                                        :
                                        <>
                                            <FedAreaChart
                                                title={`${chosenFed.name} Revenue Evolution (Current accumulated revenue: ${chartDataRevenues.length ? shortenNumber(chartDataRevenues[chartDataRevenues.length - 1].y, 2) : 0})`}
                                                fed={chosenFed}
                                                chartData={chartDataRevenues}
                                                domainYpadding={50000}
                                                mainColor="secondary"
                                            />
                                            <FedBarChart chartData={chartDataRevenues} />
                                        </>
                                }
                            </Box>
                        }
                    >
                        {
                            detailsType === 'policy' ?
                                <FedPolicyTable fedHistoricalEvents={fedPolicyEvents} isLoading={isPolicyLoading} />
                                :
                                <FedRevenueTable fedHistoricalEvents={fedProfitsEvents} isLoading={isProfitsLoading} />
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
                    <SupplyInfos token={TOKENS[DOLA]} supplies={[
                        { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply - optimism?.dolaTotalSupply },
                        { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
                        { chainId: NetworkIds.optimism, supply: optimism?.dolaTotalSupply },
                    ]}
                    />
                    <SupplyInfos
                        title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
                        supplies={feds}
                    />
                    <SupplyInfos
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

export default FedPolicyPage
