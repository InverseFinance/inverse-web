import { Flex, SimpleGrid, Stack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { homogeneizeLpName, shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useFirmLiquidations } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";

import Table from "@app/components/common/Table";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { uniqueBy } from "@app/util/misc";
import { useEventsAsChartData } from "@app/hooks/misc";
import { lightTheme } from "@app/variables/theme";
import { DashBoardCard, NumberCard } from "../UserDashboard";
import { useEffect, useState } from "react";
import { ONE_DAY_MS } from "@app/config/constants";
import { timeSince } from "@app/util/time";
import { MarketNameAndIcon } from "../F2Markets";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="12px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="12px" {...props} />
}

const columns = [
    {
        field: 'txHash',
        label: 'tx',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        value: ({ txHash }) => {
            return <Cell justify="flex-start" minWidth="90px">
                <ScannerLink value={txHash} type="tx" fontSize='12px' />
            </Cell>
        },
    },
    {
        field: 'timestamp',
        label: 'Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'140px'} {...props} />,
        value: ({ timestamp }) => <Cell justify="flex-start" minWidth="140px">
            <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </Cell>,
    },
    {
        field: 'borrower',
        label: 'Borrower',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="90px" />,
        value: ({ borrower }) => {
            return <Cell w="90px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${borrower}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={borrower} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
    },
    {
        field: 'marketName',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-start"  {...props} />,
        value: ({ market }) => {
            const { name, icon, marketIcon, underlying } = market;
            return <Cell minWidth="110px">
                {/* <BigImageButton bg={`url('${marketIcon || icon || underlying?.image}')`} h="20px" w="20px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                <CellText>{name}</CellText> */}
                <MarketNameAndIcon stackProps={{ direction: 'column', alignItems: 'flex-start', justify: 'center' }} textProps={{ fontWeight: "normal", fontSize: "12px" }} direction="column" name={name} icon={icon} marketIcon={marketIcon} underlying={underlying} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '110px',
        filterItemRenderer: ({ marketName }) => <CellText>{marketName}</CellText>
    },
    {
        field: 'liquidator',
        label: 'Liquidator',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="90px" />,
        value: ({ liquidator }) => {
            return <Cell w="90px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={liquidator} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
    },
    {
        field: 'repaidDebt',
        label: 'Debt repaid',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ repaidDebt }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(repaidDebt, 2, false, true)} DOLA</CellText>
            </Cell>
        },
    },
    {
        field: 'liquidatorReward',
        label: 'Liquidator Reward',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ liquidatorReward, market }) => {
            return <Cell minWidth="90px" justify="flex-end" >
                <CellText textAlign="right">
                    {shortenNumber(liquidatorReward, 2, false, true)} 
                    <br />
                    {homogeneizeLpName(market.underlying.symbol)}
                </CellText>
            </Cell>
        },
    },
]

const maxChartWidth = 600;

export const FirmLiquidations = ({

}: {

    }) => {
    const [now] = useState(Date.now());
    const [twentyFourHoursTs] = useState(now - ONE_DAY_MS);
    const [sevenDaysTs] = useState(now - 7 * ONE_DAY_MS);
    const { liquidations, timestamp, isLoading } = useFirmLiquidations();
    const { chartData: repaidChartData } = useEventsAsChartData(liquidations, 'repaidDebt', 'repaidDebt', true, true, 0);

    const [autoChartWidth, setAutoChartWidth] = useState<number>(null);
    const [isLargerThanxl] = useMediaQuery(`(min-width: 80em)`);

    const last24h = liquidations.filter(liq => liq.timestamp >= twentyFourHoursTs);
    const last7days = liquidations.filter(liq => liq.timestamp >= sevenDaysTs);
    const nbLiq24h = last24h.length;
    const dolaRepaid24h = last24h.reduce((prev, curr) => prev + curr.repaidDebt, 0);

    const repaidDailyChart = uniqueBy(
        repaidChartData.map(l => {
            const nbRepaid = repaidChartData.filter(d => d.y > 0 && d.utcDate === l.utcDate).reduce((prev, curr) => prev + curr.y, 0);
            return { ...l, y: nbRepaid, yDay: nbRepaid };
        }),
        (a, b) => a.utcDate === b.utcDate,
    );

    const nbLiqChartData = uniqueBy(
        repaidChartData.map(l => {
            const nbLiq = repaidChartData.filter(d => d.y > 0 && d.utcDate === l.utcDate).length;
            return { ...l, y: nbLiq, yDay: nbLiq };
        }),
        (a, b) => a.utcDate === b.utcDate,
    );
    repaidDailyChart.sort((a, b) => a.x - b.x);
    nbLiqChartData.sort((a, b) => a.x - b.x);

    useEffect(() => {
        setAutoChartWidth(isLargerThanxl ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThanxl]);

    const defaultRange = last7days.length > 0 ? '7D' : '1M';

    return <VStack w='full' maxW={'96vw'}>
        {
            autoChartWidth !== null && liquidations?.length > 0 && <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                {
                    nbLiq24h > 0 && <>
                        <NumberCard label="24h Nb Liquidations" value={nbLiq24h} />
                        <NumberCard label="24h DOLA repaid" value={dolaRepaid24h} />
                    </>
                }
                <DashBoardCard>
                    <DefaultCharts
                        showMonthlyBarChart={true}
                        maxChartWidth={autoChartWidth}
                        chartWidth={autoChartWidth}
                        chartData={repaidDailyChart}
                        isDollars={false}
                        smoothLineByDefault={false}
                        containerProps={{ pt: 8 }}
                        barProps={{ useRecharts: true, yLabel: 'DOLA repaid', mainColor: lightTheme.colors.info }}
                        areaProps={{ title: 'DOLA repaid from liquidations', interpolation: 'linear', id: 'firm-repaid-liquidations', showRangeBtns: true, yLabel: 'DOLA repaid', useRecharts: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, fillInByDayInterval: 1, fillInValue: 0, rangesToInclude: ['All', '1Y', '3M', '1M', '7D'], defaultRange }}
                    />
                </DashBoardCard>
                <DashBoardCard>
                    <DefaultCharts
                        showMonthlyBarChart={true}
                        maxChartWidth={autoChartWidth}
                        chartWidth={autoChartWidth}
                        chartData={nbLiqChartData}
                        isDollars={false}
                        smoothLineByDefault={false}
                        containerProps={{ pt: 8 }}
                        barProps={{ useRecharts: true, yLabel: 'Number of liquidations', mainColor: lightTheme.colors.info }}
                        areaProps={{ title: 'Number of liquidations', interpolation: 'linear', yDomainAsInteger: true, id: 'firm-nb-liquidations', showRangeBtns: true, yLabel: 'Nb liquidation', useRecharts: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, fillInByDayInterval: 1, fillInValue: 0, rangesToInclude: ['All', '1Y', '3M', '1M', '7D'], defaultRange }}
                    />
                </DashBoardCard>
            </SimpleGrid>
        }
        <Container
            label="Last 100 liquidation transactions on FiRM"
            noPadding
            m='0'
            px='0'
            py="4"
            description={timestamp ? `Last update ${timeSince(timestamp)}` : `Loading...`}
            contentProps={{ overflowX: 'scroll' }}
        >
            <Table
                keyName="key"
                noDataMessage={isLoading ? 'Loading' : "No Liquidations"}
                columns={columns}
                items={liquidations.slice(0, 100)}
                defaultSort={'timestamp'}
                defaultSortDir="desc"
            />
        </Container>
    </VStack>
}