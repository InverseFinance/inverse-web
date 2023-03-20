import { ONE_DAY_MS } from '@app/config/constants';
import { SWR } from '@app/types';
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

export const useEventsAsChartData = (
    events: (any & { timestamp: number })[],
    yAccAttribute: string,
    yAttribute: string,
): SWR & { chartData: any } => {
    const now = new Date();
    const chartData = [...events.sort((a, b) => a.timestamp - b.timestamp).map(event => {
        const date = new Date(event.timestamp);
        return {
            x: event.timestamp,
            y: event[yAccAttribute],
            yDay: event[yAttribute],
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
        }
    })];

    // add today's timestamp and zero one day before first supply
    const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
    chartData.unshift({ x: minX - ONE_DAY_MS, y: 0 });
    chartData.push({ x: now, y: chartData[chartData.length - 1].y });

    return {
        chartData,
    }
}

