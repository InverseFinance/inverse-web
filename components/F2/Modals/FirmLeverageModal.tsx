import ConfirmModal from "@app/components/common/Modal/ConfirmModal"
import { VStack } from "@chakra-ui/react"
import { useContext, useState } from "react";
import { F2MarketContext } from "../F2Contex";
import { FirmBoostInfos } from "../ale/FirmBoostInfos";
import { prepareLeveragePosition } from "@app/util/firm-ale";
import { getNumberToBn } from "@app/util/markets";

export const FirmLeverageModal = () => {
    const [state, setState] = useState({ dolaToBorrow: 0, borrowLimit: 0, newDebt: 0 });

    const {
        isFirmLeverageEngineOpen,
        onFirmLeverageEngineClose,
        signer,
        market,
        isDeposit,
    } = useContext(F2MarketContext);

    const cancel = () => {
        onFirmLeverageEngineClose();
    };

    const ok = async () => {
        return prepareLeveragePosition(signer, market, getNumberToBn(state.dolaToBorrow));
    };

    return <ConfirmModal
        title="FiRM Leverage Engine"
        isOpen={isFirmLeverageEngineOpen}
        onClose={cancel}
        onOk={ok}
        onCancel={cancel}
        okDisabled={state.dolaToBorrow > market.leftToBorrow || state.borrowLimit >= 99 || state.newDebt < 0}
        okLabel="Continue"
        onSuccess={() => onFirmLeverageEngineClose()}
        modalProps={{ minW: { base: '98vw', lg: '900px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <FirmBoostInfos
                type={isDeposit ? 'up' : 'down'}
                onLeverageChange={(d) => setState(d)}
            />
        </VStack>
    </ConfirmModal>
}