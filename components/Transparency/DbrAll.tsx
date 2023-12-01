import { FormControl, Stack, useMediaQuery, Text, Switch, Divider, VStack, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useEventsAsChartData } from "@app/hooks/misc";
import { getClosestPreviousHistoValue, timestampToUTC } from "@app/util/misc";
import { useDBREmissions, useHistoricalPrices } from "@app/hooks/useFirm";
import { ONE_DAY_MS } from "@app/config/constants";
import { DbrComboChart } from "./DbrComboChart";
import { DbrEmissions } from "./DbrEmissions";
import { useDBRPrice } from "@app/hooks/useDBR";
import { shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { useHistoricalInvMarketCap } from "@app/hooks/useHistoricalMarketCap";

const streamingStartTs = 1684713600000;

const StatBasic = ({ value, name, isLoading = false }: { value: string, name: string, isLoading?: boolean }) => {
    return <VStack spacing="0">
        {
            !isLoading ? <Text textAlign="center" color={'secondary'} fontSize={{ base: '16px', sm: '18px' }} fontWeight="extrabold">{value}</Text>
                : <SmallTextLoader />
        }
        <Text textAlign="center" color={'mainTextColor'} fontSize={{ base: '14px', sm: '16px' }} fontWeight="bold">{name}</Text>
    </VStack>
}

export const DbrAll = ({
    history,
    burnEvents,
    histoPrices,
    replenishments,
    maxChartWidth = 800,
    yearlyRewardRate,
}) => {
    const [useUsd, setUseUsd] = useState(false);
    const { prices: invHistoPrices } = useHistoricalPrices('inverse-finance');
    const { evolution: circSupplyEvolution } = useHistoricalInvMarketCap();
    const circSupplyAsObj = !!circSupplyEvolution ? circSupplyEvolution.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr.timestamp)]: curr.circSupply }), {}) : {};
    const invHistoPricesAsObj = !!invHistoPrices ? invHistoPrices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};
    const { priceUsd: dbrPriceUsd } = useDBRPrice();

    const { events: emissionEvents, rewardRatesHistory, isLoading: isEmmissionLoading } = useDBREmissions();

    const repHashes = replenishments?.map(r => r.txHash) || [];

    const claimEvents = emissionEvents?.filter(e => {
        return !repHashes.includes(e.txHash) && !e.isTreasuryMint && !e.isTreasuryTransfer;
    });

    const totalClaimed = claimEvents.reduce((acc, e) => acc + e.amount, 0);
    const totalClaimedUsd = claimEvents.reduce((acc, e) => {
        const histoPrice = histoPrices[timestampToUTC(e.timestamp)];
        return acc + e.amount * (histoPrice || 0.05);
    }, 0);

    const rateChanges = (rewardRatesHistory?.rates || [
        { yearlyRewardRate: 0, timestamp: streamingStartTs - ONE_DAY_MS * 3 },
        { yearlyRewardRate: 4000000, timestamp: streamingStartTs },
    ]).map(e => {
        const date = timestampToUTC(e.timestamp);
        const histoPrice = histoPrices[date];
        return { ...e, histoPrice, worth: e.yearlyRewardRate * (histoPrice || 0.05), date };
    });

    let accBurnUsd = 0;
    const _burnEvents = burnEvents?.map(d => {
        const histoPrice = (histoPrices[timestampToUTC(d.timestamp)] || 0.05);
        return { ...d, amountUsd: d.amount * histoPrice }
    }).map(d => {
        accBurnUsd += d.amountUsd;
        return { ...d, accBurnUsd }
    });

    let totalBurned = _burnEvents?.length ? _burnEvents[_burnEvents.length - 1].accBurn : 0;

    const combodata = history?.map(d => {
        const date = timestampToUTC(d.timestamp);
        const histoPrice = (histoPrices[date] || getClosestPreviousHistoValue(histoPrices, date ,0.05));
        const invHistoPrice = (invHistoPricesAsObj[date] || getClosestPreviousHistoValue(invHistoPricesAsObj, date, 0));
        const invHistoCircSupply = (circSupplyAsObj[date] || getClosestPreviousHistoValue(circSupplyAsObj, date, 0));
        const invHistoMarketCap = invHistoPrice * invHistoCircSupply;
        const yearlyRewardRate = rateChanges.findLast(rd => date >= rd.date)?.yearlyRewardRate || 0;
        return {
            ...d,
            time: (new Date(date)),
            date,
            debt: d.debt,
            debtUsd: d.debt * histoPrice,
            histoPrice,
            invHistoMarketCap,
            yearlyRewardRate,
            yearlyRewardRateUsd: yearlyRewardRate * histoPrice,
        }
    });

    const lastCombodata = combodata?.length > 0 ? combodata[combodata.length - 1] : { debt: 0 };
    // today utc: use current price
    if (combodata?.length > 0 && !!dbrPriceUsd && !!yearlyRewardRate) {
        const now = Date.now();
        const todayUTC = timestampToUTC(now);
        const todayIndex = combodata.findIndex(d => d.date === todayUTC);        
        combodata.splice(todayIndex, combodata.length - (todayIndex), {
            ...lastCombodata,
            timestamp: now,
            time: new Date(timestampToUTC(now)),
            debtUsd: lastCombodata.debt * dbrPriceUsd,
            histoPrice: dbrPriceUsd,
            date: timestampToUTC(now),
            yearlyRewardRate: yearlyRewardRate,
            yearlyRewardRateUsd: yearlyRewardRate * dbrPriceUsd,
        });
    }

    const annualizedBurn = lastCombodata.debt;
    const annualizedIssuance = yearlyRewardRate;

    const { chartData: burnChartData } = useEventsAsChartData(_burnEvents, useUsd ? 'accBurnUsd' : 'accBurn', useUsd ? 'amountUsd' : 'amount');

    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const { themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary];

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width))
    }, [isLargerThan]);

    return <Stack spacing="3" w='full' direction={{ base: 'column' }}>
        <FormControl cursor="pointer" w='full' justifyContent={{ base: 'center', sm: 'flex-start' }} display='flex' alignItems='center'>
            <Text fontSize='14px' mr="2" onClick={() => setUseUsd(!useUsd)}>
                Show in USD historical value
            </Text>
            <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
        </FormControl>
        <VStack spacing="3">
            <Divider />
            <SimpleGrid gap="2" w='full' columns={{ base: 2, sm: 4 }} >
                <StatBasic isLoading={!annualizedIssuance} name="Annualized Issuance" value={`${shortenNumber(annualizedIssuance, 2)} (${shortenNumber(annualizedIssuance * dbrPriceUsd, 2, true)})`} />
                <StatBasic isLoading={!annualizedBurn} name="Annualized Burn" value={`${shortenNumber(annualizedBurn, 2)} (${shortenNumber(annualizedBurn * dbrPriceUsd, 2, true)})`} />
                <StatBasic isLoading={isEmmissionLoading} name="Claimed by stakers" value={`${shortenNumber(totalClaimed, 2)} (${shortenNumber(useUsd ? totalClaimedUsd : totalClaimed * dbrPriceUsd, 2, true)})`} />
                <StatBasic isLoading={!burnEvents?.length} name="Burned by borrowers" value={`${shortenNumber(totalBurned, 2)} (${shortenNumber(useUsd ? accBurnUsd : totalBurned * dbrPriceUsd, 2, true)})`} />
            </SimpleGrid>
            <Divider />
        </VStack>
        <DbrComboChart combodata={combodata} chartWidth={chartWidth} useUsd={useUsd} />
        <Divider />
        <BarChart12Months
            title="DBR burned in the last 12 months"
            chartData={burnChartData}
            maxChartWidth={chartWidth}
            chartWidth={chartWidth}
            eventName="Burn"
            yAttribute="yDay"
            colorScale={defaultColorScale}
            isDollars={useUsd}
            useRecharts={true}
        />
        <DbrEmissions
            emissionEvents={emissionEvents}
            maxChartWidth={chartWidth}
            chartWidth={chartWidth}
            histoPrices={histoPrices}
            replenishments={replenishments}
            useUsd={useUsd}
        />
    </Stack>
}