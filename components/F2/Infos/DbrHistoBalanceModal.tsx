import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import InfoModal from "@app/components/common/Modal/InfoModal"
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { useDBRBalanceHisto } from "@app/hooks/useDBR";

export const DbrHistoBalanceModal = ({
    onClose,
    isOpen,
    account,
}: {
    onClose: () => void,
    isOpen: boolean,
    account: string
}) => {
    const { evolution, isLoading } = useDBRBalanceHisto(account);
    return <InfoModal minW={1000} isOpen={isOpen} onClose={onClose}>
        {
            isLoading && <SkeletonBlob />
        }
        {
            !isLoading && evolution?.length > 0 && <DefaultCharts
                showMonthlyBarChart={false}
                maxChartWidth={1000}
                chartWidth={1000}
                chartData={evolution}
                isDollars={false}
                smoothLineByDefault={true}
                areaProps={{ id: 'dbr-balance-histo-chart', showRangeBtns: true, yLabel: 'Historical DBR balance', useRecharts: true, simplifyData: true, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
            />
        }
    </InfoModal>;
}