import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import InfoModal from "@app/components/common/Modal/InfoModal"
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { useDBRBalanceHisto } from "@app/hooks/useDBR";
import { shortenAddress } from "@app/util";
import { smartShortNumber } from "@app/util/markets";
import { VStack, useMediaQuery, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const maxChartWidth = 900;

export const DbrHistoBalanceModal = ({
    onClose,
    isOpen,
    account,    
}: {
    onClose: () => void,
    isOpen: boolean,
    account: string    
}) => {    
    const { evolution, currentBalance, isLoading } = useDBRBalanceHisto(account);    

    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <InfoModal
        title={`DBR Balance History for ${shortenAddress(account)}`}
        minW={{ base: '98vw', lg: '800px', xl: '1000px' }}
        isOpen={isOpen}
        onClose={onClose}>
        <VStack w='full' overflow="hidden" pt="2">
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
                    areaProps={{ title: `Current DBR balance: ${smartShortNumber(currentBalance, 2)}`, id: 'dbr-balance-histo-chart', showRangeBtns: true, yLabel: 'Historical DBR balance', useRecharts: true, simplifyData: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
                />
            }
        </VStack>
    </InfoModal>;
}