import { Box, Flex, Text, useMediaQuery } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useEffect, useState } from 'react'
import { InterestModelChart } from '@app/components/Transparency/InterestModelChart'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import Link from '@app/components/common/Link'
import { useInterestModel } from '@app/hooks/useInterestModel'
import { shortenNumber } from '@app/util/markets'

const utilisationRates = [...Array(101).keys()];

export const InterestModelPage = () => {
    const { kink, multiplierPerBlock, jumpMultiplierPerYear, baseRatePerBlock, reserveFactors } = useInterestModel();
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [reserveFactor, setReserveFactor] = useState<number>(0.2);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const borrowChartData = utilisationRates.map((utilizationRate) => {
        const belowKinkRate = utilizationRate / 100 * multiplierPerBlock + baseRatePerBlock;

        const normalRate = kink / 100 * multiplierPerBlock + baseRatePerBlock;
        const excess = utilizationRate / 100 - kink / 100;
        const jumpedRate = excess * jumpMultiplierPerYear + normalRate

        return { x: utilizationRate, y: utilizationRate <= kink ? belowKinkRate : jumpedRate }
    })

    const lendingChartData = borrowChartData.map(data => {
        const ratio = 1 - reserveFactor;
        return { x: data.x, y: data.y * ratio }
    })

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Interest Rate Model</title>
            </Head>
            <AppNav active="Transparency" />
            <TransparencyTabs active="interest-model" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column">
                    <InterestModelChart
                        title={`Borrowing Interest Rate Model`}
                        kink={kink}
                        showTooltips={true}
                        height={300}
                        width={chartWidth}
                        data={borrowChartData}
                        interpolation={'basis'}
                    />
                    <InterestModelChart
                        title={`Lending Interest Rate Model`}
                        kink={kink}
                        showTooltips={true}
                        height={300}
                        width={chartWidth}
                        data={lendingChartData}
                        interpolation={'basis'}
                    />
                </Flex>
                <Flex direction="column" p={{ base: '4', xl: '0' }} ml="2">
                    <ShrinkableInfoMessage
                        title="📈 Interest Model Parameters"
                        description={
                            <>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Kink:</Text>
                                    <Text>{shortenNumber(kink, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Multiplier Per Block:</Text>
                                    <Text>{shortenNumber(multiplierPerBlock, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Jump Multiplier Per Year:</Text>
                                    <Text>{shortenNumber(jumpMultiplierPerYear, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Lending IR = Borrowing IR * 0.8</Text>
                                </Flex>
                                <Box mt="2">
                                    <Link isExternal href="https://docs.inverse.finance/inverse-finance/technical/interest-rate-model">
                                        Learn more about how the Interest Model works
                                    </Link>
                                </Box>
                            </>
                        }
                    />
                </Flex>
            </Flex>
        </Layout>
    )
}

export default InterestModelPage
