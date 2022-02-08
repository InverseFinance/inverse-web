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
import { useMarkets } from '@app/hooks/useMarkets'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import { Autocomplete } from '@app/components/common/Input/Autocomplete'
import { RTOKEN_SYMBOL } from '@app/variables/tokens'

const utilisationRates = [...Array(101).keys()];

export const InterestModelPage = () => {
    const { kink, multiplierPerYear, jumpMultiplierPerYear, baseRatePerYear } = useInterestModel();
    const { markets } = useMarkets();
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [reserveFactor, setReserveFactor] = useState<number>(0.2);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const borrowChartData = utilisationRates.map((utilizationRate) => {
        const belowKinkRate = utilizationRate / 100 * multiplierPerYear + baseRatePerYear;

        const normalRate = kink / 100 * multiplierPerYear + baseRatePerYear;
        const excess = utilizationRate / 100 - kink / 100;
        const jumpedRate = excess * jumpMultiplierPerYear + normalRate

        return { x: utilizationRate, y: utilizationRate <= kink ? belowKinkRate : jumpedRate }
    })

    const lendingChartData = borrowChartData.map(data => {
        const ratio = 1 - reserveFactor;
        return { x: data.x, y: data.y * ratio * data.x / 100 }
    })

    const optionList = markets
        .filter(m => m.underlying.symbol !== RTOKEN_SYMBOL)
        .map((market, i) => ({
            value: market.token,
            label: `${market.underlying.symbol} - Reserve Factor: ${market.reserveFactor * 100}%`,
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
                    <Flex justify="center" px="2">
                        <Autocomplete
                            w={isLargerThan ? '400px' : 'full'}
                            maxW="400px"
                            title="Anchor Market"
                            defaultValue={markets?.length > 0 ? markets[0].token : undefined}
                            placeholder="Choose a market"
                            list={optionList}
                            itemRenderer={(v, label) => {
                                const market = markets.find(m => m.token === v);
                                return <Flex alignItems="center" direction="row">
                                    <UnderlyingItemBlock w="150px" symbol={market?.underlying.symbol} nameAttribute="symbol" />
                                    {
                                        market?.reserveFactor !== undefined && <Text ml="1" color="white">
                                            - Reserve Factor: {(market?.reserveFactor || 0) * 100}%
                                        </Text>
                                    }
                                </Flex>
                            }}
                            onItemSelect={(item) => setReserveFactor(markets.find(m => m.token === item?.value)?.reserveFactor || 0)}
                        />
                    </Flex>
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
                                    <Text fontWeight="bold">- Multiplier Per Year:</Text>
                                    <Text>{shortenNumber(multiplierPerYear, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Jump Multiplier Per Year:</Text>
                                    <Text>{shortenNumber(jumpMultiplierPerYear, 2)}</Text>
                                </Flex>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Base Rate Per Year:</Text>
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
                </Flex>
            </Flex>
        </Layout>
    )
}

export default InterestModelPage
