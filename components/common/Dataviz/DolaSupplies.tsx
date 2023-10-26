import { getNetwork, getNetworkConfigConstants } from "@app/util/networks";
import { SupplyInfos } from "./SupplyInfos"
import { NetworkIds } from "@app/types";
import { Flex, Image } from "@chakra-ui/react";

const { DOLA, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const bridgeTypes = {
    multi: 'Multichain bridge',
    native: 'Native bridge',
}

const chainBridgeTypes = {
    [NetworkIds.avalanche]: bridgeTypes.multi,
    [NetworkIds.bsc]: bridgeTypes.multi,
    [NetworkIds.ftm]: bridgeTypes.multi,
    [NetworkIds.base]: bridgeTypes.native,
    [NetworkIds.optimism]: bridgeTypes.native,
    [NetworkIds.arbitrum]: bridgeTypes.native,
    [NetworkIds.polygon]: bridgeTypes.native,
}

const dola = TOKENS[DOLA];

export const DolaSupplies = ({
    supplies
}: {
    supplies: {
        supply: number
        chainId: NetworkIds
    }[]
}) => {
    return <SupplyInfos
        title={
            <Flex alignItems="center">
                <Image borderRadius="50px" mr="2" display="inline-block" src={dola.image} ignoreFallback={true} w='15px' h='15px' />
                {dola.symbol} Total Supplies:
            </Flex>
        }
        token={TOKENS[DOLA]}
        supplies={
            supplies.map(s => {
                const network = getNetwork(s.chainId);
                const extraInfo = chainBridgeTypes[network.id];
                const label = extraInfo ? `${network.name} (${extraInfo})` : network.name;
                return {
                    ...s,
                    label,
                }
            })
        }
    />
}