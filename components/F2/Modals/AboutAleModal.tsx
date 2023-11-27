import { Text, VStack } from "@chakra-ui/react"
import Link from "@app/components/common/Link";
import InfoModal from "@app/components/common/Modal/InfoModal";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { ALE_SWAP_PARTNER } from "@app/util/firm-ale";

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
        onOk={onClose}
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack spacing="4" p='4' alignItems="flex-start">
            <Text>
                The Accelerated Leverage Engine (ALE) is a feature that allows to increase the exposition to the collateral asset by flash-minting DOLA, buying the collateral on DEXes (via the {ALE_SWAP_PARTNER} protocol and api) depositing the collateral, and then borrowing DOLA to burn the previously flash-minted DOLA.
            </Text>
            <Text>The result is similar to a "spot leverage"</Text>
            <Text>There is no fee charged for the service</Text>
            <Link textDecoration="underline" href="https://docs.inverse.finance/" isExternal target="_blank">
                Learn more about ALE <ExternalLinkIcon />
            </Link>
            <Link textDecoration="underline" href="https://1inch.io/api/" isExternal target="_blank">
                Learn more about the {ALE_SWAP_PARTNER} api / protocol <ExternalLinkIcon />
            </Link>
        </VStack>
    </InfoModal>
}