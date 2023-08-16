import { Modal } from "@app/components/common/Modal"
import { DbrReplenishmentForm } from "../liquidations/DbrReplenishmentForm";
import { shortenAddress } from "@app/util";
import { NavButtons } from "@app/components/common/Button";
import { useState } from "react";
import { VStack } from "@chakra-ui/react";
import { FirmPositionsTable } from "./FirmPositionsTable";

const widths = {
    'Summary': '600px',
    'DBR replenishment': '600px',
    'Liquidation': '600px',
}

export const FirmUserModal = ({
    userData,
    onClose,
    isOpen,
}: {
    userData: any,
    onClose: () => void,
    isOpen: boolean,
}) => {
    const [active, setActive] = useState('Summary');
    return <Modal
        header={`${shortenAddress(userData.user)} details`}
        onClose={onClose}
        isOpen={isOpen}
        minWidth="600px"
        // maxWidth="98vw"
    >
        <NavButtons options={['Summary', 'DBR replenishment', 'Liquidation']} onClick={(v) => setActive(v)} active={active} />
        <VStack w='100%' alignItems="center">
            <VStack w={widths[active]} p="2">
                {
                    active === 'DBR replenishment' && <DbrReplenishmentForm userData={userData} />
                }
                {
                    active === 'Liquidation' && <FirmPositionsTable isOneUserOnly={true} openLiquidation={() => {}} positions={userData.marketPositions} />
                }
            </VStack>
        </VStack>
    </Modal>
}