import { InterestModelChart } from '@app/components/Transparency/InterestModelChart'
import { ETH_MANTISSA } from '@app/config/constants';
import { useInterestModel } from '@app/hooks/useInterestModel'
import { Market } from '@app/types'
import { toApr, toApy } from '@app/util/markets';
import { useMediaQuery } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

const utilisationRates = [...Array(101).keys()];

export const AnchorMarketInterestChart = ({
    market,
    type,
    maxWidth = 900,
    title,
    autocompounds = false,
}: {
    market: Market | null | undefined,
    type: 'supply' | 'borrow',
    maxWidth: number,
    autocompounds?: boolean,
    title?: string,
}) => {
    const { kink, multiplierPerBlock, jumpMultiplierPerBlock, baseRatePerBlock } = useInterestModel(market?.interestRateModel);
    const [chartWidth, setChartWidth] = useState<number>(maxWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxWidth+50}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxWidth : (screen.availWidth || screen.width) - 50)
    }, [isLargerThan, maxWidth]);

    const borrowChartData = utilisationRates.map((utilizationRate) => {
        const converter = autocompounds ? toApy : toApr;
        const belowKinkRate = converter((utilizationRate / 100 * multiplierPerBlock + baseRatePerBlock) * ETH_MANTISSA);

        const normalRate = kink / 100 * multiplierPerBlock + baseRatePerBlock;
        const excess = utilizationRate / 100 - kink / 100;
        const jumpedRate = converter((excess * jumpMultiplierPerBlock + normalRate) * ETH_MANTISSA)

        return { x: utilizationRate, y: utilizationRate <= kink ? belowKinkRate : jumpedRate }
    })

    if (market) {
        borrowChartData.push({ x: market?.utilizationRate * 100, y: autocompounds ? market?.borrowApy : market?.borrowApr });
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
            autocompounds={autocompounds}
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