import { useCacheFirstSWR } from "@app/hooks/useCustomSWR"
import Container from "../common/Container"
import { DefaultCharts } from "./DefaultCharts";
import { useEventsAsChartData } from "@app/hooks/misc";
import { timestampToUTC, utcDateStringToTimestamp } from "@app/util/misc";
import { HStack, VStack, Text, Image } from "@chakra-ui/react";
import { shortenNumber } from "@app/util/markets";
import { usePrices } from "@app/hooks/usePrices";
import { NumberAndPieCard } from "../F2/UserDashboard";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useState } from "react";

export const useVeNftEvolution = () => {
    const { data, error } = useCacheFirstSWR(`/api/transparency/venft-evolution?`);
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

export const VeNftEvolutionWrapper = () => {
    const { themeStyles } = useAppTheme();
    const [now, setNow] = useState(Date.now());
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
            .concat([
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
            ])
            .filter(item => !!item.x && item[veNft.symbol] != undefined),
        }
    });

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

    return <VStack>
        <NumberAndPieCard
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
        <Container
            label="veNfts Portfolio Evolution"
            description={`Current value: ${shortenNumber(currentTotalUsd, 2, true)}`}
        >
            <VStack>
                <DefaultCharts
                    chartData={accChartData}
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
                {
                    chartList.map(item => {
                        return <VStack>
                            <HStack>
                                <Image src={item.image} h="30px" w="30px" borderRadius="40px" />
                                <Text fontSize="26px" fontWeight="extrabold">{item.symbol} worth evolution</Text>
                            </HStack>
                            <DefaultCharts
                                chartData={item.chartData}
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
                                    mainColor: 'primary',
                                }}
                            />
                        </VStack>
                    })
                }
            </VStack>
        </Container>
    </VStack >
}