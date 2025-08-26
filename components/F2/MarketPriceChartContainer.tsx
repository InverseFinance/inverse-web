import { useHistoOraclePrices } from "@app/hooks/useFirm";
import { F2Market } from "@app/types";
import { useEffect, useState } from "react";
import { useMediaQuery, VStack } from "@chakra-ui/react";
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'
import { DefaultCharts } from "../Transparency/DefaultCharts";
import Container from "../common/Container";

const maxWidth = 1200;

export const useMarketPriceChart = (
    market: F2Market,
) => {
    const [now, setNow] = useState(Date.now());

    const { evolution: histoOraclePricesEvolution, isLoading: isLoadingOracleHistoPrices } = useHistoOraclePrices(market.address);

    const [isLoadingDebounced, setIsLoadingDebounced] = useState(true);

    const isLoading = isLoadingOracleHistoPrices;

    useDualSpeedEffect(() => {
        setIsLoadingDebounced(isLoading);
    }, [isLoading], isLoading, 7000, 1000);

    const currentPrice = market?.price || 0;

    const data = histoOraclePricesEvolution;

    const hasData = data?.length > 0;

    if (!hasData) {
        return { data: null, isLoading: isLoadingDebounced, isError: !isLoadingDebounced && !hasData };
    }

    data.push({
        ...data[data.length - 1],
        price: currentPrice,
        timestamp: now,
    });

    return { data, isLoading: isLoadingDebounced, isError: !isLoadingDebounced && !hasData };
}

export const MarketPriceChartWrapper = ({
    market
}: {
    market: F2Market,
}) => {
    const [chartWidth, setChartWidth] = useState<number>(maxWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxWidth + 50}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxWidth : (screen.availWidth || screen.width) - 50)
    }, [isLargerThan, maxWidth]);

    return <MarketPriceChartContainer chartWidth={chartWidth} market={market} />
}

export const MarketPriceChartContainer = ({
    market,
    chartWidth,
}: {
    market: F2Market,
    chartWidth: number,
}) => {
    const { data, isLoading } = useMarketPriceChart(market);
    if (!data?.length) return null;
    return <Container noPadding m="0" p="0" label="Daily collateral price evolution" description="According to the pessimistic oracle">
        <VStack mt="10">
            <DefaultCharts
                showMonthlyBarChart={false}
                maxChartWidth={chartWidth}
                chartWidth={chartWidth}
                chartData={data}
                isDollars={true}
                smoothLineByDefault={true}
                areaProps={{ title: '', duplicateYAxis: true, id: 'daily-oracle-price', showRangeBtns: true, yLabel: 'Price', useRecharts: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, fillInByDayInterval: false, simplifyData: false, defaultRange: '1M', rangesToInclude: ['All', '1Y', '3M', '1M', '7D'], }}
            />
        </VStack>
    </Container>
}