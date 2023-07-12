import ConfirmModal from "@app/components/common/Modal/ConfirmModal"
import { VStack } from "@chakra-ui/react"
import { useContext, useState } from "react";
import { F2MarketContext } from "../F2Contex";
import { FirmBoostInfos } from "../ale/FirmBoostInfos";
import { prepareLeveragePosition } from "@app/util/firm-ale";
import { getBnToNumber, getNumberToBn } from "@app/util/markets";

export const FirmLeverageModal = () => {
    const [dolaToBorrow, setDolaToBorrow] = useState(0);
    const [borrowLimit, setBorrowLimit] = useState(0);
    
    const {
        isFirmLeverageEngineOpen,
        onFirmLeverageEngineClose,
        signer,
        market,
    } = useContext(F2MarketContext);

    const cancel = () => {        
        onFirmLeverageEngineClose();
    };

    const ok = async () => {
        return prepareLeveragePosition(signer, market, getNumberToBn(dolaToBorrow));
    };

    return <ConfirmModal
        title="FiRM Leverage Engine"
        isOpen={isFirmLeverageEngineOpen}
        onClose={cancel}
        onOk={ok}
        onCancel={cancel}
        okDisabled={dolaToBorrow > market.leftToBorrow || borrowLimit >= 99}
        okLabel="Continue"
        onSuccess={() => onFirmLeverageEngineClose()}
        modalProps={{ minW: { base: '98vw', lg: '900px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <FirmBoostInfos onLeverageChange={(d) => {
                setDolaToBorrow(d.dolaToBorrow);
                setBorrowLimit(d.newBorrowLimit);
            }} />
        </VStack>
    </ConfirmModal>
}