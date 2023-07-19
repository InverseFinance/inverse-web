import { VStack, Text } from "@chakra-ui/react"
import { useContext } from "react";
import { F2MarketContext } from "../F2Contex";
import InfoModal from "@app/components/common/Modal/InfoModal";

export const DbrV1IssueModal = () => {
    const {
        isDbrV1NewBorrowIssueModalOpen,
        onDbrV1NewBorrowIssueModalClose,
    } = useContext(F2MarketContext);

    const ok = () => {
        onDbrV1NewBorrowIssueModalClose();
    };

    return <InfoModal
        title="New borrows issue with this account"
        isOpen={isDbrV1NewBorrowIssueModalOpen}
        onOk={ok}
        onClose={onDbrV1NewBorrowIssueModalClose}
        okLabel="OK"
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <Text>
                There is a minor issue with new borrows for this account that could incur extra DBR fees.
            </Text>
            <Text>
                Please reach out to the team on discord for more information on how to proceed.
            </Text>
        </VStack>
    </InfoModal>
}