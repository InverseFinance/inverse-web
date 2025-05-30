import { VStack } from "@chakra-ui/react"
import SimpleModal from "./SimpleModal"
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap"
import { ErrorBoundary } from "next/dist/client/components/error-boundary"

export const EnsoModal = ({
    isOpen,
    onClose,
    defaultTokenIn,
    defaultTokenOut,
    defaultTargetChainId,
    ensoPoolsLike,
    title = "Zap into a liquidity pool easily",
    isSingleChoice = false,
    resultAsset,
    introMessage = "Zapping allows you to go from one asset to a liquidity pool position. The LP token will be in your wallet, you can then stake it on the corresponding protocol website to earn the yield.",
    targetAssetPrice = 0,
}: {
    isOpen: boolean
    onClose: () => void
    defaultTokenIn?: string
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
        modalProps={{ minW: { base: '98vw', lg: '650px' }, scrollBehavior: 'inside' }}
    >
        <VStack p="4">
            <ErrorBoundary description="Failed to load Zap component">
                <EnsoZap
                    defaultTokenIn={defaultTokenIn}
                    defaultTokenOut={defaultTokenOut}
                    defaultTargetChainId={defaultTargetChainId}
                    ensoPools={ensoPoolsLike}
                    introMessage={introMessage}
                    isSingleChoice={isSingleChoice}
                    targetAssetPrice={targetAssetPrice}
                />
            </ErrorBoundary>
        </VStack>
    </SimpleModal>
}