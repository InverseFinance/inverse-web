import { VStack, HStack, Text } from "@chakra-ui/react"
import SimpleModal from "./SimpleModal"
import EnsoZap from "@app/components/ThirdParties/EnsoZap"
import Link from "../Link"
import { InfoMessage } from "../Messages"

export const EnsoModal = ({
    isOpen,
    onClose,
    defaultTokenOut,
    defaultTargetChainId,
    ensoPoolsLike
}: {
    isOpen: boolean
    onClose: () => void
    defaultTokenOut: string
    defaultTargetChainId: string
    ensoPoolsLike: any[]
}) => {
    return <SimpleModal
        title="Zap-in / Zap-out"
        isOpen={isOpen}
        onClose={onClose}
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack p="4">
            <EnsoZap
                defaultTokenOut={defaultTokenOut}
                defaultTargetChainId={defaultTargetChainId}
                ensoPools={ensoPoolsLike}
            />
            <InfoMessage
                alertProps={{ w: 'full' }}
                description={
                    <VStack w='full' alignItems="flex-start">
                        <HStack spacing="1">
                            <Text>Powered by the third-party</Text>
                            <Link textDecoration="underline" target="_blank" isExternal={true} href="https://www.enso.finance/">
                                Enso Finance
                            </Link>
                        </HStack>
                        <Text textDecoration="underline">
                            Inverse Finance does not give any Financial Advice and do not endorse or audit Enso and the protocols related to this yield opportunity.
                        </Text>
                        <Text fontWeight="bold">
                            Perform your own due diligence before using this yield opportunity.
                        </Text>
                    </VStack>
                }
            />
        </VStack>
    </SimpleModal>
}