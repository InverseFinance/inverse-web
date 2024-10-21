import { VStack } from "@chakra-ui/react"
import SimpleModal from "./SimpleModal"
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap"

export const EnsoModal = ({
    isOpen,
    onClose,
    defaultTokenOut,
    defaultTargetChainId,
    ensoPoolsLike,
    title = "Zap into a liquidity pool easily (BETA)",
    isSingleChoice = false,
    resultAsset,
    introMessage = "Zapping allows you to go from one asset to a liquidity pool position, this shortcuts actions like splitting into two tokens, approving them both and depositing them both. The LP token will be in your wallet, you can then stake it on the corresponding protocol website to earn yield.",
    targetAssetPrice = 0,
}: {
    isOpen: boolean
    onClose: () => void
    defaultTokenOut: string
    defaultTargetChainId: string
    ensoPoolsLike: any[]
    resultAsset: any
    title: string
    introMessage: any
    isSingleChoice: boolean,
    targetAssetPrice: number
}) => {
    return <SimpleModal
        title={title}
        isOpen={isOpen}
        onClose={onClose}
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <VStack p="4">
            <EnsoZap
                defaultTokenOut={defaultTokenOut}
                defaultTargetChainId={defaultTargetChainId}
                ensoPools={ensoPoolsLike}
                introMessage={introMessage}
                isSingleChoice={isSingleChoice}
                targetAssetPrice={targetAssetPrice}
            />
        </VStack>
    </SimpleModal>
}