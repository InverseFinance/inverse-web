import ConfirmModal from "@app/components/common/Modal/ConfirmModal"
import { VStack } from "@chakra-ui/react"
import { useContext, useState } from "react";
import { F2MarketContext } from "../F2Contex";
import { FirmBoostInfos } from "../ale/FirmBoostInfos";
import { prepareDeleveragePosition, prepareLeveragePosition } from "@app/util/firm-ale";
import { getNumberToBn } from "@app/util/markets";

export const FirmLeverageModal = () => {
    const [state, setState] = useState({ deltaBorrow: 0, borrowLimit: 0, newDebt: 0, withdrawAmount: 0 });

    const {
        isFirmLeverageEngineOpen,
        onFirmLeverageEngineClose,
        signer,
        market,
        isDeposit,
        debt,
    } = useContext(F2MarketContext);

    const cancel = () => {
        onFirmLeverageEngineClose();
    };

    const ok = async () => {
        if(isDeposit) {
            return prepareLeveragePosition(signer, market, getNumberToBn(state.deltaBorrow));
        }
        const repayAmount = Math.min(-state.deltaBorrow, debt);
        return prepareDeleveragePosition(signer, market, getNumberToBn(repayAmount), getNumberToBn(state.withdrawAmount));
    };

    return <ConfirmModal
        title="FiRM Leverage Engine"
        isOpen={isFirmLeverageEngineOpen}
        onClose={cancel}
        onOk={ok}
        onCancel={cancel}
        okDisabled={state.deltaBorrow > market.leftToBorrow || state.borrowLimit >= 99}
        okLabel="Continue"
        onSuccess={() => onFirmLeverageEngineClose()}
        modalProps={{ minW: { base: '98vw', lg: '900px' }, scrollBehavior: 'inside' }}
    >
        <VStack id="vss" w='full' spacing="4" p={'4'} alignItems="flex-start">
            <FirmBoostInfos
                type={isDeposit ? 'up' : 'down'}
                onLeverageChange={(d) => setState(d)}
            />
        </VStack>
    </ConfirmModal>
}