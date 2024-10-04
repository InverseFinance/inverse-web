import { useHistoricalInvMarketCap } from "@app/hooks/useHistoricalMarketCap";
import { useHistoInvPrices } from "@app/hooks/usePrices";
import { getClosestPreviousHistoValue, preciseCommify, timestampToUTC } from "@app/util/misc";
import { DefaultCharts } from "./DefaultCharts";
import { useMediaQuery, VStack, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { useDBRMarkets } from "@app/hooks/useDBR";
import { shortenNumber } from "@app/util/markets";
import { commify } from "@ethersproject/units";

const maxChartWidth = 1160
// initial supply of INV
const INITIAL_SUPPLY = 100_000;

export const InvChart = () => {
    const { markets } = useDBRMarkets();
    const invMarket = markets?.find(m => m.isInv);
    const invPrice = invMarket?.price || 0;
    const { prices: invHistoPrices, isLoading: isHistoPricesLoading } = useHistoInvPrices();
    const { data: invCirculatingSupply, isLoading: isCirculatingSupplyLoading } = useCustomSWR(`/api/inv/circulating-supply`);
    const { evolution: circSupplyEvolution } = useHistoricalInvMarketCap();
    const circSupplyAsObj = !!circSupplyEvolution ? circSupplyEvolution.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr.timestamp)]: curr.circSupply }), {}) : {};
    const invHistoPricesAsObj = !!invHistoPrices ? invHistoPrices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};

    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    const isLoading = isHistoPricesLoading || isCirculatingSupplyLoading;

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
            y: invHistoPrice * invHistoCircSupply / invCirculatingSupply,
        }
    })

    const ATH = useMemo(() => {
        return Math.max(...combodata.map(d => d.price));
    }, [combodata]);

    const adjustedATH = useMemo(() => {
        return combodata.find(d => d.price === ATH)?.y;
    }, [combodata, ATH]);

    const maxAdjustedPrice = useMemo(() => {
        return Math.max(...combodata.map(d => d.y));
    }, [combodata]);

    if(isLoading || !combodata?.length) return null;

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
                    description={
                        <VStack w='full' align='flex-start'>
                            <Text>Note: the adjusted price aims to have a more relevant $INV historical pricing by taking into account the circulating supply variations.</Text>
                            <Text>The adjusted price at a given time is calculated as: <b>Price(t) * Historical Circulating Supply(t) / Current Circulating Supply</b></Text>
                            <Text>Market-close ATH price: {ATH ? preciseCommify(ATH, 2, true) : '-'}</Text>
                            <Text>Adjusted Market-close ATH price: {adjustedATH ? preciseCommify(adjustedATH, 2, true) : '-'}</Text>
                            <Text fontWeight='bold'>Adjusted price all time high: {maxAdjustedPrice ? preciseCommify(maxAdjustedPrice, 2, true) : '-'}</Text>
                        </VStack>
                    }
                />
            </VStack>
        </Container>
    </VStack >
}