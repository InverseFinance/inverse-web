import { FormControl, Stack, useMediaQuery, Text, Switch, Divider, VStack, SimpleGrid, HStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useEventsAsChartData } from "@app/hooks/misc";
import { getClosestPreviousHistoValue, timestampToUTC } from "@app/util/misc";
import { useDBRBurns, useDBRDebtHisto, useDBREmissions, useFirmUsers } from "@app/hooks/useFirm";
import { ONE_DAY_MS } from "@app/config/constants";
import { DbrComboChart } from "./DbrComboChart";
import { DbrEmissions } from "./DbrEmissions";
import { useDbrCirculatingSupplyEvolution, useDBRPrice } from "@app/hooks/useDBR";
import { shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { useHistoricalInvMarketCap } from "@app/hooks/useHistoricalMarketCap";
import { DefaultCharts } from "./DefaultCharts";
import { useDolaStakingEvolution, useStakedDola } from "@app/util/dola-staking";
import { useDbrAuction } from "../F2/DbrAuction/DbrAuctionInfos";
import { useHistoInvPrices } from "@app/hooks/usePrices";
import { DashBoardCard } from "../F2/UserDashboard";
import FirmLogo from "../common/Logo/FirmLogo";
import { FirmBorrowsChart } from "./FirmBorrowsChart";
import { DbrInflationChart } from "./DbrInflationChart";
import { useCacheFirstSWR } from "@app/hooks/useCustomSWR";
import { useJrDolaStakingEvolution } from "@app/util/junior";

const streamingStartTs = 1684713600000;

const StatBasic = ({ value, name, isLoading = false }: { value: string, name: string, isLoading?: boolean }) => {
    return <VStack spacing="0">
        {
            !isLoading ? <Text textAlign="center" color={'secondary'} fontSize={{ base: '16px', sm: '18px' }} fontWeight="extrabold">{value}</Text>
                : <SmallTextLoader />
        }
        <Text className="heading-font" textAlign="center" color={'mainTextColor'} fontSize={{ base: '14px', sm: '16px' }} fontWeight="bold">{name}</Text>
    </VStack>
}

export const DbrAll = ({
    histoPrices,
    maxChartWidth = 1250,
    yearlyRewardRate,
}) => {
    const { events: burnEvents } = useDBRBurns();
    const { history } = useDBRDebtHisto();
    const [useUsd, setUseUsd] = useState(false);
    const { prices: invHistoPrices } = useHistoInvPrices();
    const { evolution: circSupplyEvolution } = useHistoricalInvMarketCap();
    const { evolution: dbrCircSupplyEvolution, currentCirculatingSupply: dbrCurrentCircSupply } = useDbrCirculatingSupplyEvolution();
    const circSupplyAsObj = !!circSupplyEvolution ? circSupplyEvolution.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr.timestamp)]: curr.circSupply }), {}) : {};
    const invHistoPricesAsObj = !!invHistoPrices ? invHistoPrices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};
    const dbrCircSupplyAsObj = !!dbrCircSupplyEvolution ? dbrCircSupplyEvolution.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr.timestamp)]: curr.circSupply }), {}) : {};
    const inventoryAsObj = !!dbrCircSupplyEvolution ? dbrCircSupplyEvolution.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr.timestamp)]: curr.inventory }), {}) : {};
    const { priceUsd: dbrPriceUsd, priceDola: dbrPriceDola } = useDBRPrice();

    const { events: emissionEvents, accClaimedByStakers, rewardRatesHistory, isLoading: isEmmissionLoading, timestamp: emissionTimestamp } = useDBREmissions();
    const { dsaYearlyDbrEarnings, isLoading: isLoadingStakedDola } = useStakedDola(dbrPriceUsd);
    const { dbrEffectiveJrDolaBudget, dbrRatePerYear: auctionYearlyRate, historicalRates: auctionHistoricalRates, isLoading: isLoadingAuction } = useDbrAuction("classic");
    const { evolution: dolaStakingEvolution } = useDolaStakingEvolution();
    const { evolution: jrDolaStakingEvolution } = useJrDolaStakingEvolution();
    const { data: invBuyBacksData, isLoading: isLoadingInvBuyBacks } = useCacheFirstSWR('/api/auctions/inv-buy-backs');
    const invBuyBacksYearlyRate = invBuyBacksData?.dbrRatePerYear || 0;
    const invBuyBacksRates = invBuyBacksData?.rateUpdates || [];
    const { positions, inventory: currentInventory } = useFirmUsers();
    const totalDebt = positions.reduce((prev, curr) => prev + curr.debt, 0);

    const totalClaimed = accClaimedByStakers;//useMemo(() => emissionEvents.reduce((acc, e) => acc + e.stakingClaims, 0), [emissionTimestamp]);
    const totalClaimedUsd = useMemo(() => {
        return  emissionEvents.reduce((acc, e) => {
            const histoPrice = histoPrices[e.utcDate];
            return acc + e.stakingClaims * (histoPrice || 0.05);
        }, 0);
    }, [emissionTimestamp]);

    // rate to INV stakers
    const rateChanges = (rewardRatesHistory?.rates || [
        { yearlyRewardRate: 0, timestamp: streamingStartTs - ONE_DAY_MS * 3 },
        { yearlyRewardRate: 4000000, timestamp: streamingStartTs },
    ]).map(e => {
        const date = timestampToUTC(e.timestamp);
        const histoPrice = histoPrices[date];
        return { ...e, histoPrice, worth: e.yearlyRewardRate * (histoPrice || 0.05), date };
    });

    // rate to auction
    const auctionRateChanges = useMemo(() => {
        return (auctionHistoricalRates || [{ "timestamp": 1705343411, "block": 19014080, "rate": 2000000 }, { "timestamp": 1706888243, "block": 19141646, "rate": 5000000 }]).map(e => {
            const date = timestampToUTC(e.timestamp);
            const histoPrice = histoPrices[date];
            return { ...e, histoPrice, worth: e.rate * (histoPrice || 0.05), date };
        });
    }, [auctionHistoricalRates, histoPrices]);

    // inv buy backs rates
    const invBuyBacksRateChanges = useMemo(() => {
        return (invBuyBacksRates || [{ "timestamp": 1771226914716, "block": 24467889, "rate": 24000000 }]).map(e => {
            const date = timestampToUTC(e.timestamp);
            const histoPrice = histoPrices[date];
            return { ...e, histoPrice, worth: e.rate * (histoPrice || 0.05), date };
        });
    }, [invBuyBacksRates, histoPrices]);

    let accBurnUsd = 0;
    const _burnEvents = useMemo(() => {
        return burnEvents?.map(d => {
            const histoPrice = (histoPrices[d.utcDate] || 0.05);
            return { ...d, amountUsd: d.amount * histoPrice }
        }).map(d => {
            accBurnUsd += d.amountUsd;
            return { ...d, accBurnUsd }
        });
    }, [burnEvents, histoPrices]);

    let totalBurned = useMemo(() => {
        return _burnEvents?.length ? _burnEvents[_burnEvents.length - 1].accBurn : 0;
    }, [_burnEvents]);

    const combodata = history?.map(d => {
        const date = timestampToUTC(d.timestamp);
        const histoPrice = (histoPrices[date] || getClosestPreviousHistoValue(histoPrices, date, 0.05));
        const invHistoPrice = (invHistoPricesAsObj[date] || getClosestPreviousHistoValue(invHistoPricesAsObj, date, 0));
        const invHistoCircSupply = (circSupplyAsObj[date] || getClosestPreviousHistoValue(circSupplyAsObj, date, 0));
        const dbrCircSupply = (dbrCircSupplyAsObj[date] || getClosestPreviousHistoValue(dbrCircSupplyAsObj, date, 0));
        const inventory = (inventoryAsObj[date] || getClosestPreviousHistoValue(inventoryAsObj, date, 0));
        const invHistoMarketCap = invHistoPrice * invHistoCircSupply;
        const yearlyRewardRate = rateChanges.findLast(rd => date >= rd.date)?.yearlyRewardRate || 0;
        const auctionYearlyRewardRate = auctionRateChanges.findLast(rd => date >= rd.date)?.rate || 0;
        const invBuyBacksYearlyRewardRate = invBuyBacksRateChanges.findLast(rd => date >= rd.date)?.rate || 0;
        const dsaIssuance = dolaStakingEvolution.findLast(rd => date >= timestampToUTC(rd.timestamp))?.dsaYearlyDbrEarnings || 0;
        const jrDolaIssuance = jrDolaStakingEvolution.findLast(rd => date >= timestampToUTC(rd.timestamp))?.yearlyDbrEarnings || 0;
        const totalAnnualizedIssuance = invBuyBacksYearlyRewardRate + auctionYearlyRewardRate + yearlyRewardRate + dsaIssuance + jrDolaIssuance;
        return {
            ...d,
            time: (new Date(date)),
            date,
            debt: d.debt,
            debtUsd: d.debt * histoPrice,
            histoPrice,
            invHistoMarketCap,
            stakersYearlyRewardRate: yearlyRewardRate,
            stakersYearlyRewardRateUsd: yearlyRewardRate * histoPrice,
            yearlyRewardRate: totalAnnualizedIssuance,
            yearlyRewardRateUsd: totalAnnualizedIssuance * histoPrice,
            dbrCircSupply,
            dbrCircSupplyUsd: dbrCircSupply * histoPrice,
            inventory,
            totalUserDbrBalance: inventory * d.debt / 365,
            totalUserDbrBalanceUsd: inventory * d.debt / 365 * histoPrice,
            inflation: (totalAnnualizedIssuance - d.debt)/365,
            inflationUsd: (totalAnnualizedIssuance - d.debt)/365 * histoPrice,
        }
    });

    const lastCombodata = combodata?.length > 0 ? combodata[combodata.length - 1] : { debt: 0 };
    // today utc: use current price
    if (combodata?.length > 0 && !!dbrPriceUsd && !!yearlyRewardRate) {
        const now = Date.now();
        const todayUTC = timestampToUTC(now);
        const todayIndex = combodata.findIndex(d => d.date === todayUTC);
        const totalAnnualizedIssuance = invBuyBacksYearlyRate + auctionYearlyRate + yearlyRewardRate + dsaYearlyDbrEarnings + dbrEffectiveJrDolaBudget;
        const inventory = currentInventory || lastCombodata?.inventory;
        const todayInHisto = todayIndex !== -1;
        combodata.splice(todayInHisto ? todayIndex : combodata.length - 1, todayInHisto ? 1 : 0, {
            ...lastCombodata,
            inventory,
            totalUserDbrBalance: inventory * totalDebt / 365,
            totalUserDbrBalanceUsd: inventory * totalDebt / 365 * dbrPriceUsd,
            debt: totalDebt,
            timestamp: now,
            time: new Date(timestampToUTC(now)),
            debtUsd: totalDebt * dbrPriceUsd,
            dbrCircSupplyUsd: dbrCurrentCircSupply * dbrPriceUsd,
            histoPrice: dbrPriceUsd,
            date: timestampToUTC(now),
            stakersYearlyRewardRate: yearlyRewardRate,
            stakersYearlyRewardRateUsd: yearlyRewardRate * dbrPriceUsd,
            yearlyRewardRate: totalAnnualizedIssuance,
            yearlyRewardRateUsd: totalAnnualizedIssuance * dbrPriceUsd,
            inflation: (totalAnnualizedIssuance - totalDebt)/365,
            inflationUsd: (totalAnnualizedIssuance - totalDebt)/365 * dbrPriceUsd,
        });
    }

    // const annualizedBurn = lastCombodata.debt;
    const annualizedIssuance = invBuyBacksYearlyRate + yearlyRewardRate + dsaYearlyDbrEarnings + auctionYearlyRate + dbrEffectiveJrDolaBudget;

    const { chartData: burnChartData } = useEventsAsChartData(_burnEvents, useUsd ? 'accBurnUsd' : 'accBurn', useUsd ? 'amountUsd' : 'amount');
    
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const { themeName, themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary];

    const dashboardCardTitleProps = { w: 'fit-content', mt: '1', fontSize: '26px', fontWeight: 'extrabold' };
    const defillamaCardProps = { overflow:"hidden", direction: 'column', mx: '0', w: { base: '100vw', sm: '95vw', lg: '600px' }, borderRadius: { base: '0', sm: '8' } };

    useEffect(() => {
        const handleResize = () => {
            if (chartWidth === (window.innerWidth - 10)) return;
            const width = window.innerWidth - 10;
            setChartWidth(width > maxChartWidth ? maxChartWidth : width);
          };
          handleResize();
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
    }, [])

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : window.innerWidth - 10)
    }, [isLargerThan, maxChartWidth]);

    return <Stack overflow="hidden" spacing="3" w='full' direction={{ base: 'column' }} alignItems="center" p={{ base: '0', sm: '4' }}>
        <FormControl w='full' justifyContent={{ base: 'center', sm: 'flex-start' }} display='flex' alignItems='center'>
            <Text cursor="pointer" fontSize='14px' mr="2" onClick={() => setUseUsd(!useUsd)}>
                Show in USD historical value
            </Text>
            <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
        </FormControl>
        <VStack spacing="3">
            <Divider />
            <SimpleGrid gap="2" w='full' columns={{ base: 2, sm: 5 }}>
                <StatBasic isLoading={!yearlyRewardRate || isLoadingStakedDola || isLoadingAuction || isLoadingInvBuyBacks} name="Annualized Issuance" value={`${shortenNumber(annualizedIssuance, 2)} (${shortenNumber(annualizedIssuance * dbrPriceUsd, 2, true)})`} />
                <StatBasic isLoading={!totalDebt} name="Annualized Burn" value={`${shortenNumber(totalDebt, 2)} (${shortenNumber(totalDebt * dbrPriceUsd, 2, true)})`} />
                <StatBasic isLoading={!currentInventory} name="Inventory Days" value={`${shortenNumber(currentInventory, 2)}`} />
                <StatBasic isLoading={isEmmissionLoading} name="Claimed by stakers" value={`${shortenNumber(totalClaimed, 2)} (${shortenNumber(useUsd ? totalClaimedUsd : totalClaimed * dbrPriceUsd, 2, true)})`} />
                <StatBasic isLoading={!burnEvents?.length} name="Burned by borrowers" value={`${shortenNumber(totalBurned, 2)} (${shortenNumber(useUsd ? accBurnUsd : totalBurned * dbrPriceUsd, 2, true)})`} />
            </SimpleGrid>
            <Divider />
        </VStack>
        <DbrComboChart combodata={combodata} chartWidth={chartWidth} useUsd={useUsd} />
        <Divider />
        <FirmBorrowsChart
            combodata={combodata}
            chartWidth={chartWidth}
            useUsd={useUsd}
        />
        <DbrInflationChart
            combodata={combodata}
            chartWidth={chartWidth}
            useUsd={useUsd}
        />
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
        <DefaultCharts
            showMonthlyBarChart={false}
            maxChartWidth={chartWidth}
            chartWidth={chartWidth}
            chartData={burnChartData}
            isDollars={useUsd}
            smoothLineByDefault={false}
            containerProps={{ alignItems: 'center' }}
            barProps={{ eventName: 'Burn', yAttribute: 'yDay', title: 'DBR burned in the last 12 months' }}
            areaProps={{ title: 'Accumulated DBR burned', fillInByDayInterval: true, showRangeBtns: false, yLabel: 'Acc. DBR burn', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, allowEscapeViewBox: false }}
        />
        <DbrEmissions
            emissionEvents={emissionEvents}
            maxChartWidth={chartWidth}
            chartWidth={chartWidth}
            histoPrices={histoPrices}
            useUsd={useUsd}
        />
        <DashBoardCard
            cardTitle={
                <HStack alignItems="center" position={{ base: 'static', md: 'absolute' }} left="0" top="0" w="full" justifyContent="center">
                    <FirmLogo w="65px" h="30px" />
                    <Text className="heading-font" {...dashboardCardTitleProps}>Revenues & Fees</Text>
                </HStack>
            }
            {...defillamaCardProps} w='full' p="0">
            <iframe width="100%" height="360px" src={`https://defillama.com/chart/protocol/inverse-finance-firm?mcap=false&tokenPrice=false&fees=true&revenue=true&events=false&tvl=false&include_pool2_in_tvl=true&include_staking_in_tvl=true&include_govtokens_in_tvl=true&theme=${themeName}`} title="DefiLlama" frameborder="0"></iframe>
        </DashBoardCard>
        {/* <DashBoardCard cardTitle={
            <HStack alignItems="center" position={{ base: 'static', md: 'absolute' }} left="0" top="0" w="full" justifyContent="center">
                <FirmLogo w="65px" h="30px" />
                <Text className="heading-font" {...dashboardCardTitleProps}>TVL</Text>
            </HStack>
        }
            {...defillamaCardProps} w='full' p="0">
            <iframe width="100%" height="360px" src={`https://defillama.com/chart/protocol/inverse-finance-firm?events=false&fees=false&revenue=false&usdInflows=false&theme=${themeName}`} title="DefiLlama" frameborder="0"></iframe>
        </DashBoardCard> */}
    </Stack>
}