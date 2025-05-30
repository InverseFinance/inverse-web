import { Text, VStack } from "@chakra-ui/react"
import Link from "@app/components/common/Link";
import InfoModal from "@app/components/common/Modal/InfoModal";
import { ExternalLinkIcon } from "@chakra-ui/icons";

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
                The Accelerated Leverage Engine (ALE) is a feature that allows to increase the exposition to the collateral asset by flash-minting DOLA, acquiring the collateral (via 1inch, odos or other) depositing the collateral, and then borrowing DOLA to burn the previously flash-minted DOLA. To summarize your position will have more collateral than what you deposited but the DOLA you borrow will not go to your wallet.
            </Text>
            <Text>The result is similar to a "spot leverage" or doing "looping"</Text>
            <Text>There is no fee charged for the service</Text>
            <Link textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/firm#accelerated-leverage-engine" isExternal target="_blank">
                Learn more about ALE <ExternalLinkIcon />
            </Link>
        </VStack>
    </InfoModal>
}