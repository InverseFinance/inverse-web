import { Modal } from "@app/components/common/Modal"
import { DbrReplenishmentForm } from "./DbrReplenishmentForm";

export const DbrReplenishmentModal = ({
    userData,
    onClose,
    isOpen,
}: {
    userData: any,
    onClose: () => void,
    isOpen: boolean,
}) => {
    return <Modal
        header={`Replenishment Form`}
        onClose={onClose}
        isOpen={isOpen}
    >
        <DbrReplenishmentForm userData={userData} />
    </Modal>
}