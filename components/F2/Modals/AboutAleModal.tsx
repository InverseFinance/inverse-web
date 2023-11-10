import { Text, VStack } from "@chakra-ui/react"
import Link from "@app/components/common/Link";
import InfoModal from "@app/components/common/Modal/InfoModal";

export const AboutAleModal = ({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) => {
    return <InfoModal
        title="About the Accelerated Leverage Engine"
        isOpen={isOpen}
        onClose={onClose}
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <Text>
                The Accelerated Leverage Engine (ALE) is a feature that allows to increase the exposition to the collateral asset by flash-minting DOLA, buying the collateral on DEXes (via the 0x protocol and api) depositing the collateral, and then borrowing DOLA to burn the previously flash-minted DOLA.
            </Text>
            <Text>The result is similar to a "spot leverage"</Text>
            <Link textDecoration="underline" href="https://docs.inverse.finance/" isExternal target="_blank">
                Learn more about ALE
            </Link>
        </VStack>
    </InfoModal>
}