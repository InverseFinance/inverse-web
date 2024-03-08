import { useCacheFirstSWR } from "@app/hooks/useCustomSWR"
import { DefaultCharts } from "./DefaultCharts";
import { timestampToUTC, utcDateStringToTimestamp } from "@app/util/misc";
import { HStack, VStack, Text, Image, SimpleGrid, useMediaQuery } from "@chakra-ui/react";
import { shortenNumber } from "@app/util/markets";
import { usePrices } from "@app/hooks/usePrices";
import { DashBoardCard, NumberAndPieCard } from "../F2/UserDashboard";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useEffect, useRef, useState } from "react";
import { getNetworkImage } from "@app/util/networks";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { SkeletonBlob } from "../common/Skeleton";

export const useVeNftEvolution = () => {
    const { data, error } = useCacheFirstSWR(`/api/transparency/venft-evolution?v=2`);
    const veNfts = data?.veNfts || [];
    const accumulatedEvolutionObj = {};
    veNfts.forEach((veNft) => {
        veNft.evolution?.forEach((dailyData) => {
            if (!accumulatedEvolutionObj[dailyData.date]) {
                accumulatedEvolutionObj[dailyData.date] = { all: 0 };
            }
            const usdWorth = dailyData.balance * dailyData.price;
            accumulatedEvolutionObj[dailyData.date][veNft.symbol] = usdWorth;
            accumulatedEvolutionObj[dailyData.date][`${veNft.symbol}-price`] = dailyData.price;
            accumulatedEvolutionObj[dailyData.date][`${veNft.symbol}-balance`] = dailyData.balance;
            accumulatedEvolutionObj[dailyData.date].all += usdWorth;
            accumulatedEvolutionObj[dailyData.date].timestamp = utcDateStringToTimestamp(dailyData.date);
        });
    });
    const accumulatedEvolution = Object.entries(accumulatedEvolutionObj).map(([date, obj]) => ({ date, ...obj }));
    accumulatedEvolution.sort((a, b) => a.timestamp - b.timestamp)
    return {
        veNfts,
        accumulatedEvolution,
        accumulatedEvolutionObj,
        isLoading: !error && !data,
        isError: error
    }
}

const MAX_AREA_CHART_WIDTH = 625;
const VeNftDashboardAreaChart = (props) => {
    const { isLoading, data } = props;
    const refElement = useRef();
    const [chartData, setChartData] = useState(null);
    const [refElementWidth, setRefElementWidth] = useState(MAX_AREA_CHART_WIDTH);
    const [oldJson, setOldJson] = useState('');
    const [chartWidth, setChartWidth] = useState<number>(MAX_AREA_CHART_WIDTH);
    const [isLargerThan2xl, isLargerThanLg, isLargerThanXs] = useMediaQuery([
        "(min-width: 96em)",
        "(min-width: 62em)",
        "(min-width: 250px)",
    ]);

    useEffect(() => {
        if (!refElement?.current) return;
        setRefElementWidth(refElement.current.clientWidth);
    }, [refElement?.current])

    useEffect(() => {
        const optimal2ColWidth = ((screen.availWidth || screen.width)) / 2 - 50;
        const optimal1ColWidth = ((screen.availWidth || screen.width)) * 0.94 - 50;
        const w = !isLargerThanXs ? 250 : isLargerThan2xl ? MAX_AREA_CHART_WIDTH : isLargerThanLg ? Math.min(optimal2ColWidth, refElementWidth) : optimal1ColWidth;
        setChartWidth(w);
    }, [isLargerThan2xl, isLargerThanXs, isLargerThanLg, screen?.availWidth]);

    useDebouncedEffect(() => {
        const len = data?.length || 0;
        if (len > 0 && !isLoading && !chartData) {
            const json = len > 3 ? JSON.stringify([data[0], data[len - 2]]) : JSON.stringify(data);
            if (oldJson !== json) {
                setChartData(data);
                setOldJson(json);
            }
        }
    }, [data, isLoading, oldJson, chartData]);

    if (!chartData && isLoading) {
        return <SkeletonBlob mt="10" />
    }
    else if (!chartData) {
        return null;
    }

    // too much flickering when using the responsive container
    return <VStack w='full' ref={refElement}>
        <DefaultCharts
            chartWidth={chartWidth}
            {...props}
            chartData={chartData}
        />
    </VStack>
}

export const VeNftEvolutionWrapper = () => {
    const { themeStyles } = useAppTheme();
    const [now, setNow] = useState(Date.now());
    const [inited, setInited] = useState(false);

    useEffect(() => {
        setInited(true);
    }, [])

    const { accumulatedEvolution, veNfts, isLoading } = useVeNftEvolution();
    const { prices, isLoading: isLoadingPrices } = usePrices(veNfts.map(veNft => veNft.coingeckoId));
    const veNftsWithEvolution = veNfts.filter(veNft => veNft.evolution?.length > 0);

    const chartList = veNftsWithEvolution.map(veNft => {
        const currentPrice = prices[veNft.coingeckoId]?.usd || 0;
        return {
            ...veNft,
            currentWorth: (veNft.currentBalance || 0) * currentPrice,
            chartData: accumulatedEvolution.map(d => {
                return { ...d, utcDate: d.date, x: d.timestamp, y: d[veNft.symbol], yDay: d[veNft.symbol] };
            })
                .concat(currentPrice ? [
                    {
                        x: now,
                        timestamp: now,
                        date: timestampToUTC(now),
                        utcDate: timestampToUTC(now),
                        y: (veNft.currentBalance || 0) * currentPrice,
                        yDay: (veNft.currentBalance || 0) * currentPrice,
                        [`${veNft.symbol}`]: (veNft.currentBalance || 0) * currentPrice,
                        [`${veNft.symbol}-price`]: currentPrice,
                        [`${veNft.symbol}-balance`]: veNft.currentBalance,
                    }
                ] : [])
                .filter(item => !!item.x && item[veNft.symbol] != undefined),
        }
    });
    chartList.sort((a, b) => b.currentWorth - a.currentWorth);

    const currentTotalUsd = chartList.reduce((acc, veNft) => {
        return acc + veNft.currentWorth;
    }, 0);

    const accChartData = accumulatedEvolution.map(d => {
        return { ...d, utcDate: d.date, x: d.timestamp, y: d['all'], yDay: d['all'] };
    })
        .filter(item => !!item.x && item['all'] != undefined && veNftsWithEvolution.every(veNft => item[`${veNft.symbol}-balance`] !== undefined))
        .concat([
            {
                x: now,
                all: currentTotalUsd,
                timestamp: now,
                utcDate: timestampToUTC(now),
                y: currentTotalUsd,
                yDay: currentTotalUsd,
            }
        ]);

    if (!inited) return null

    return <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} spacing="8" w="100%">
        <NumberAndPieCard
            title="Current veNfts portfolio"
            cardTitleProps={{ w: "fit-content", fontSize: '26px', fontWeight: 'extrabold' }}
            data={chartList}
            dataKey="currentWorth"
            fill={themeStyles.colors.mainTextColorLight}
            activeFill={themeStyles.colors.mainTextColor}
            isUsd={true}
            value={currentTotalUsd}
            label="Total veNfts worth"            
            isLoading={isLoading || isLoadingPrices}
            precision={0}
        />
        <DashBoardCard>
            <VStack>
                <VStack>
                    <Text fontSize="26px" fontWeight="extrabold">Total veNfts worth evolution</Text>                    
                </VStack>
                <VeNftDashboardAreaChart
                    data={accChartData}
                    isLoading={isLoading}
                    isDollars={true}
                    containerProps={{ pt: '10' }}
                    areaProps={{
                        title: `Total veNfts worth evolution (current: ${shortenNumber(accChartData[accChartData.length - 1].y, 2, true)})`,
                        id: "veNfts-all",
                        autoMinY: true,
                        useRecharts: true,
                        showRangeBtns: true,
                        fillInByDayInterval: 1,
                        showPrice: false,
                        rangesToInclude: ['All', '1Y', '6M', '3M', '1M', 'YTD'],
                        yLabel: 'Total value',
                        mainColor: 'secondary',
                    }}
                />
            </VStack>
        </DashBoardCard>
        {
            chartList.map(item => {
                return <DashBoardCard key={item.symbol} imageSrc={getNetworkImage(item.chainId)}>
                    <VStack>
                        <HStack>
                            <Image src={item.image} h="30px" w="30px" borderRadius="40px" />
                            <Text fontSize="26px" fontWeight="extrabold">{item.symbol} worth evolution</Text>
                        </HStack>
                        <VeNftDashboardAreaChart
                            data={item.chartData}
                            isLoading={isLoading}
                            isDollars={true}
                            containerProps={{ pt: '12' }}
                            areaProps={{
                                id: `veNfts-${item.symbol}`,
                                autoMinY: true,
                                useRecharts: true,
                                showRangeBtns: true,
                                fillInByDayInterval: 1,
                                showPrice: true,
                                priceRef: `${item.symbol}-price`,
                                yLabel: `${item.symbol} value`,
                                rangesToInclude: ['All', '1Y', '6M', '3M', '1M', 'YTD'],
                                mainColor: 'secondary',
                            }}
                        />
                    </VStack>
                </DashBoardCard>
            })
        }
    </SimpleGrid>
}