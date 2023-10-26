import { getNetwork, getNetworkConfigConstants } from "@app/util/networks";
import { NetworkIds, Token } from "@app/types";
import { Flex, Image, SkeletonText, Text } from "@chakra-ui/react";
import { InfoMessage } from "../Messages";
import { shortenNumber } from "@app/util/markets";
import Link from "../Link";

const { DOLA, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const bridgeTypes = {
    multi: '"anyDOLA", Multichain Bridge',
    native: 'Native Bridge',
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

const Img = ({ src }: { src: string }) =>
    <Image mx="1" borderRadius="10px" display="inline-block" src={src} ignoreFallback={true} w='15px' h='15px' />

export const DolaSupplies = ({
    supplies,
    isLoading = false,
}: {
    supplies: { supply: number, chainId: NetworkIds, name?: string, projectImage?: string }[],
    isLoading?: boolean,
}) => {
    const totalSupply = supplies.reduce((prev, curr) => prev + curr.supply, 0);
    const native = supplies.filter(s => [NetworkIds.mainnet, NetworkIds.base, NetworkIds.optimism, NetworkIds.arbitrum, NetworkIds.polygon].includes(s.chainId));
    const nonNative = supplies.filter(s => ![NetworkIds.mainnet, NetworkIds.base, NetworkIds.optimism, NetworkIds.arbitrum, NetworkIds.polygon].includes(s.chainId));
    const sortedNative = [...native].sort((a, b) => b.supply - a.supply);
    const sortedNonNative = [...nonNative].sort((a, b) => b.supply - a.supply);

    return (
        <InfoMessage
            showIcon={false}
            iconProps={{ fontSize: '16px' }}
            alertProps={{ fontSize: '12px', w: 'full', p: '4' }}
            description={
                isLoading ? <SkeletonText /> :
                    <>
                        <Flex alignItems="center">
                            <Image borderRadius="50px" mr="2" display="inline-block" src={dola.image} ignoreFallback={true} w='15px' h='15px' />
                            DOLA Total Supplies:
                        </Flex>
                        {
                            sortedNative.map(({ supply, chainId, name, projectImage }, i) => {
                                const network = getNetwork(chainId);
                                const extraInfo = chainBridgeTypes[network.id];
                                const label = extraInfo ? `${network.name} (${extraInfo})` : network.name;
                                return (
                                    <Flex key={i} position="relative" direction="row" w='full' justify="space-between" alignItems="center">
                                        <Flex alignItems="center">
                                            <Text>-</Text>
                                            <Img src={projectImage ? `${projectImage}` : network.image!} />
                                            <Text lineHeight="15px">{label}:</Text>
                                        </Flex>
                                        <Text>{shortenNumber(supply)} ({shortenNumber(totalSupply ? supply / totalSupply * 100 : 0)}%)</Text>
                                    </Flex>
                                )
                            })
                        }
                        <Text alignItems="center">
                            Bridge DOLA IOU Total Supplies:
                        </Text>
                        {
                            sortedNonNative.map(({ supply, chainId, name, projectImage }, i) => {
                                const network = getNetwork(chainId);
                                const extraInfo = chainBridgeTypes[network.id];
                                const label = extraInfo ? `${network.name} (${extraInfo})` : network.name;
                                return (
                                    <Flex key={i} position="relative" direction="row" w='full' justify="space-between" alignItems="center">
                                        <Flex alignItems="center">
                                            <Text>-</Text>
                                            <Img src={projectImage ? `${projectImage}` : network.image!} />
                                            <Text lineHeight="15px">{label}:</Text>
                                        </Flex>
                                        <Text>{shortenNumber(supply)} ({shortenNumber(totalSupply ? supply / totalSupply * 100 : 0)}%)</Text>
                                    </Flex>
                                )
                            })
                        }
                        <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                            <Text>- Total Cross-Chain:</Text>
                            <Text>{shortenNumber(totalSupply)}</Text>
                        </Flex>
                        <Link textDecoration="underline" isExternal target="_blank" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola">
                            Learn more about DOLA
                        </Link>
                    </>
            }
        />
    )
}