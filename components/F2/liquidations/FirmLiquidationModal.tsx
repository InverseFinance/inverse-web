import { Modal } from "@app/components/common/Modal"
import { useAccountDBRMarket } from "@app/hooks/useDBR";
import { FirmLiquidationForm } from "./FirmLiquidationForm";

export const FirmLiquidationModal = ({
    position,
    onClose,
    isOpen,
}: {
    position: any,
    onClose: () => void,
    isOpen: boolean,
}) => {
    const liveData = useAccountDBRMarket(position.market, position.user);
    const dataSource = !!liveData ? liveData : position;
    const { liquidatableDebt } = dataSource;

    return <Modal
        header={liquidatableDebt > 0 ? `Liquidation Form` : 'Details'}
        onClose={onClose}
        isOpen={isOpen}
    >
        <FirmLiquidationForm position={position} />
    </Modal>
}