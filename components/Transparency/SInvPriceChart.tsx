import { timestampToUTC } from "@app/util/misc";
import { DefaultCharts } from "./DefaultCharts";
import { useMediaQuery, VStack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Container from "../common/Container";
import { SkeletonBlob } from "../common/Skeleton";
import { useInvStakingEvolution } from "@app/util/sINV";
import { InfoMessage } from "../common/Messages";

const maxChartWidth = 1160

export const SInvPriceChart = () => {
    const { evolution: sInvEvolution, isLoading: isSInvEvolutionLoading } = useInvStakingEvolution();
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    const isLoading = isSInvEvolutionLoading;

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    const combodata = sInvEvolution?.map(d => {
        const date = timestampToUTC(d.timestamp);
        return {
            date,
            utcDate: date,
            timestamp: d.timestamp,
            x: d.timestamp,
            price: d.invMarketPrice,
            y: d.sInvPrice,
            sInvPrice: d.sInvPrice,
        }
    })// v2 start
    .filter(d => d.timestamp >= 1726533053593);

    return <VStack spacing={0} w='full'>
        <Container p="0" noPadding w='full'>
            {
                isLoading ? <SkeletonBlob skeletonHeight={6} noOfLines={5} /> :
                    <VStack pt="10" position="relative">
                        <DefaultCharts
                            showMonthlyBarChart={false}
                            maxChartWidth={autoChartWidth}
                            chartWidth={autoChartWidth}
                            chartData={combodata}
                            isDollars={true}
                            areaProps={{
                                useUsd: true,
                                duplicateYAxis: true,
                                // defaultRange: '2Y',
                                pricePrecision: 2,
                                showSecondary: true,
                                secondaryRef: 'price',
                                secondaryLabel: 'Inv market price',
                                iii: true,
                                interpolation: "monotone",
                                titleProps: { fontSize: { base: '18px', md: '24px' } },
                                rangesToInclude: ['All', '2Y', '1Y', '6M', '3M'],
                                title: `sINV price evolution`, id: 'sinv-prices-chart', showRangeBtns: true, yLabel: 'sINV Price', useRecharts: true, simplifyData: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'secondary', allowZoom: true
                            }}
                        />
                        <InfoMessage
                            alertProps={{ w: 'full' }}
                            description={
                                <VStack w='full' align='flex-start'>
                                    <Text>This chart shows sINV price evolution and INV market price evolution.</Text>
                                    <Text>sINV price will always be higher than INV price and the gap will only grow over time.</Text>
                                </VStack>
                            }
                        />
                    </VStack>
            }
        </Container>
    </VStack >
}