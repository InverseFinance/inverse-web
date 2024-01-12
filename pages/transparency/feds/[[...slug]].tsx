import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useFedHistory, useFedPolicyChartData, useFedIncome, useFedIncomeChartData } from '@app/hooks/useDAO'
import { shortenNumber } from '@app/util/markets'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Container } from '@app/components/common/Container';
import { useState } from 'react'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { useRouter } from 'next/router'
import { FedAreaChart } from '@app/components/Transparency/fed/FedAreaChart'
import { FedsSelector } from '@app/components/Transparency/fed/FedsSelector'
import { FedPolicyTable } from '@app/components/Transparency/fed/FedPolicyTable'
import { useEffect } from 'react';
import { FedBarChart } from '@app/components/Transparency/fed/FedBarChart'
import { FedIncomeTable } from '@app/components/Transparency/fed/FedIncomeTable'
import { DolaSupplies } from '@app/components/common/Dataviz/DolaSupplies'

const { FEDS, FEDS_WITH_ALL } = getNetworkConfigConstants(NetworkIds.mainnet);

export const FedPolicyPage = () => {
    const { query } = useRouter();

    const slug = query?.slug || ['policy', 'all'];
    const queryFedName = slug[1] || 'all';

    const { totalEvents: policyEvents, isLoading: isPolicyLoading, feds: policyFeds, dolaSupplies } = useFedHistory();
    const { totalEvents: profitsEvents, totalFedsIncomes, isLoading: isProfitsLoading } = useFedIncome();

    const [detailsType, setDetailsType] = useState(slug[0]);

    const queryFedIndex = FEDS_WITH_ALL.findIndex(fed => fed.name.replace(' Fed', '').toLowerCase() === queryFedName.toLowerCase())
    const [chosenFedIndex, setChosenFedIndex] = useState<number>(queryFedIndex === -1 ? 0 : queryFedIndex);
    const isAllFedsCase = chosenFedIndex === 0;

    const fedPolicyEvents = isAllFedsCase ? policyEvents : policyEvents.filter(e => e.fedIndex === (chosenFedIndex - 1));
    const fedProfitsEvents = (isAllFedsCase ? profitsEvents : profitsEvents.filter(e => e.fedIndex === (chosenFedIndex - 1)))
        .map(event => {
            return { ...event, incomeChainId: FEDS[event.fedIndex].incomeChainId }
        });

    const { chartData: chartDataPolicies } = useFedPolicyChartData(fedPolicyEvents, isAllFedsCase);
    const { chartData: chartDataIncomes, chartBarData: charBarDataIncomes } = useFedIncomeChartData(fedProfitsEvents, isAllFedsCase);

    const chosenFed = FEDS_WITH_ALL[chosenFedIndex];

    useEffect(() => {
        const queryFedIndex = FEDS_WITH_ALL.findIndex(fed => fed.name.replace(' Fed', '').toLowerCase() === queryFedName.toLowerCase())
        setChosenFedIndex(queryFedIndex === -1 ? 0 : queryFedIndex)
        setDetailsType(slug && slug[0] ? slug[0] : 'policy')
    }, [queryFedIndex, queryFedName, slug])

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Transparency Feds</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="Feds Policy & Income" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
                <meta name="description" content="Feds Policy & Income" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply, income" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Feds Policy & Income" hideAnnouncement={true} />
            <TransparencyTabs active="feds" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        label={
                            <HStack alignItems="center" mb="2" spacing="4">
                                <Text fontSize="18px" fontWeight="bold" cursor="pointer" _hover={{ textDecoration: 'underline' }} opacity={detailsType === 'policy' ? 1 : 0.6} color={'mainTextColor'} onClick={() => setDetailsType('policy')}>
                                    Policy
                                </Text>
                                <Text fontSize="18px" fontWeight="bold" cursor="pointer" _hover={{ textDecoration: 'underline' }} opacity={detailsType === 'income' ? 1 : 0.6} color={'mainTextColor'} onClick={() => setDetailsType('income')}>
                                    Income
                                </Text>
                            </HStack>
                        }
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                <FedsSelector pb="2" feds={FEDS_WITH_ALL} setChosenFedIndex={setChosenFedIndex} value={chosenFedIndex} />
                                {
                                    detailsType === 'policy' ?
                                        <Box id='policy-chart-wrapper' w='full' alignItems="center">
                                            <FedAreaChart
                                                title={`${chosenFed.name} Supply Evolution\n(Current supply: ${fedPolicyEvents.length ? shortenNumber(Math.max(fedPolicyEvents[fedPolicyEvents.length - 1][isAllFedsCase ? 'newTotalSupply' : 'newSupply'], 0), 2) : 0})`}
                                                fed={chosenFed}
                                                chartData={chartDataPolicies}
                                                domainYpadding={'auto'}
                                                id='policy-chart'
                                                yLabel="Supply"
                                                useRecharts={true}                                                
                                                mainColor="info"
                                            />
                                        </Box>
                                        :
                                        <Box id='income-chart-wrapper' w='full' alignItems="center">
                                            <FedAreaChart
                                                title={`${chosenFed.name} Income Evolution\n(Current accumulated income: ${chartDataIncomes.length ? shortenNumber(chartDataIncomes[chartDataIncomes.length - 1].y, 2) : 0})`}
                                                fed={chosenFed}
                                                chartData={chartDataIncomes}
                                                domainYpadding={'auto'}
                                                mainColor="secondary"
                                                id='income-chart'
                                                yLabel="Acc. Income"
                                                useRecharts={true}
                                            />
                                            <FedBarChart chartData={charBarDataIncomes} />
                                        </Box>
                                }
                            </Box>
                        }
                    >
                        {
                            detailsType === 'policy' ?
                                <FedPolicyTable fedHistoricalEvents={fedPolicyEvents} isLoading={isPolicyLoading} />
                                :
                                <FedIncomeTable fedHistoricalEvents={fedProfitsEvents} isLoading={isProfitsLoading} />
                        }
                    </Container>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <DolaMoreInfos />
                    {/* <ShrinkableInfoMessage
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
                    /> */}
                    <DolaSupplies supplies={dolaSupplies.filter(chain => chain.supply > 0)} />
                    <SupplyInfos
                        title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
                        supplies={
                            policyFeds.map((fed, fedIndex) => {
                                return { supply: Math.max(fed.supply, 0), chainId: fed.chainId, name: fed.name, projectImage: fed.projectImage }
                            }).filter(fed => fed.supply > 0)
                        }
                    />
                    <SupplyInfos
                        title="🦅&nbsp;&nbsp;DOLA Fed Incomes"
                        supplies={
                            FEDS.map((fed, fedIndex) => {
                                return { supply: totalFedsIncomes[fedIndex], chainId: fed.chainId, name: fed.name, projectImage: fed.projectImage }
                            })
                        }
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default FedPolicyPage
