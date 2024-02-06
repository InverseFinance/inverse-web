import InfoModal from "@app/components/common/Modal/InfoModal"
import { shortenAddress } from "@app/util";
import { DbrHistoBalanceChart } from "./DbrHistoBalanceChart";

export const DbrHistoBalanceModal = ({
    onClose,
    isOpen,
    account,
}: {
    onClose: () => void,
    isOpen: boolean,
    account: string
}) => {
    return <InfoModal
        title={`DBR Balance History for ${shortenAddress(account)}`}
        minW={{ base: '98vw', lg: '800px', xl: '1000px' }}
        isOpen={isOpen}
        onClose={onClose}>
        <DbrHistoBalanceChart account={account} />
    </InfoModal>;
}