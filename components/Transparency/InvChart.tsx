import { useHistoricalInvMarketCap } from "@app/hooks/useHistoricalMarketCap";
import { useHistoInvPrices } from "@app/hooks/usePrices";
import { getClosestPreviousHistoValue, timestampToUTC } from "@app/util/misc";
import { DefaultCharts } from "./DefaultCharts";
import { useMediaQuery, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { getNetworkConfigConstants } from "@app/util/networks";
import { INV_ABI } from "@app/config/abis";
import { NetworkIds } from "@app/types";
import { getBnToNumber } from "@app/util/markets";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";

const maxChartWidth = 1300
// initial supply of INV
const INITIAL_SUPPLY = 100_000;

export const InvChart = () => {
    const { prices: invHistoPrices } = useHistoInvPrices();
    const { evolution: circSupplyEvolution } = useHistoricalInvMarketCap();
    const circSupplyAsObj = !!circSupplyEvolution ? circSupplyEvolution.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr.timestamp)]: curr.circSupply }), {}) : {};
    const invHistoPricesAsObj = !!invHistoPrices ? invHistoPrices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};

    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    const combodata = invHistoPrices?.map(d => {
        const date = timestampToUTC(d[0]);
        const invHistoPrice = (invHistoPricesAsObj[date] || getClosestPreviousHistoValue(invHistoPricesAsObj, date, 0));
        const invHistoCircSupply = (circSupplyAsObj[date] || getClosestPreviousHistoValue(circSupplyAsObj, date, 0));
        const invHistoMarketCap = invHistoPrice * invHistoCircSupply;
        return {
            date,
            utcDate: date,
            timestamp: d[0],
            x: d[0],
            marketCap: invHistoMarketCap,
            price: invHistoPrice,
            circSupply: invHistoCircSupply,
            y: invHistoPrice * invHistoCircSupply / INITIAL_SUPPLY,
        }
    })

    return <VStack spacing={0}>
        <Container p="0" noPadding>
            <VStack pt="10" position="relative">
                <DefaultCharts
                    showMonthlyBarChart={false}
                    maxChartWidth={autoChartWidth}
                    chartWidth={autoChartWidth}
                    chartData={combodata}
                    isDollars={false}
                    smoothLineByDefault={true}
                    areaProps={{
                        // lineItems: [
                        //     { dataKey: 'price', name: 'Price', axisId: 'left', stroke: lightTheme.colors.info },
                        //     // { dataKey: 'price', name: 'Price', axisId: 'right', stroke: lightTheme.colors.primary },
                        // ],
                        useUsd: true,
                        duplicateYAxis: true,
                        defaultRange: '2Y',
                        pricePrecision: 2,
                        titleProps: { fontSize: { base: '18px', md: '24px' } },
                        rangesToInclude: ['All', '2Y', '1Y', '6M', '3M'],
                        title: `INV price adjusted to Circ. Supply`, id: 'adjusted-inv-prices', showRangeBtns: true, yLabel: 'Adjusted Price', useRecharts: true, simplifyData: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'secondary', allowZoom: true
                    }}
                />
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="Note: this chart aims to show a more accurate pricing for INV by adjusting the market price to the circulating supply / initial supply ratio with the initial supply being 100,000 INV."
                />
            </VStack>
        </Container>
    </VStack >
}