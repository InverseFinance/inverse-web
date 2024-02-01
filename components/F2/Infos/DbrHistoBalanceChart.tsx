import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { useDBRBalanceHisto } from "@app/hooks/useDBR";
import { smartShortNumber } from "@app/util/markets";
import { VStack, useMediaQuery, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const maxChartWidth = 600;

export const DbrHistoBalanceChart = ({
    account,
}: {
    account: string
}) => {
    const { evolution, currentBalance, isLoading } = useDBRBalanceHisto(account);

    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <VStack w='full' overflow="hidden" pt="2">
        {
            isLoading && <VStack w='full' p="2">
                <Text>Please wait this may take some time...</Text>
                <SkeletonBlob />
            </VStack>
        }
        {
            !isLoading && evolution?.length > 0 && <DefaultCharts
                showMonthlyBarChart={false}
                maxChartWidth={autoChartWidth}
                chartWidth={autoChartWidth}
                chartData={evolution}
                isDollars={false}
                smoothLineByDefault={true}
                areaProps={{ title: typeof currentBalance === 'number' ? `Current DBR balance: ${smartShortNumber(currentBalance, 2)}` : undefined, id: 'dbr-balance-histo-chart', showRangeBtns: true, yLabel: 'Historical DBR balance', useRecharts: true, simplifyData: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
            />
        }
    </VStack>
}