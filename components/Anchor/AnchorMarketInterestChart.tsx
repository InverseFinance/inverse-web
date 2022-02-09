import { InterestModelChart } from '@app/components/Transparency/InterestModelChart'
import { useInterestModel } from '@app/hooks/useInterestModel'
import { Market } from '@app/types'
import { useMediaQuery } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

const utilisationRates = [...Array(101).keys()];

export const AnchorMarketInterestChart = ({
    market,
    type,
    maxWidth = 900,
    title,
}: {
    market: Market | null | undefined,
    type: 'supply' | 'borrow',
    maxWidth: number,
    title?: string,
}) => {
    const { kink, multiplierPerYear, jumpMultiplierPerYear, baseRatePerYear } = useInterestModel();
    const [chartWidth, setChartWidth] = useState<number>(maxWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxWidth}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const borrowChartData = utilisationRates.map((utilizationRate) => {
        const belowKinkRate = utilizationRate / 100 * multiplierPerYear + baseRatePerYear;

        const normalRate = kink / 100 * multiplierPerYear + baseRatePerYear;
        const excess = utilizationRate / 100 - kink / 100;
        const jumpedRate = excess * jumpMultiplierPerYear + normalRate

        return { x: utilizationRate, y: utilizationRate <= kink ? belowKinkRate : jumpedRate }
    })

    if (market) {
        borrowChartData.push({ x: market?.utilizationRate * 100, y: market?.borrowApy });
        borrowChartData.sort((a, b) => a.x - b.x);
    }

    const lendingChartData = borrowChartData.map(data => {
        const ratio = 1 - (market?.reserveFactor ?? 0.2);
        return { x: data.x, y: data.y * ratio * data.x / 100 }
    })

    const datas = {
        supply: lendingChartData,
        borrow: borrowChartData,
    }

    return (
        <InterestModelChart
            title={title}
            kink={kink}
            showTooltips={true}
            height={300}
            width={chartWidth}
            data={datas[type]}
            interpolation={'basis'}
            utilizationRate={market?.utilizationRate! * 100}
        />
    )
}