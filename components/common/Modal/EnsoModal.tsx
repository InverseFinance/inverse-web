import { VStack } from "@chakra-ui/react"
import SimpleModal from "./SimpleModal"
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap"

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
            <EnsoZap
                defaultTokenOut={defaultTokenOut}
                defaultTargetChainId={defaultTargetChainId}
                ensoPools={ensoPoolsLike}
            />
        </VStack>
    </SimpleModal>
}