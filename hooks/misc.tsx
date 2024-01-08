import { ONE_DAY_MS } from '@app/config/constants';
import { SWR } from '@app/types';
import { timestampToUTC } from '@app/util/misc';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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
    const { account } = useWeb3React<Web3Provider>();
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
): SWR & { chartData: any } => {
    const now = new Date();
    let acc = 0;
    const chartData = [...(events||[]).sort((a, b) => a.timestamp - b.timestamp).map(event => {        
        acc += event[yAttribute];
        return {
            x: event.timestamp,
            y: event[yAccAttribute]??acc,
            yDay: event[yAttribute],
            eventPointLabel: event.eventPointLabel,
            ...getDateChartInfo(event.timestamp),
        }
    })];
    
    if(autoAddZeroYAtStart) {
        const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
        const startTs = minX - ONE_DAY_MS;
        chartData.unshift({ x: startTs, y: 0, yDay: 0, ...getDateChartInfo(startTs) });
    }
    if(autoAddToday) {
        chartData.push({ x: +(now), y: (chartData[chartData.length - 1]?.y||0), ...getDateChartInfo(+(now)) });
    }

    return {
        chartData,
    }
}

