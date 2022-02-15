import { Box, Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useEffect, useState } from 'react'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import Link from '@app/components/common/Link'
import { shortenNumber } from '@app/util/markets'
import { useMarkets } from '@app/hooks/useMarkets'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import { Market } from '@app/types'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import ScannerLink from '@app/components/common/ScannerLink'
import { shortenAddress } from '@app/util'
import { Container } from '@app/components/common/Container';
import { AnchorMarketInterestChart } from '@app/components/Anchor/AnchorMarketInterestChart'
import { useInterestModel } from '@app/hooks/useInterestModel'
import { INTEREST_MODEL } from '@app/config/constants'

export const InterestModelPage = () => {
    const { kink, multiplierPerYear, jumpMultiplierPerYear, baseRatePerYear } = useInterestModel();
    const { markets } = useMarkets();
    const [chosenMarket, setChosenMarket] = useState<Market | null>(null);

    useEffect(() => {
        if (chosenMarket === null && markets?.length) {
            setChosenMarket(markets[0]);
        }
    }, [markets]);

    const optionList = markets
        .filter(m => m.borrowable)
        .map((market, i) => ({
            value: market.token,
            label: <UnderlyingItemBlock w="100px" symbol={market?.underlying.symbol} nameAttribute="symbol" />,
        }));

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Interest Rate Model</title>
            </Head>
            <AppNav active="Transparency" />
            <TransparencyTabs active="interest-model" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column" color="white">
                    <Container
                        noPadding={true}
                        w={{ base: 'full', lg: '900px' }}
                        contentBgColor="transparent"
                        label="Anchor Borrow Markets"
                        description={
                            <Box w={{ base: '90vw', sm: '100%' }} overflow="auto">
                                {
                                    !!chosenMarket &&
                                    <>
                                        <RadioCardGroup
                                            wrapperProps={{ overflow: 'auto', position: 'relative', justify: 'left', mt: '2', mb: '2', maxW: { base: '90vw', sm: '100%' } }}
                                            group={{
                                                name: 'market',
                                                value: chosenMarket?.token || undefined,
                                                onChange: (v: string) => setChosenMarket(markets.find(m => m.token === v)),
                                            }}
                                            radioCardProps={{ w: '120px', textAlign: 'center', p: '2', position: 'relative' }}
                                            options={optionList}
                                        />
                                        <Flex fontSize="12px" pt="2" alignItems="center">
                                            <Text color="secondary">Utilization Rate: {shortenNumber(chosenMarket?.utilizationRate * 100, 2)}%</Text>
                                            <Text ml="2">Reserve Factor: {shortenNumber(chosenMarket?.reserveFactor * 100, 2)}%</Text>
                                            <ScannerLink ml="2" label={`Contract: ${shortenAddress(chosenMarket?.token)}`} value={chosenMarket?.token} />
                                        </Flex>
                                    </>
                                }
                                <AnchorMarketInterestChart
                                    type="borrow"
                                    maxWidth={900}
                                    title="Borrow Interest Rate Model"
                                    market={chosenMarket}
                                />
                                 <AnchorMarketInterestChart
                                    type="supply"
                                    maxWidth={900}
                                    title="Supply Interest Rate Model"
                                    market={chosenMarket}
                                />
                            </Box>
                        }
                    />
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <ShrinkableInfoMessage
                        title="📈 Interest Model"
                        description={
                            <>
                                <Text>
                                    <b>Supply and Borrow Interest rates</b> are calculated according to an <b>Interest Model</b>, the interests increases with the <b>Utilization Rate</b>, after a certain Utilization Rate threshold ("kink") there's a jump in the Interest Rates.
                                </Text>
                                <Text mt="2" fontWeight="bold">
                                    Contract and Parameters:
                                </Text>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text>- Contract:</Text>
                                    <ScannerLink value={INTEREST_MODEL} />
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text>- Kink (threshold before "jump"):</Text>
                                    <Text>{shortenNumber(kink, 2)}%</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text>- Multiplier Per Year:</Text>
                                    <Text>{shortenNumber(multiplierPerYear, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text>- Jump Multiplier Per Year:</Text>
                                    <Text>{shortenNumber(jumpMultiplierPerYear, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text>- Base Rate Per Year:</Text>
                                    <Text>{shortenNumber(baseRatePerYear, 2)}</Text>
                                </Flex>
                                <Box mt="2">
                                    <Link isExternal href="https://docs.inverse.finance/inverse-finance/technical/interest-rate-model">
                                        Learn more about how the Interest Model works
                                    </Link>
                                </Box>
                            </>
                        }
                    />
                    <ShrinkableInfoMessage
                        title="What about INV and Reward APRs ?"
                        alertProps={{ mt: '5' }}
                        description={
                            <>
                                <Text>
                                    Each pool has a <b>predetermined monthly INV emission rate</b>, those are <b>rewarded on every block proportionally</b> to the amount of the asset deposited, the monthly emission rates are <b>decided by Governance vote or the Policy Committee</b>.
                                </Text>
                                <Link isExternal href="https://docs.inverse.finance/inverse-finance/using-anchor/depositing-assets#anchor-rewards">
                                    Learn more about INV rewards and their amounts
                                </Link>
                            </>
                        }
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default InterestModelPage
