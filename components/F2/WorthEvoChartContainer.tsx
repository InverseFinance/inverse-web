
import { useEscrowBalanceEvolution, useFirmMarketEvolution, useHistoOraclePrices, useHistoricalPrices, useINVEscrowRewards } from "@app/hooks/useFirm";
import { F2Market } from "@app/types";
import { useContext, useEffect, useState } from "react";
import { useAccount } from "@app/hooks/misc";
import { timestampToUTC } from "@app/util/misc";
import { BURN_ADDRESS, ONE_DAY_MS } from "@app/config/constants";
import { F2MarketContext } from "./F2Contex";
import { WorthEvoChart } from "./WorthEvoChart";
import { useMediaQuery } from "@chakra-ui/react";
import { usePrices } from "@app/hooks/usePrices";
import { useDBRPrice } from "@app/hooks/useDBR";
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'

const maxWidth = 1200;

const useFirmUserPositionEvolution = (
    market: F2Market,
    priceRef: 'oracleHistoPrice' | 'cgHistoPrice' = 'oracleHistoPrice',
    currentClaimableDbrRewards = 0,
) => {
    const account = useAccount();

    const { deposits, escrow, debt, firmActionIndex } = useContext(F2MarketContext);
    const { prices: cgHistoPrices, isLoading: isLoadingHistoPrices } = useHistoricalPrices(market.underlying.coingeckoId);
    const { evolution: histoOraclePricesEvolution, isLoading: isLoadingOracleHistoPrices } = useHistoOraclePrices(market.address);
    const { prices: dbrPrices } = useHistoricalPrices('dola-borrowing-right');
    const { prices, isLoading: isLoadingPrices } = usePrices();
    const { price: dbrPrice } = useDBRPrice();
    // events from user wallet, can be not fetched for some wallet providers
    const { events: _events, depositedByUser: depositedByUserLive } = useFirmMarketEvolution(market, account);
    const [isLoadingDebounced, setIsLoadingDebounced] = useState(true);
    // from api
    const { evolution: escrowBalanceEvolution, timestamps, isLoading: isLoadingEscrowEvo, formattedEvents, depositedByUser: depositedByUserApi } = useEscrowBalanceEvolution(account, escrow, market.address, firmActionIndex);
    const events = !_events?.length ? formattedEvents : _events?.map(e => ({ ...e, timestamp: e.timestamp || timestamps[e.blockNumber] })).filter(e => !!e.timestamp);    
    const isLoading = isLoadingOracleHistoPrices || isLoadingHistoPrices || isLoadingPrices || isLoadingEscrowEvo;

    useDualSpeedEffect(() => {
        setIsLoadingDebounced(isLoading);
    }, [isLoading], isLoading, 7000, 1000);
    
    const start = events.find(e => e.actionName === 'Deposit')?.timestamp;
    const _depositedByUser = depositedByUserLive || depositedByUserApi;
    const collateralRewards = _depositedByUser > 0 ? Math.max((deposits) - _depositedByUser, 0) : 0;

    const pricesAtEvents = events.map(e => {
        const price = cgHistoPrices.find(p => timestampToUTC(p[0]) === timestampToUTC(e.timestamp))?.[1];
        return [e.timestamp, price];
    }).filter(p => p[0] && !!p[1]);

    const now = Date.now();

    const allPrices = [
        ...pricesAtEvents,
        ...cgHistoPrices,
        [now, cgHistoPrices.find(p => timestampToUTC(p[0]) === timestampToUTC(now))?.[1] || 0],
    ].sort((a, b) => a[0] - b[0]);

    const relevantPrices = (priceRef === 'cgHistoPrice' ? allPrices : histoOraclePricesEvolution)
        .filter(p => p[0] > start - ONE_DAY_MS * 2);

    const currentPrice = priceRef === 'cgHistoPrice' ? (!!prices ? prices[market.underlying.coingeckoId] : 0) : market.price;

    const data = relevantPrices.map((p, i) => {
        const event = events.find(e => !e.isClaim && e.timestamp === p[0]);
        const histoEscrowDataFromApi = escrowBalanceEvolution?.findLast(e => e.timestamp <= p[0]);
        const histoEscrowBalance = histoEscrowDataFromApi?.balance;
        const histoEscrowDbrClaimable = histoEscrowDataFromApi?.dbrClaimable;
        const lastCollateralEvent = events.findLast(e => !e.isClaim && e.timestamp <= p[0]);
        const unstakedCollateralBalance = Math.max(lastCollateralEvent?.unstakedCollateralBalance || 0, 0);
        const balance = histoEscrowBalance || unstakedCollateralBalance;
        const debt = Math.max(lastCollateralEvent?.debt || 0, 0);
        const claimEvent = (!event || event?.actionName !== 'ForceReplenish') ? events.find(e => e.isClaim && e.timestamp === p[0]) : undefined;
        const lastClaimEvent = events.findLast(e => e.isClaim && e.timestamp <= p[0]);
        const claims = lastClaimEvent?.claims || 0;
        const dbrHistoPrice = dbrPrices.find(dbrPrice => timestampToUTC(dbrPrice[0]) === timestampToUTC(p[0]))?.[1] || 0;

        const estimatedStakedBonus = balance - unstakedCollateralBalance;
        const rewardsUsd = ((claims + histoEscrowDbrClaimable) * dbrHistoPrice) || 0;
        const estimatedStakedBonusUsd = estimatedStakedBonus * p[1];
        const priceToUse = p[1];
        return {
            timestamp: p[0],
            cgHistoPrice: priceToUse,  
            oracleHistoPrice: priceToUse,
            dbrPrice: dbrHistoPrice,
            eventName: !!claimEvent ? 'Claim' : event?.actionName,
            claimEvent,
            isClaimEvent: !!claimEvent,
            isEvent: !!event,
            event,
            depositsOnlyWorth: unstakedCollateralBalance * priceToUse,
            balanceWorth: balance * priceToUse,
            totalWorth: rewardsUsd + balance * priceToUse,
            totalRewardsUsd: rewardsUsd + estimatedStakedBonusUsd,
            // TODO: histo price dola
            debtUsd: debt,
            debt,
            balance,
            depositedByUser: _depositedByUser,
            dbrClaimed: claims,
            dbrRewards: (claims + histoEscrowDbrClaimable||0)||0,
            dbrClaimable: histoEscrowDbrClaimable,
            estimatedStakedBonus,
            estimatedStakedBonusUsd,
            rewardsUsd,
        }
    });

    const hasData = data?.length > 0;

    if (!start || !hasData || (!events.length && !escrowBalanceEvolution.length)) {
        return { data: null, isLoading: isLoadingDebounced, isError: !isLoadingDebounced && !hasData };
    }

    const dbrRewards = (data[data.length - 1].dbrClaimed + currentClaimableDbrRewards);
    const rewardsUsd = dbrRewards * dbrPrice;

    data.push({
        ...data[data.length - 1],
        cgHistoPrice: currentPrice,
        oracleHistoPrice: currentPrice,
        dbrPrice,
        isEvent: false,
        isClaimEvent: false,
        timestamp: now,
        debt,
        debtUsd: debt,
        balance: deposits,
        balanceWorth: deposits * currentPrice,
        totalWorth: deposits * currentPrice + rewardsUsd,
        estimatedStakedBonus: collateralRewards,
        estimatedStakedBonusUsd: collateralRewards * currentPrice,
        totalRewardsUsd: rewardsUsd + collateralRewards * currentPrice,
        rewardsUsd,
        dbrRewards,
    });

    return { data, walletSupportsEvents: events?.length > 0, isLoading: isLoadingDebounced, isError: !isLoadingDebounced && !hasData };
}

export const WorthEvoChartWrapper = ({
    market
}: {
    market: F2Market,
}) => {
    const { escrow } = useContext(F2MarketContext);
    const [chartWidth, setChartWidth] = useState<number>(maxWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxWidth + 50}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxWidth : (screen.availWidth || screen.width) - 50)
    }, [isLargerThan, maxWidth]);

    if(!escrow || escrow === BURN_ADDRESS) {
        return null
    }

    if(market.isInv) {
        return <WorthEvoChartContainerINV chartWidth={chartWidth} market={market} />
    }

    return <WorthEvoChartContainer chartWidth={chartWidth} market={market} />
}

export const WorthEvoChartContainer = ({
    market,
    chartWidth,
}: {
    market: F2Market,
    chartWidth: number,
}) => {
    const { data, isLoading, walletSupportsEvents } = useFirmUserPositionEvolution(market);

    return <WorthEvoChart
        isLoading={isLoading}
        chartWidth={chartWidth}
        market={market}
        data={data}
        priceRef={'oracleHistoPrice'}
        walletSupportsEvents={walletSupportsEvents}
    />
}

export const WorthEvoChartContainerINV = ({
    market,
    chartWidth,
}: {
    market: F2Market,
    chartWidth: number,
}) => {
    const { escrow } = useContext(F2MarketContext);
    const { rewards } = useINVEscrowRewards(escrow);
    const { data, isLoading, walletSupportsEvents } = useFirmUserPositionEvolution(market, 'cgHistoPrice', rewards);

    return <WorthEvoChart
        isLoading={isLoading}
        market={market}
        chartWidth={chartWidth}
        data={data}
        priceRef={'cgHistoPrice'}
        walletSupportsEvents={walletSupportsEvents}
    />
}