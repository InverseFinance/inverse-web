import { ONE_DAY_MS } from '@app/config/constants';
import { SWR } from '@app/types';
import { timestampToUTC } from '@app/util/misc';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@app/util/wallet';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useActiveAccount } from "thirdweb/react";
 

// Hook
export function useOnScreen(ref, rootMargin = "0px") {
    // State and setter for storing whether element is visible
    const [isIntersecting, setIntersecting] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Update our state when observer callback fires
                setIntersecting(entry.isIntersecting);
            },
            {
                rootMargin,
            }
        );
        if (ref?.current) {
            observer?.observe(ref.current);
        }
        return () => {
            if (ref?.current) {
                observer?.unobserve(ref.current);
            }
        };
    }, []); // Empty array ensures that effect is only run on mount and unmount
    return isIntersecting;
}

export const useAccount = (ad?: string) => {
    const activeAccount = useActiveAccount();
    const account = activeAccount?.address
    // const { account } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const viewAs = (query?.viewAddress as string);
    return ad || viewAs || account;
}

export const getDateChartInfo = (ts: number) => {
    const date = new Date(ts);
    return {
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        utcDate: timestampToUTC(ts),
    }
}

export const useEventsAsChartData = (
    events: (any & { timestamp: number })[],
    yAccAttribute: string,
    yAttribute: string,
    autoAddToday = true,
    autoAddZeroYAtStart = true,
    todayValue?: number,
): SWR & { chartData: any } => {
    const now = new Date();
    let acc = 0;
    const chartData = [...(events || [])
        .map((d, i) => (!d.timestamp && i > 0 ? ({ ...d, timestamp: events.find((e, j) => j > i && e.timestamp > 0)?.timestamp }) : d))
        .sort((a, b) => a.timestamp - b.timestamp).map(event => {
            acc += event[yAttribute];
            return {
                ...event,
                x: event.timestamp,
                y: event[yAccAttribute] ?? acc,
                yDay: event[yAttribute],
                eventPointLabel: event.eventPointLabel,
                ...getDateChartInfo(event.timestamp),
            }
        })];

    if (autoAddZeroYAtStart) {
        const minX = chartData.length > 0 ? Math.min(...chartData.filter(d => d.x > 0).map(d => d.x)) : 1577836800000;
        const startTs = minX - ONE_DAY_MS;
        chartData.unshift({ x: startTs, y: 0, yDay: 0, ...getDateChartInfo(startTs) });
    }
    if (autoAddToday) {
        const value = todayValue ?? (chartData[chartData.length - 1]?.y || 0);
        chartData.push({ x: +(now), y: value, ...getDateChartInfo(+(now)) });
    }

    return {
        chartData,
    }
}

