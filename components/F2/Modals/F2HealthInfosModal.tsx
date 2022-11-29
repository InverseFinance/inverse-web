import { VStack, Text, Image } from "@chakra-ui/react"
import InfoModal from "@app/components/common/Modal/InfoModal"

export const F2HealthInfosModal = ({
    onClose,
    isOpen,
}: {
    onClose: () => void
    isOpen: boolean
}) => {
    return <InfoModal
        title={`What is the Loan Health?`}
        onClose={onClose}
        onOk={onClose}
        isOpen={isOpen}
        minW={{ base: '98vw', lg: '650px' }}
        okLabel="Close"
    >
        <VStack w='full' py="4" px="8" alignItems="flex-start" spacing="4">
            <Text fontSize="18px" fontWeight="bold">
                Price dips can damage your Loan Health!
            </Text>
            <VStack w='full' bgColor="white" p="2" borderRadius="50px">
                <Image src="/assets/firm/health.svg" w="full" h="100px" />
            </VStack>
            <Text textAlign="left">
                - The Higher the Health the lesser is the chance of liquidations.
            </Text>
            <Text textAlign="left">
                - The percentage represents how much your collateral covers the loan.
            </Text>
            <Text textAlign="left">
                - If the loan is not covered enough by your collateral, it can be liquidated.
            </Text>
            <Text textAlign="left">
                - Your loan should not equal or exceed: <i>Collateral Factor * Collateral Worth</i>
            </Text>
            <Text textAlign="left">
                - The Liquidation Price indicates the Collateral Price at which liquidations can happen
            </Text>
            <Text textAlign="left">
                - Your debt can be increased if you run out of DBR tokens during the loan
            </Text>
        </VStack>
    </InfoModal>
}