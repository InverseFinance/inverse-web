import { VStack, HStack, Text } from "@chakra-ui/react"
import SimpleModal from "./SimpleModal"
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap"
import Link from "../Link"
import { InfoMessage } from "../Messages"

export const EnsoModal = ({
    isOpen,
    onClose,
    defaultTokenOut,
    defaultTargetChainId,
    ensoPoolsLike,
    resultAsset,
}: {
    isOpen: boolean
    onClose: () => void
    defaultTokenOut: string
    defaultTargetChainId: string
    ensoPoolsLike: any[]
    resultAsset: any
}) => {
    return <SimpleModal
        title="Zap into a liquidity pool easily (BETA)"
        isOpen={isOpen}
        onClose={onClose}
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack p="4">
            <InfoMessage
                alertProps={{ w: 'full', fontSize: '14px' }}
                description="Zapping allows you to go from one asset to a liquidity pool position, this shortcuts actions like splitting into two tokens, approving them both and depositing them both. The LP token will be in your wallet, you can then stake it on the corresponding protocol website to earn yield."
            />
            <EnsoZap
                defaultTokenOut={defaultTokenOut}
                defaultTargetChainId={defaultTargetChainId}
                ensoPools={ensoPoolsLike}
            />
            <InfoMessage
                alertProps={{ w: 'full', fontSize: '14px' }}
                description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
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
                            Provided as-is, perform your own due diligence.
                        </Text>
                    </VStack>
                }
            />
        </VStack>
    </SimpleModal>
}