import { useCacheFirstSWR } from "@app/hooks/useCustomSWR"
import { DefaultCharts } from "./DefaultCharts";
import { timestampToUTC, utcDateStringToTimestamp } from "@app/util/misc";
import { HStack, VStack, Text, Image, SimpleGrid, useMediaQuery, useInterval } from "@chakra-ui/react";
import { usePrices } from "@app/hooks/usePrices";
import { DashBoardCard, NumberAndPieCard } from "../F2/UserDashboard";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useEffect, useRef, useState } from "react";
import { getNetworkImage } from "@app/util/networks";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { SkeletonBlob } from "../common/Skeleton";

export const useVeNftEvolution = () => {
    const { data, error } = useCacheFirstSWR(`/api/transparency/venft-evolution?v=1.0.2`);
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
    const { isLoading, data, areaProps } = props;
    const [chartData, setChartData] = useState(null);
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

export const VeNftEvolutionWrapper = () => {
    const { themeStyles } = useAppTheme();
    const [now, setNow] = useState(Date.now());
    const [inited, setInited] = useState(false);

    const [isLargerThan2xl] = useMediaQuery([
        "(min-width: 96em)",
    ]);

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
                return { ...d, utcDate: d.date, x: d.timestamp, y: d[veNft.symbol], yDay: d[veNft.symbol], y2: d[`${veNft.symbol}-balance`] };
            })
                .concat(currentPrice ? [
                    {
                        x: now,
                        timestamp: now,
                        date: timestampToUTC(now),
                        utcDate: timestampToUTC(now),
                        y: (veNft.currentBalance || 0) * currentPrice,
                        y2: (veNft.currentBalance || 0),
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
        .concat(Object.keys(prices).length > 0 ? [
            {
                x: now,
                all: currentTotalUsd,
                timestamp: now,
                utcDate: timestampToUTC(now),
                y: currentTotalUsd,
                yDay: currentTotalUsd,
            }
        ] : []);

    const rangesToInclude = isLargerThan2xl ? ['All', '1Y', '6M', '3M', '1M', 'YTD'] : ['All', '1Y', '6M', '3M', 'YTD'];
    const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
    const commonCardProps = { minH: { xl: '457px' }, borderRadius: { base: '0', sm: '8' }, w: { base: '100vw', sm: 'auto' } };

    if (!inited) return null

    return <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="8" w="100%">
        <NumberAndPieCard
            title="Current veNFTs portfolio"
            cardTitleProps={{ w: "fit-content", fontSize: mainFontSize, fontWeight: 'extrabold' }}
            data={chartList}
            dataKey="currentWorth"
            fill={themeStyles.colors.mainTextColorLight}
            activeFill={themeStyles.colors.mainTextColor}
            isUsd={true}
            value={currentTotalUsd}
            label="Total veNFTs value"
            isLoading={isLoading || isLoadingPrices}
            precision={0}
            {...commonCardProps}
        />
        <DashBoardCard {...commonCardProps}>
            <VStack>
                <VStack>
                    <Text fontSize={mainFontSize} fontWeight="extrabold">Total veNFTs value evolution</Text>
                </VStack>
                <VeNftDashboardAreaChart
                    data={accChartData}
                    isLoading={isLoading}
                    isDollars={true}
                    containerProps={{ pt: '0' }}
                    areaProps={{
                        id: "veNfts-all",
                        autoMinY: true,
                        useRecharts: true,
                        showRangeBtns: true,
                        fillInByDayInterval: 1,                        
                        rangesToInclude,
                        yLabel: 'Total value',
                        mainColor: 'secondary',
                        forceStaticRangeBtns: true,
                    }}
                />
            </VStack>
        </DashBoardCard>
        {
            chartList.map(item => {
                return <DashBoardCard
                    key={item.symbol}
                    imageSrc={getNetworkImage(item.chainId)}
                    {...commonCardProps}
                >
                    <VStack>
                        <HStack>
                            <Image src={item.image} h="30px" w="30px" borderRadius="40px" />
                            <Text fontSize={mainFontSize} fontWeight="extrabold">{item.symbol} value evolution</Text>
                        </HStack>
                        <VeNftDashboardAreaChart
                            data={item.chartData}
                            isLoading={isLoading}
                            isDollars={true}
                            containerProps={{ pt: '0' }}
                            {...commonCardProps}
                            areaProps={{
                                id: `veNfts-${item.symbol}`,
                                autoMinY: true,
                                useRecharts: true,
                                showRangeBtns: true,
                                fillInByDayInterval: 1,
                                showSecondary: true,
                                secondaryRef: 'y2',
                                secondaryLabel: 'Locked amount',
                                secondaryAsUsd: false,
                                secondaryPrecision: 2,                                
                                yLabel: `Value`,
                                rangesToInclude,
                                showLegend: true,
                                legendPosition: 'bottom',
                                mainColor: 'secondary',
                                forceStaticRangeBtns: true,
                                rightPadding: isLargerThan2xl ? 0 : undefined,
                            }}
                        />
                    </VStack>
                </DashBoardCard>
            })
        }
    </SimpleGrid>
}