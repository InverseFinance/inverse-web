import ConfirmModal from "@app/components/common/Modal/ConfirmModal"
import { Checkbox, VStack } from "@chakra-ui/react"
import { FirmFAQ } from "../Infos/FirmFAQ"
import { useContext, useState } from "react";
import { F2MarketContext } from "../F2Contex";
import { gaEvent } from "@app/util/analytics";

export const FirstTimeModal = () => {
    const [isFaqRead, setIsFaqRead] = useState(false);
    const [dontRemindMe, setDontRemindMe] = useState(true);
    const {
        isFirstTimeModalOpen,
        onFirstTimeModalClose,
        firstTimeModalResolverRef,
        setNotFirstTime,
    } = useContext(F2MarketContext);

    const cancel = () => {        
        firstTimeModalResolverRef.current('cancel');
        onFirstTimeModalClose();
        setIsFaqRead(false);
        setDontRemindMe(true);
        gaEvent({ action: 'FiRM-first-time-modal-cancel' });
    };

    const ok = () => {
        firstTimeModalResolverRef.current('continue');
        onFirstTimeModalClose();
        if(dontRemindMe) {
            setNotFirstTime(true);
        }
        gaEvent({ action: 'FiRM-first-time-modal-continue' });
    };

    return <ConfirmModal
        title="First time borrowing on FiRM?"
        isOpen={isFirstTimeModalOpen}
        onClose={cancel}
        onOk={ok}
        onCancel={cancel}
        okDisabled={!isFaqRead}
        okLabel="Continue"
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <FirmFAQ smaller={true} collapsable={true} defaultCollapse={true} labelProps={{ fontSize: '14px' }} />
            <Checkbox isChecked={isFaqRead} onChange={() => setIsFaqRead(!isFaqRead)} spacing='1rem' size='sm' value='true' fontSize='14px'>
                I read the FAQ and know that my DBR balance will go down over time when having an active loan. To avoid replenishment fees, I need to keep a positive DBR balance in my wallet.
            </Checkbox>
            <Checkbox isChecked={dontRemindMe} onChange={() => setDontRemindMe(!dontRemindMe)} spacing='1rem' size='sm'>
                Don't show this modal again.
            </Checkbox>
        </VStack>
    </ConfirmModal>
}