import { useFirmPositions } from "@app/hooks/useFirm";
import { VStack } from "@chakra-ui/react"
import { FirmPositionsTable } from "./Infos/FirmPositionsTable";
import { SkeletonBlob } from "../common/Skeleton";
import { F2MarketsParams } from "./F2MarketsParams";
import { NavButtons } from "../common/Button";
import { useState } from "react";
import { FirmPositions } from "./liquidations/firm-positions";

export const FirmMarketsAndPositions = ({
    vnetPublicId,
    defaultTab = 'Markets'
}: {
    vnetPublicId?: string
    defaultTab?: 'Markets' | 'Positions'
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const { positions, isLoading, markets } = useFirmPositions(vnetPublicId);
    return <VStack w='full'>
        <NavButtons
            maxW="400px"
            options={['Markets', 'Positions']}
            active={activeTab}
            onClick={(s) => setActiveTab(s)}
        />
        {
            isLoading ?
                <SkeletonBlob />
                :
                <VStack w='full'>
                    <VStack w="full" display={activeTab === 'Markets' ? 'block' : 'none'}>
                        <F2MarketsParams markets={markets} />
                    </VStack>
                    <VStack w="full" display={activeTab === 'Positions' ? 'block' : 'none'}>
                        {
                            vnetPublicId ? <FirmPositionsTable positions={positions} /> : <FirmPositions vnetPublicId={vnetPublicId} />
                        }
                    </VStack>
                </VStack>
        }
    </VStack>
}