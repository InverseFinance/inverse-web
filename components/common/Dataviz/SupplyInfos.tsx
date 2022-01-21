import { Flex, Image, Text } from '@chakra-ui/react'
import { shortenNumber } from '@inverse/util/markets'
import { InfoMessage } from '@inverse/components/common/Messages'
import { Token, NetworkIds } from '@inverse/types';
import { getNetwork } from '@inverse/config/networks';

const Img = ({ src }: { src: string }) =>
    <Image display="inline-block" src={src} ignoreFallback={true} w='15px' h='15px' />

export const SuppplyInfos = ({
    title,
    supplies,
    token,
}: {
    title?: React.ReactNode,
    supplies: { supply: number, chainId: NetworkIds, name?: string }[],
    token?: Token,
}) => {
    const totalSupply = supplies.reduce((prev, curr) => prev + curr.supply, 0);
    return (
        <InfoMessage
            title={
                token ? <>
                    <Image mr="2" display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' />
                    {token.symbol} Total Supplies : 
                </>
                : title
            }
            alertProps={{ fontSize: '12px', w: 'full' }}
            description={
                <>
                    {
                        supplies.map(({ supply, chainId, name, projectImage }, i) => {
                            const network = getNetwork(chainId);
                            return (
                                <Flex key={i} position="relative" direction="row" w='full' justify="space-between" alignItems="center">
                                    <Flex alignItems="center">
                                        <Text>-</Text>
                                        <Text mx="1"><Img src={projectImage ? `/assets/projects/${projectImage}` : network.image!} /></Text>
                                        <Text lineHeight="15px">On {name || network.name}:</Text>
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
                </>
            }
        />
    )
}