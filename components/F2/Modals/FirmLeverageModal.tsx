import ConfirmModal from "@app/components/common/Modal/ConfirmModal"
import { VStack } from "@chakra-ui/react"
import { useContext, useState } from "react";
import { F2MarketContext } from "../F2Contex";
import { FirmBoostInfos } from "../ale/FirmBoostInfos";
import { prepareLeveragePosition } from "@app/util/firm-ale";

export const FirmLeverageModal = () => {
    const [dolaToBorrow, setDolaToBorrow] = useState('0');
    
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
        return prepareLeveragePosition(signer, market, dolaToBorrow);
        // onFirmLeverageEngineClose();
    };

    return <ConfirmModal
        title="FiRM Leverage Engine"
        isOpen={isFirmLeverageEngineOpen}
        onClose={cancel}
        onOk={ok}
        onCancel={cancel}
        // okDisabled={}
        okLabel="Continue"
        modalProps={{ minW: { base: '98vw', lg: '900px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <FirmBoostInfos onLeverageChange={(v) => setDolaToBorrow(v)} />
        </VStack>
    </ConfirmModal>
}