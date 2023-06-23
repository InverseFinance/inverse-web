
import { useEscrowBalanceEvolution, useFirmMarketEvolution, useHistoricalPrices } from "@app/hooks/useFirm";
import { F2Market } from "@app/types";
import { useContext, useEffect, useState } from "react";
import { useAccount } from "@app/hooks/misc";
import { timestampToUTC } from "@app/util/misc";
import { ONE_DAY_MS } from "@app/config/constants";
import { F2MarketContext } from "./F2Contex";
import { WorthEvoChart } from "./WorthEvoChart";
import { useMediaQuery } from "@chakra-ui/react";

const maxWidth = 1280;

export const WorthEvoChartContainer = ({
    market
}: {
    market: F2Market,
}) => {
    const account = useAccount();

    const [chartWidth, setChartWidth] = useState<number>(maxWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxWidth+50}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxWidth : (screen.availWidth || screen.width) - 50)
    }, [isLargerThan, maxWidth]);

    const { deposits, escrow } = useContext(F2MarketContext);
    const { prices } = useHistoricalPrices(market.underlying.coingeckoId);
    const { prices: dbrPrices } = useHistoricalPrices('dola-borrowing-right');
    const { events, depositedByUser, blockNumbers } = useFirmMarketEvolution(market, account);
    const { evolution: escrowBalanceEvolution } = useEscrowBalanceEvolution(account, escrow, market.address, blockNumbers);

    const start = events ? events.find(e => e.actionName === 'Deposit')?.timestamp : undefined;

    const collateralRewards = Math.max((deposits) - depositedByUser, 0);

    const pricesAtEvents = events.map(e => {
        const price = prices.find(p => timestampToUTC(p[0]) === timestampToUTC(e.timestamp))?.[1];
        return [e.timestamp, price];
    }).filter(p => p[0] && !!p[1]);

    const now = Date.now();

    const allPrices = [
        ...pricesAtEvents,
        ...prices,
        [now, prices.find(p => timestampToUTC(p[0]) === timestampToUTC(now))?.[1] || 0],
    ].sort((a, b) => a[0] - b[0]);

    const relevantPrices = allPrices
        .filter(p => p[0] > start - ONE_DAY_MS * 2);

    const data = relevantPrices.map((p, i) => {
        const event = events.find(e => !e.isClaim && e.timestamp === p[0]);
        const histoEscrowBalanceFromApi = escrowBalanceEvolution?.findLast(e => e.timestamp <= p[0])?.balance;        
        const lastCollateralEvent = events.findLast(e => !e.isClaim && e.timestamp <= p[0]);
        const unstakedCollateralBalance = Math.max(lastCollateralEvent?.unstakedCollateralBalance || 0, 0);
        const balance = histoEscrowBalanceFromApi ?? unstakedCollateralBalance;
        const debt = Math.max(lastCollateralEvent?.debt || 0, 0);
        const claimEvent = (!event || event?.actionName !== 'ForceReplenish') ? events.find(e => e.isClaim && e.timestamp === p[0]) : undefined;
        const lastClaimEvent = events.findLast(e => e.isClaim && e.timestamp <= p[0]);
        const claims = lastClaimEvent?.claims || 0;
        const dbrPrice = dbrPrices.find(dbrPrice => timestampToUTC(dbrPrice[0]) === timestampToUTC(p[0]))?.[1] || 0;
        const timeProgression = (p[0] - start) / (now - start);

        const estimatedStakedBonus = balance - unstakedCollateralBalance;
        const claimsUsd = claims * dbrPrice;
        return {
            timestamp: p[0],
            histoPrice: p[1],
            dbrPrice,
            eventName: !!claimEvent ? 'Claim' : event?.actionName,
            claimEvent,
            isClaimEvent: !!claimEvent,
            isEvent: !!event,
            event,
            worth: unstakedCollateralBalance * p[1],
            stakedWorth: balance * p[1],
            totalWorth: claimsUsd + balance * p[1],
            debt,
            balance,
            depositedByUser,
            claims,
            timeProgression,
            estimatedStakedBonus,
            estimatedStakedBonusUsd: estimatedStakedBonus * p[1],
            claimsUsd,
        }
    });

    const hasData = data?.length > 0;
    const startPrice = hasData ? data[0].histoPrice : 0;
    const lastPrice = hasData ? data[data.length - 1].histoPrice : 0;
    const priceChangeFromStart = hasData ? (lastPrice - startPrice) / startPrice * 100 : 0;

    if(!hasData) {
        return null;
    }

    return <WorthEvoChart
        collateralRewards={collateralRewards}
        market={market}
        chartWidth={chartWidth}
        data={data}
    />
}