import { useCacheFirstSWR } from "@app/hooks/useCustomSWR"
import Container from "../common/Container"
import { DefaultCharts } from "./DefaultCharts";
import { useEventsAsChartData } from "@app/hooks/misc";
import { utcDateStringToTimestamp } from "@app/util/misc";
import { VStack } from "@chakra-ui/react";

export const useVeNftEvolution = () => {
    const { data, error } = useCacheFirstSWR(`/api/transparency/venft-evolution`);    
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
    const { accumulatedEvolution } = useVeNftEvolution();
    const { chartData } = useEventsAsChartData(accumulatedEvolution, 'all', 'all');
    const chartDataVelo = accumulatedEvolution.map(d => {
        return { ...d, utcDate: d.date, x: d.timestamp, y: d['veVELO'], yDay: d['veVELO'] }
    });
    const chartDataAero = accumulatedEvolution.map(d => {
        return { ...d, utcDate: d.date, x: d.timestamp, y: d['veAERO'], yDay: d['veAERO'] }
    });
    return <Container
        label="VeNFT Evolution"
    >
        <VStack>
            <DefaultCharts
                chartData={chartData}
                isDollars={true}
                containerProps={{ pt: '10' }}
                areaProps={{
                    autoMinY: true,
                    useRecharts: true,
                    showRangeBtns: true,
                    fillInByDayInterval: 1,
                    showPrice: false,                    
                    rangesToInclude: ['All', '1Y', '6M', '3M', '1M', 'YTD'],
                    yLabel: 'ALl veNFTs value',
                    mainColor: 'info',
                }}
            />
            <DefaultCharts
                chartData={chartDataAero}
                isDollars={true}
                containerProps={{ pt: '10' }}
                areaProps={{
                    autoMinY: true,
                    useRecharts: true,
                    showRangeBtns: true,
                    fillInByDayInterval: 1,
                    showPrice: true,
                    priceRef: 'veAERO-price',
                    rangesToInclude: ['All', '1Y', '6M', '3M', '1M', 'YTD'],
                    yLabel: 'veAERO value',
                    mainColor: 'info',
                }}
            />
            <DefaultCharts
                chartData={chartDataVelo}
                isDollars={true}
                containerProps={{ pt: '10' }}
                areaProps={{
                    autoMinY: true,
                    useRecharts: true,
                    showRangeBtns: true,
                    fillInByDayInterval: 1,
                    showPrice: true,
                    priceRef: 'veVELO-price',
                    yLabel: 'veVELO value',
                    rangesToInclude: ['All', '1Y', '6M', '3M', '1M', 'YTD'],                    
                    mainColor: 'info',
                }}
            />
        </VStack>
    </Container>
}