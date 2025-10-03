import { useCacheFirstSWR } from "@app/hooks/useCustomSWR"
import { DefaultCharts } from "./DefaultCharts";
import { fillMissingDailyDatesWithMostRecentData, timestampToUTC, utcDateStringToTimestamp } from "@app/util/misc";
import { HStack, VStack, Text, Image, SimpleGrid, useMediaQuery, useInterval } from "@chakra-ui/react";
import { usePrices } from "@app/hooks/usePrices";
import { DashBoardCard, NumberAndPieCard } from "../F2/UserDashboard";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useEffect, useRef, useState } from "react";
import { getNetworkImage } from "@app/util/networks";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { SkeletonBlob } from "../common/Skeleton";
import { VeNftClaimsTable } from "./VeNftClaimsTable";
import { useEventsAsChartData } from "@app/hooks/misc";

export const useVeNftClaims = () => {
    const { data, error } = useCacheFirstSWR(`/api/transparency/venft-claims?v=1.0.0`);
    const veNfts = data?.veNfts || [];
    
    return {
        veNfts,
        timestamp: data?.timestamp,
        isLoading: !error && !data,
        isError: error
    }
}

const MAX_AREA_CHART_WIDTH = 625;
const VeNftDashboardAreaChart = (props) => {
    const { isLoading, data, areaProps } = props;
    const {chartData} = useEventsAsChartData(data, 'totalValue', 'totalValue', false, false);
    // const [chartData, setChartData] = useState(null);
    const [refElementWidth, setRefElementWidth] = useState(0);
    const [oldJson, setOldJson] = useState('');
    const [chartWidth, setChartWidth] = useState<number>(0);
    const [isLargerThan2xl, isLargerThanLg, isLargerThanMd, isLargerThanXs] = useMediaQuery([
        "(min-width: 96em)",
        "(min-width: 62em)",
        "(min-width: 48em)",
        "(min-width: 250px)",
    ]);

    useInterval(() => {
        setRefElementWidth(document.querySelector('.app-dashboard-card')?.clientWidth);
    }, 1000)

    useEffect(() => {
        const optimal2ColWidth = ((screen.availWidth || screen.width)) / 2 - 50;
        const optimal1ColWidth = refElementWidth - 60//(areaProps.showPrice ? 60 : 60);
        const w = isLargerThanXs && !isLargerThan2xl ? optimal1ColWidth : !isLargerThanXs ? 250 : isLargerThan2xl ? MAX_AREA_CHART_WIDTH : isLargerThanLg ? Math.min(optimal2ColWidth, refElementWidth) : optimal1ColWidth;
        setChartWidth(w);
    }, [isLargerThan2xl, areaProps, isLargerThanXs, isLargerThanLg, isLargerThanMd, refElementWidth, screen?.availWidth]);

    // useDebouncedEffect(() => {
    //     const len = data?.length || 0;
    //     if (len > 0 && !isLoading && !chartData) {
    //         const json = len > 3 ? JSON.stringify([data[0], data[len - 2]]) : JSON.stringify(data);
    //         if (oldJson !== json) {
    //             setChartData(data);
    //             setOldJson(json);
    //         }
    //     }
    // }, [data, isLoading, oldJson, chartData]);

    if (!chartData && isLoading) {
        return <SkeletonBlob mt="10" />
    }
    else if (!chartData) {
        return null;
    }
console.log(chartData);
    // too much flickering when using the responsive container
    return <VStack w='full'>
        {
            chartWidth && <DefaultCharts
                chartWidth={chartWidth}
                {...props}
                chartData={chartData}
            />
        }
    </VStack>
}

export const VeNftClaimsWrapper = () => {
    const { themeStyles } = useAppTheme();
    const [now, setNow] = useState(Date.now());
    const [inited, setInited] = useState(false);

    const [isLargerThan2xl] = useMediaQuery([
        "(min-width: 96em)",
    ]);

    useEffect(() => {
        setInited(true);
    }, [])

    const { veNfts, timestamp: claimsTimestamp, isLoading } = useVeNftClaims();

    const chartList = veNfts.map(veNft => {
        return {
            ...veNft,
            chartData: veNft.claims.map(d => {
                return { ...d, x: d.timestamp, y: d.totalValue };
            })
        }
    });

    console.log(chartList);

    const rangesToInclude = isLargerThan2xl ? ['All', '1Y', '6M', '3M', '1M', 'YTD'] : ['All', '1Y', '6M', '3M', 'YTD'];
    const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
    const commonCardProps = { minH: { xl: '457px' }, borderRadius: { base: '0', sm: '8' }, w: { base: '100vw', sm: 'auto' } };

    if (!inited) return null

    return <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="8" w="100%"> 
        {
            chartList.map(item => {
                return <DashBoardCard
                    key={item.symbol}
                    imageSrc={getNetworkImage(item.chainId)}
                    {...commonCardProps}
                    alignItems='flex-start'
                >
                    <VStack w='full'>
                        <HStack>
                            <Image src={item.image} h="30px" w="30px" borderRadius="40px" />
                            <Text fontSize={mainFontSize} fontWeight="extrabold">{item.symbol} claims</Text>
                        </HStack>
                        <VeNftDashboardAreaChart
                            data={item.chartData}
                            isLoading={isLoading}
                            isDollars={true}
                            containerProps={{ pt: '0' }}
                            {...commonCardProps}
                            showMonthlyBarChart={true}
                            showAreaChart={false}
                            areaProps={{
                                id: `veNfts-claims-${item.symbol}`,
                                autoMinY: true,
                                useRecharts: true,
                                showRangeBtns: true,
                                // fillInByDayInterval: 1,                            
                                yLabel: `Value`,
                                rangesToInclude,
                                showLegend: true,
                                legendPosition: 'bottom',
                                mainColor: 'secondary',
                                forceStaticRangeBtns: true,
                                rightPadding: isLargerThan2xl ? 0 : undefined,
                            }}
                        />
                        <VeNftClaimsTable veNft={item} events={item.claims} timestamp={claimsTimestamp} isLoading={isLoading} />
                    </VStack>
                </DashBoardCard>
            })
        }
    </SimpleGrid>
}