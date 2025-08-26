import { useHistoOraclePrices } from "@app/hooks/useFirm";
import { F2Market } from "@app/types";
import { useEffect, useState } from "react";
import { timestampToUTC } from "@app/util/misc";
import { ONE_DAY_MS } from "@app/config/constants";
import { WorthEvoChart } from "./WorthEvoChart";
import { useMediaQuery } from "@chakra-ui/react";
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'

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

    const oraclePricesStartTs = histoOraclePricesEvolution[0]?.[0] || 0;

    const relevantPrices = histoOraclePricesEvolution
        .filter(p => p[0] > oraclePricesStartTs - ONE_DAY_MS * 2);

    const currentPrice = market?.price || 0;

    const data = relevantPrices.map((p, i) => {
        let priceToUse = p[1];
        return {
            timestamp: p[0],
            utcDate: timestampToUTC(p[0]),
            comboPrice: priceToUse,
            cgHistoPrice: priceToUse,
            oracleHistoPrice: priceToUse,        
        }
    });

    const hasData = data?.length > 0;

    if (!hasData) {
        return { data: null, isLoading: isLoadingDebounced, isError: !isLoadingDebounced && !hasData };
    }

    data.push({
        ...data[data.length - 1],
        cgHistoPrice: currentPrice,
        oracleHistoPrice: currentPrice,
        comboPrice: currentPrice,
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

    return <WorthEvoChart
        isLoading={isLoading}
        chartWidth={chartWidth}
        market={market}
        data={data}
        priceRef={'oracleHistoPrice'}
        walletSupportsEvents={false}
        noAnimation={true}
    />
}